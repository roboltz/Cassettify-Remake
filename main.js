const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path');
const fs = require('node:fs/promises');

let win;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Connect preload.js to main path
      preload: path.join(__dirname, 'js/preload/preload.js'),
      sandbox: false
    }
  })
  // Remove toolbar
  //win.removeMenu();

  win.loadFile('views/index.html');
}

// Handle getting audio files and return only their paths
ipcMain.handle('open-file-dialog', async () => {
  const audioFiles = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac'] }]
  });

  if (audioFiles.canceled) return [];

  return audioFiles.filePaths;
});

// Read and return metadata from each cassette in the cassettes folder as a dictionary
ipcMain.handle('get-cassette-data', async () => {
  const cassetteFolder = __dirname + '/cassettes/';
  let cassetteList = await fs.readdir(cassetteFolder);
  let cassetteDataList = [];
  for (let i = 0; i < cassetteList.length; i++)  {
    cassetteDataList.push(JSON.parse(await fs.readFile(cassetteFolder + cassetteList[i] + '/meta.json')));
  }
  return cassetteDataList.sort((a, b) => a.artist.localeCompare(b.artist));
});

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