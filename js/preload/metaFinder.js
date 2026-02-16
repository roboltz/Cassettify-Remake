const { exec } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

async function runCommand(cmd) {
  console.log("running command: " + cmd);
  const { stdout, _ } = await execPromise(cmd);
  if (stdout) {
    return stdout;
  } else {
    return null;
  }
}

// Returns the title of audio
async function audioTitle(audioPath) {
  const cmd = `ffprobe -v error -show_entries format_tags=title -of default=nw=1:nk=1 "${audioPath}"`;
  return await runCommand(cmd)
};

// Returns the artist of audio
async function audioArtist(audioPath) {
  const cmd = `ffprobe -v error -show_entries format_tags=artist -of default=nw=1:nk=1 "${audioPath}"`;
  return await runCommand(cmd)
};

// Returns the duration of audio
async function audioDuration(audioPath) {
  const cmd = `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`;
  return await runCommand(cmd)
};

// Outputs the song cover as an image file to destination
async function retrieveAudioCover(audioPath, outputImagePath) {
  const cmd = `ffmpeg -i "${audioPath}" -an -c:v copy "${outputImagePath}"`;
  return await runCommand(cmd);
};

module.exports = async function initializeAudio (audioPath) {
  const songUUID = crypto.randomUUID();
  const folderPath = './cassettes/' + songUUID + '/';
  
  fs.mkdir(folderPath, { recursive: true });

  const audioMeta = new Object();
  audioMeta.filename = path.basename(audioPath);
  audioMeta.title = await audioTitle(audioPath);
  audioMeta.artist = await audioArtist(audioPath);
  audioMeta.duration = await audioDuration(audioPath);

  const audioMetaStr = JSON.stringify(audioMeta, null, 2).replace(/\\n/g, '')
  await fs.writeFile(folderPath + "meta.json", audioMetaStr);

  retrieveAudioCover(audioPath, folderPath + "cover.jpg" );
}
