const { contextBridge } = require('electron');
const initializeAudio = require ('./metaFinder.js');

contextBridge.exposeInMainWorld('metadata', {
  initializeAudio: (audioPath) => initializeAudio(audioPath)
});