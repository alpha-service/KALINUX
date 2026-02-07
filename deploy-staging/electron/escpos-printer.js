/**
 * ESC/POS Thermal Printer Module
 * Handles RAW ESC/POS command generation for thermal printing
 * 
 * Supports multiple interfaces:
 * - Windows Spooler (RAW mode via file write to printer share)
 * - USB (via escpos-usb / WinUSB driver - optional)
 * - Network (TCP socket to port 9100)
 * 
 * Usage: Called from main.js via IPC to print receipts directly to thermal printer
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

// Try to load escpos-usb, but don't fail if not available
let escpos, escposUSB;
try {
  escpos = require('escpos');
  escposUSB = require('escpos-usb');
  escpos.USB = escposUSB;
} catch (e) {
  console.warn('escpos-usb not available, USB direct mode disabled');
}

// Printer configuration (stored in memory, should be persisted)
let printerConfig = {
  interface: 'windows', // 'usb', 'windows', 'network'
  printerName: 'appPOS80AMUSE', // Windows printer name
  networkIp: '',
  networkPort: 9100,
  encoding: 'cp437'
};

/**
 * ESC/POS Command Builder
 * Generates ESC/POS byte sequences for thermal printing
 */
class ESCPOSBuilder {
  constructor() {
    this.commands = [];
  }

  init() {
    this.commands.push(Buffer.from([0x1B, 0x40]));
    return this;
  }

  text(str) {
    this.commands.push(Buffer.from(str, 'utf8'));
    return this;
  }

  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.commands.push(Buffer.from([0x0A]));
    }
    return this;
  }

  align(position) {
    const alignMap = { left: 0, center: 1, right: 2 };
    const value = alignMap[position] !== undefined ? alignMap[position] : position;
    this.commands.push(Buffer.from([0x1B, 0x61, value]));
    return this;
  }

  bold(enabled = true) {
    this.commands.push(Buffer.from([0x1B, 0x45, enabled ? 1 : 0]));
    return this;
  }

  setMode(mode) {
    this.commands.push(Buffer.from([0x1B, 0x21, mode]));
    return this;
  }

  size(width = 0, height = 0) {
    const value = (height << 4) | width;
    this.commands.push(Buffer.from([0x1D, 0x21, value]));
    return this;
  }

  underline(mode = 1) {
    this.commands.push(Buffer.from([0x1B, 0x2D, mode]));
    return this;
  }

  cut(type = 'full', feedLines = 0) {
    const cutType = type === 'partial' ? 1 : 0;
    if (feedLines > 0) {
      this.commands.push(Buffer.from([0x1D, 0x56, 66, feedLines]));
    } else {
      this.commands.push(Buffer.from([0x1D, 0x56, cutType]));
    }
    return this;
  }

  line(char = '-', width = 48) {
    this.text(char.repeat(width));
    this.feed(1);
    return this;
  }

  barcode(data) {
    this.commands.push(Buffer.from([0x1D, 0x6B, 0x43, data.length]));
    this.commands.push(Buffer.from(data, 'utf8'));
    return this;
  }

  build() {
    return Buffer.concat(this.commands);
  }
}

/**
 * Print via Windows Spooler using RAW mode
 * Uses Windows Print Spooler RAW API via PowerShell
 */
async function printViaWindowsSpooler(printerName, buffer) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), 'escpos_' + Date.now() + '.bin');

    try {
      fs.writeFileSync(tempFile, buffer);
      console.log('Temp file created: ' + tempFile + ' (' + buffer.length + ' bytes)');

      // PowerShell script that uses the Windows Print Spooler RAW API
      const psScript = `
$ErrorActionPreference = 'Stop'
$tempFile = '${tempFile.replace(/\\/g, '\\\\')}'
$printerName = '${printerName}'

# Add type for RAW printing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
        IntPtr hPrinter = IntPtr.Zero;
        int dwWritten = 0;
        bool bSuccess = false;

        DOCINFOA di = new DOCINFOA();
        di.pDocName = "ESC/POS RAW Document";
        di.pDataType = "RAW";

        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(pBytes.Length);
                    Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return bSuccess;
    }
}
'@ -ErrorAction SilentlyContinue

$bytes = [System.IO.File]::ReadAllBytes($tempFile)
$result = [RawPrinter]::SendBytesToPrinter($printerName, $bytes)
if ($result) {
    Write-Output "SUCCESS"
} else {
    throw "Failed to send bytes to printer"
}
`;

      console.log('Sending RAW data to printer: ' + printerName);

      // Write PS script to file to avoid escaping issues
      const psFile = path.join(os.tmpdir(), 'print_' + Date.now() + '.ps1');
      fs.writeFileSync(psFile, psScript);

      exec('powershell -ExecutionPolicy Bypass -File "' + psFile + '"',
        { windowsHide: true, timeout: 30000 },
        function (error, stdout, stderr) {
          // Clean up temp files
          try { fs.unlinkSync(tempFile); } catch (e) { /* ignore */ }
          try { fs.unlinkSync(psFile); } catch (e) { /* ignore */ }

          if (error) {
            console.error('RAW print error:', error.message);
            console.error('stderr:', stderr);
            reject(new Error('Print failed: ' + (stderr || error.message)));
          } else if (stdout.indexOf('SUCCESS') !== -1) {
            console.log('Printed via Windows RAW API');
            resolve({ success: true, method: 'windows-raw' });
          } else {
            console.error('Print output:', stdout);
            reject(new Error('Print failed: unexpected output'));
          }
        }
      );
    } catch (error) {
      try { fs.unlinkSync(tempFile); } catch (e) { /* ignore */ }
      reject(error);
    }
  });
}

/**
 * Print via Network (TCP socket to port 9100)
 */
async function printViaNetwork(ip, port, buffer) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let connected = false;

    client.setTimeout(5000);

    client.connect(port, ip, function () {
      connected = true;
      console.log('Connected to ' + ip + ':' + port);

      client.write(buffer, function () {
        console.log('Sent ' + buffer.length + ' bytes');
        client.end();
      });
    });

    client.on('close', function () {
      if (connected) {
        console.log('Network print complete');
        resolve({ success: true, method: 'network' });
      }
    });

    client.on('timeout', function () {
      client.destroy();
      reject(new Error('Connection timeout to ' + ip + ':' + port));
    });

    client.on('error', function (err) {
      reject(new Error('Network print error: ' + err.message));
    });
  });
}

/**
 * Print via USB using escpos-usb (requires WinUSB driver)
 */
async function printViaUSB(buffer) {
  return new Promise((resolve, reject) => {
    if (!escpos || !escposUSB) {
      reject(new Error('escpos-usb not available'));
      return;
    }

    try {
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);

      device.open(function (error) {
        if (error) {
          console.error('Failed to open USB printer:', error);
          reject(new Error('Cannot open USB printer: ' + error.message));
          return;
        }

        console.log('USB Printer opened');

        printer
          .raw(buffer)
          .close(function () {
            console.log('USB print complete');
            resolve({ success: true, method: 'usb' });
          });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Smart print - automatically selects the best available method
 */
async function smartPrint(buffer) {
  const config = printerConfig;

  console.log('Printing with config:', JSON.stringify({
    interface: config.interface,
    printerName: config.printerName,
    networkIp: config.networkIp
  }));

  switch (config.interface) {
    case 'network':
      if (!config.networkIp) {
        throw new Error('Network IP not configured');
      }
      return await printViaNetwork(config.networkIp, config.networkPort || 9100, buffer);

    case 'usb':
      return await printViaUSB(buffer);

    case 'windows':
    default:
      if (!config.printerName) {
        throw new Error('Printer name not configured');
      }
      return await printViaWindowsSpooler(config.printerName, buffer);
  }
}

/**
 * Format date for receipt
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Build receipt ESC/POS buffer from document
 */
function buildReceiptBuffer(document) {
  const builder = new ESCPOSBuilder();

  // Header
  builder
    .init()
    .align('center')
    .size(1, 1)
    .bold(true)
    .text('ALPHA&CO')
    .feed(1)
    .bold(false)
    .size(0, 0)
    .text('Ninoofsesteenweg 77-79')
    .feed(1)
    .text('1700 Dilbeek')
    .feed(1)
    .text('TVA: BE 1028.386.674')
    .feed(2);

  // Document info
  builder
    .align('left')
    .bold(true)
    .text('DOC: ' + (document.number || 'N/A'))
    .feed(1)
    .bold(false)
    .text('Date: ' + formatDate(document.date || document.created_at))
    .feed(1);

  if (document.customer_name) {
    builder.text('Client: ' + document.customer_name).feed(1);
  }

  builder.line('=', 48).feed(1);

  // Items
  const items = document.items || [];
  items.forEach(function (item) {
    const qty = item.qty || item.quantity || 0;
    const price = item.unit_price || 0;
    const total = qty * price;
    const name = item.name || item.name_fr || item.description || 'Article';
    const truncName = name.substring(0, 32);

    builder
      .text(truncName)
      .feed(1)
      .text('  ' + qty + ' x ' + price.toFixed(2) + ' EUR')
      .feed(1)
      .align('right')
      .text(total.toFixed(2) + ' EUR')
      .feed(1)
      .align('left');
  });

  builder.line('=', 48);

  // Totals
  const subtotal = items.reduce(function (sum, item) {
    const q = item.qty || item.quantity || 0;
    const p = item.unit_price || 0;
    return sum + (p * q);
  }, 0);

  const vatRate = 0.21;
  const vatAmount = document.vat_total !== undefined ? document.vat_total : (subtotal * vatRate / (1 + vatRate));
  const total = document.total !== undefined ? document.total : subtotal;

  builder
    .bold(true)
    .text('SOUS-TOTAL HT:')
    .align('right')
    .text((total - vatAmount).toFixed(2) + ' EUR')
    .feed(1)
    .align('left')
    .text('TVA 21%:')
    .align('right')
    .text(vatAmount.toFixed(2) + ' EUR')
    .feed(1)
    .align('left')
    .size(1, 1)
    .text('TOTAL TTC:')
    .align('right')
    .text(total.toFixed(2) + ' EUR')
    .feed(1)
    .size(0, 0)
    .bold(false);

  builder.line('=', 48);

  // Payment info if available
  if (document.payments && document.payments.length > 0) {
    builder.align('left').text('Paiements:').feed(1);
    document.payments.forEach(function (payment) {
      const methodNames = {
        cash: 'Especes',
        card: 'Carte',
        bank_transfer: 'Virement'
      };
      const methodName = methodNames[payment.method] || payment.method;
      builder.text('  ' + methodName + ': ' + payment.amount.toFixed(2) + ' EUR').feed(1);
    });
    builder.feed(1);
  }

  // Footer
  builder
    .align('center')
    .feed(1)
    .text('Merci pour votre visite!')
    .feed(1)
    .text('www.alphanco.be')
    .feed(3)
    .cut('partial', 3);

  return builder.build();
}

/**
 * Print receipt to thermal printer
 */
async function printReceipt(document) {
  try {
    console.log('Building receipt for: ' + document.number);
    const buffer = buildReceiptBuffer(document);
    console.log('Receipt buffer size: ' + buffer.length + ' bytes');

    return await smartPrint(buffer);
  } catch (error) {
    console.error('Print receipt error:', error);
    throw error;
  }
}

/**
 * Test printer with simple ESC/POS sequence
 */
async function testPrinter() {
  const builder = new ESCPOSBuilder();

  builder
    .init()
    .align('center')
    .bold(true)
    .size(1, 1)
    .text('=== ESC/POS TEST ===')
    .feed(2)
    .bold(false)
    .size(0, 0)
    .text('Printer OK')
    .feed(1)
    .text(new Date().toLocaleString('fr-BE'))
    .feed(1)
    .text('--------------------------------')
    .feed(1)
    .text('Si vous voyez ce texte,')
    .feed(1)
    .text('le mode RAW fonctionne!')
    .feed(3)
    .cut('partial', 3);

  const buffer = builder.build();
  console.log('Test print buffer: ' + buffer.length + ' bytes');

  return await smartPrint(buffer);
}

/**
 * List available Windows printers
 */
async function listWindowsPrinters() {
  return new Promise(function (resolve) {
    exec('powershell -Command "Get-Printer | Select-Object Name, DriverName, PortName | ConvertTo-Json"',
      { windowsHide: true },
      function (error, stdout) {
        if (error) {
          console.error('Error listing printers:', error);
          resolve([]);
          return;
        }

        try {
          let printers = JSON.parse(stdout);
          if (!Array.isArray(printers)) {
            printers = [printers];
          }
          resolve(printers);
        } catch (e) {
          console.error('Error parsing printer list:', e);
          resolve([]);
        }
      }
    );
  });
}

/**
 * List available USB printers (via escpos-usb)
 */
function listUSBPrinters() {
  if (!escposUSB) {
    return [];
  }

  try {
    const devices = escposUSB.findPrinter();
    return devices.map(function (device, index) {
      return {
        index: index,
        vendorId: device.deviceDescriptor ? device.deviceDescriptor.idVendor : null,
        productId: device.deviceDescriptor ? device.deviceDescriptor.idProduct : null
      };
    });
  } catch (error) {
    console.error('Error listing USB printers:', error);
    return [];
  }
}

/**
 * List all available printers (Windows + USB)
 */
async function listAllPrinters() {
  const windowsPrinters = await listWindowsPrinters();
  const usbPrinters = listUSBPrinters();

  return {
    windows: windowsPrinters,
    usb: usbPrinters
  };
}

/**
 * Set printer configuration
 */
function setPrinterConfig(config) {
  printerConfig = Object.assign({}, printerConfig, config);
  console.log('Printer config updated:', printerConfig);
  return printerConfig;
}

/**
 * Get current printer configuration
 */
function getPrinterConfig() {
  return printerConfig;
}

/**
 * Diagnose printer setup
 */
async function diagnosePrinter() {
  const result = {
    config: printerConfig,
    windowsPrinters: [],
    usbPrinters: [],
    selectedPrinterFound: false,
    recommendations: []
  };

  result.windowsPrinters = await listWindowsPrinters();
  result.usbPrinters = listUSBPrinters();

  if (printerConfig.interface === 'windows') {
    const found = result.windowsPrinters.find(function (p) {
      return p.Name === printerConfig.printerName ||
        p.Name.indexOf(printerConfig.printerName) !== -1;
    });
    result.selectedPrinterFound = !!found;

    if (!found) {
      const names = result.windowsPrinters.map(function (p) { return p.Name; }).join(', ');
      result.recommendations.push(
        'Printer "' + printerConfig.printerName + '" not found. Available: ' + names
      );
    }
  }

  if (printerConfig.interface === 'usb') {
    if (result.usbPrinters.length === 0) {
      result.recommendations.push(
        'No USB printers found via escpos-usb. Install WinUSB driver using Zadig.'
      );
    }
  }

  return result;
}

module.exports = {
  printReceipt: printReceipt,
  testPrinter: testPrinter,
  listUSBPrinters: listUSBPrinters,
  listWindowsPrinters: listWindowsPrinters,
  listAllPrinters: listAllPrinters,
  setPrinterConfig: setPrinterConfig,
  getPrinterConfig: getPrinterConfig,
  diagnosePrinter: diagnosePrinter,
  ESCPOSBuilder: ESCPOSBuilder,
  printViaWindowsSpooler: printViaWindowsSpooler,
  printViaNetwork: printViaNetwork,
  printViaUSB: printViaUSB
};
