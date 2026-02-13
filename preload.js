const { contextBridge, ipcRenderer } = require('electron');
const { exec } = require('node:child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runCommand(cmd) {
  console.log("running command: " + cmd);
  const { stdout, _ } = await execPromise(cmd);
  if (stdout) {
    return stdout;
  } else {
    return -1;
  }
}

// Returns the title of audio
async function audioTitle(audioPath) {
  const cmd = `ffprobe -v error -show_entries format_tags=title -of default=nw=1:nk=1 "${audioPath}"`;
  return await runCommand(cmd);
};

// Returns the artist of audio
async function audioArtist(audioPath) {
  const cmd = `ffprobe -v error -show_entries format_tags=artist -of default=nw=1:nk=1 "${audioPath}"`;
  return await runCommand(cmd);
};

// Returns the duration of audio
async function audioDuration(audioPath) {
  const cmd = `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`;
  return await runCommand(cmd);
};

// Outputs the song cover as an image file to destination
async function retrieveAudioCover(audioPath, outputImagePath) {
  const cmd = `ffmpeg -i "${audioPath}" -an -c:v copy "${outputImagePath}"`;
  return await runCommand(cmd);
};

contextBridge.exposeInMainWorld('ffmpeg', {
  audioTitle: audioTitle,
  audioArtist: audioArtist,
  audioDuration: audioDuration,
  retrieveAudioCover: retrieveAudioCover
});
