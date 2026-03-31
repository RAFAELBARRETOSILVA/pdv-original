const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  backup: {
    autoSave: (data) => ipcRenderer.invoke('backup:auto-save', data),
    export: (data) => ipcRenderer.invoke('backup:export', data),
    import: () => ipcRenderer.invoke('backup:import'),
    list: () => ipcRenderer.invoke('backup:list'),
    restoreAuto: (fileName) => ipcRenderer.invoke('backup:restore-auto', fileName),
    getPath: () => ipcRenderer.invoke('backup:get-path'),
  },
  printer: {
    list: () => ipcRenderer.invoke('printer:list'),
    printSilent: (printerName, html, paperWidth) => ipcRenderer.invoke('printer:print-silent', { printerName, html, paperWidth }),
  },
});
