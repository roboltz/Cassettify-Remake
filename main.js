const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Connect preload.js to main path
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  })
  // Remove toolbar
  //win.removeMenu();

  win.loadFile('views/index.html');
}

// Start application
app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');
  createWindow();

  // Window setting for MacOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Window setting for Windows & Linux
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});