const { contextBridge, ipcRenderer } = require('electron');
const initializeAudio = require('./metaFinder.js');
const findBeats = require('./beatFinder.js');

contextBridge.exposeInMainWorld('metadata', {
  initializeAudio: async (audioPath, skipMeta = false) => {
    console.log('[preload] initializeAudio called:', audioPath, 'skipMeta:', skipMeta);
    try {
      const result = await initializeAudio(audioPath, 0, skipMeta);
      console.log('[preload] initializeAudio success:', audioPath);
      return result;
    } catch (err) {
      console.error('[preload] initializeAudio FAILED:', audioPath, err);
      throw err;
    }
  },
  findBeats: (audioPath) => findBeats(audioPath),
  getCassetteData: () => ipcRenderer.invoke('get-cassette-data'),
  saveCassetteData: (uuid, data) => ipcRenderer.invoke('save-cassette-data', uuid, data),
  extractPalette: (coverHash) => ipcRenderer.invoke('extract-palette', coverHash),
  getAudioBuffer: (audioPath) => ipcRenderer.invoke('get-audio-buffer', audioPath),
  reextractCover: (uuid, filePath, frameTimeSec) => ipcRenderer.invoke('reextract-cover', uuid, filePath, frameTimeSec)
});

contextBridge.exposeInMainWorld('filesystem', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  selectExportFolder: () => ipcRenderer.invoke('select-export-folder'),
  exportCassette: (uuid, destFolder, format, customTextureBase64) => ipcRenderer.invoke('export-cassette', uuid, destFolder, format, customTextureBase64),
  resetUserData: () => ipcRenderer.invoke('reset-user-data')
});