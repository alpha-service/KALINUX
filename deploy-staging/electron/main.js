const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const {
  printReceipt,
  testPrinter,
  listUSBPrinters,
  listWindowsPrinters,
  listAllPrinters,
  setPrinterConfig,
  getPrinterConfig,
  diagnosePrinter
} = require('./escpos-printer');

// Keep a global reference to prevent garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: 'ALPHA&CO POS System',
    show: false, // Don't show until ready
    backgroundColor: '#f8fafc' // Match brand-gray
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'ALPHA&CO POS',
      submenu: [
        { label: 'À propos', role: 'about' },
        { type: 'separator' },
        { label: 'Préférences', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Fichier',
      submenu: [
        { label: 'Nouvelle vente', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('navigate', '/pos') },
        { type: 'separator' },
        { label: 'Caisse', accelerator: 'CmdOrCtrl+K', click: () => mainWindow.webContents.send('navigate', '/cash-register') },
        { label: 'Documents', accelerator: 'CmdOrCtrl+D', click: () => mainWindow.webContents.send('navigate', '/documents') }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Refaire', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Tout sélectionner', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Actualiser', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Actualiser (forcé)', accelerator: 'Shift+CmdOrCtrl+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Zoom avant', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Taille normale', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein écran', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { label: 'Minimiser', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Fermer', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://alpha-co.be/pos/docs')
        },
        {
          label: 'Support',
          click: () => shell.openExternal('mailto:support@alpha-co.be')
        },
        { type: 'separator' },
        {
          label: 'Outils développeur',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for main process communication
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);

// ESC/POS Printer IPC Handlers
ipcMain.handle('printer-list-usb', async () => {
  try {
    const printers = listUSBPrinters();
    console.log('Found USB printers:', printers);
    return { success: true, printers };
  } catch (error) {
    console.error('Error listing USB printers:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-list-windows', async () => {
  try {
    const printers = await listWindowsPrinters();
    console.log('Found Windows printers:', printers);
    return { success: true, printers };
  } catch (error) {
    console.error('Error listing Windows printers:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-list-all', async () => {
  try {
    const printers = await listAllPrinters();
    console.log('All printers:', printers);
    return { success: true, printers };
  } catch (error) {
    console.error('Error listing all printers:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-test', async () => {
  try {
    const result = await testPrinter();
    return { success: true, method: result.method };
  } catch (error) {
    console.error('Test print failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-print-receipt', async (event, document) => {
  try {
    console.log('Printing receipt:', document.number);
    const result = await printReceipt(document);
    return { success: true, method: result.method };
  } catch (error) {
    console.error('Print receipt failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-set-config', async (event, config) => {
  try {
    const newConfig = setPrinterConfig(config);
    return { success: true, config: newConfig };
  } catch (error) {
    console.error('Set printer config failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-get-config', async () => {
  try {
    const config = getPrinterConfig();
    return { success: true, config };
  } catch (error) {
    console.error('Get printer config failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer-diagnose', async () => {
  try {
    const result = await diagnosePrinter();
    console.log('Printer diagnostics:', result);
    return { success: true, ...result };
  } catch (error) {
    console.error('Printer diagnose failed:', error);
    return { success: false, error: error.message };
  }
});

// Auto-updater (optional - requires electron-updater)
// const { autoUpdater } = require('electron-updater');
// autoUpdater.checkForUpdatesAndNotify();

