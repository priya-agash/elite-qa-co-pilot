const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ── Encryption helpers ────────────────────────────────────────────────────────
const SESSION_KEY = crypto.scryptSync(app.getPath('userData'), 'eliteqa-salt', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', SESSION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', SESSION_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
  } catch { return null; }
}

// ── Session storage path ──────────────────────────────────────────────────────
const SESSION_FILE = path.join(app.getPath('userData'), 'session.enc');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d0f14',
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Window controls
  ipcMain.handle('window-minimize', () => win.minimize());
  ipcMain.handle('window-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.handle('window-close', () => win.close());
  ipcMain.handle('window-is-maximized', () => win.isMaximized());

  win.on('maximize', () => win.webContents.send('window-maximized', true));
  win.on('unmaximize', () => win.webContents.send('window-maximized', false));

  return win;
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

// File open dialog
ipcMain.handle('dialog-open-file', async (_, filters) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters || [
      { name: 'All Supported', extensions: ['txt', 'log', 'pdf', 'text'] },
      { name: 'Log Files', extensions: ['txt', 'log', 'text'] },
      { name: 'PDF Files', extensions: ['pdf'] },
    ],
  });
  if (result.canceled) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { path: filePath, name: path.basename(filePath), content };
});

// Save file dialog
ipcMain.handle('dialog-save-file', async (_, { defaultName, content, filters }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: filters || [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (result.canceled) return false;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

// Save binary (xlsx)
ipcMain.handle('dialog-save-binary', async (_, { defaultName, buffer, filters }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: filters || [{ name: 'Excel', extensions: ['xlsx'] }],
  });
  if (result.canceled) return false;
  fs.writeFileSync(result.filePath, Buffer.from(buffer));
  return result.filePath;
});

// Session storage
ipcMain.handle('session-save', (_, data) => {
  const encrypted = encrypt(JSON.stringify(data));
  fs.writeFileSync(SESSION_FILE, encrypted, 'utf-8');
  return true;
});

ipcMain.handle('session-load', () => {
  if (!fs.existsSync(SESSION_FILE)) return null;
  const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
  const decrypted = decrypt(raw);
  if (!decrypted) return null;
  try { return JSON.parse(decrypted); } catch { return null; }
});

ipcMain.handle('session-clear', () => {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
  return true;
});

// Open external links safely
ipcMain.handle('open-external', (_, url) => {
  const allowed = /^https?:\/\//;
  if (allowed.test(url)) shell.openExternal(url);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
