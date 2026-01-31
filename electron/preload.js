const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Navigation from menu
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },

  // ESC/POS Printer API
  printer: {
    listUSB: () => ipcRenderer.invoke('printer-list-usb'),
    listWindows: () => ipcRenderer.invoke('printer-list-windows'),
    listAll: () => ipcRenderer.invoke('printer-list-all'),
    test: () => ipcRenderer.invoke('printer-test'),
    printReceipt: (document) => ipcRenderer.invoke('printer-print-receipt', document),
    setConfig: (config) => ipcRenderer.invoke('printer-set-config', config),
    getConfig: () => ipcRenderer.invoke('printer-get-config'),
    diagnose: () => ipcRenderer.invoke('printer-diagnose')
  },

  // Platform detection
  isElectron: true,
  platform: process.platform,

  // Window controls (optional)
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
});

// Log that preload script ran
console.log('ALPHA&CO POS - Electron preload script loaded');
