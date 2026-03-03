const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximized: (cb) => ipcRenderer.on('window-maximized', (_, val) => cb(val)),

  // File dialogs
  openFile: (filters) => ipcRenderer.invoke('dialog-open-file', filters),
  saveFile: (opts) => ipcRenderer.invoke('dialog-save-file', opts),
  saveBinary: (opts) => ipcRenderer.invoke('dialog-save-binary', opts),

  // Encrypted session
  saveSession: (data) => ipcRenderer.invoke('session-save', data),
  loadSession: () => ipcRenderer.invoke('session-load'),
  clearSession: () => ipcRenderer.invoke('session-clear'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
