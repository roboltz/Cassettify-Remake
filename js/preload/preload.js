const { contextBridge, ipcRenderer } = require('electron');
const initializeAudio = require ('./metaFinder.js');

contextBridge.exposeInMainWorld('metadata', {
  initializeAudio: (audioPath) => initializeAudio(audioPath)
});

contextBridge.exposeInMainWorld('filesystem', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog')
});