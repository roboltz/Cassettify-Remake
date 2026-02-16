const { exec } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('path');
const crypto = require("crypto")
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

// Returns the hash of any inputted file
function returnHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = require('fs').createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
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


// Outputs the song cover named after its hash to the cover images folder
async function retrieveAudioCover(audioPath) {
  const coverFolderPath = './cassetteAlbumCovers/';
  const tempCover = './temp/cover.jpg';
  fs.mkdir(coverFolderPath, { recursive: true });

  const cmd = `ffmpeg -y -i "${audioPath}" -map 0:v:0 -an "${tempCover}"`;
  await runCommand(cmd);

  const coverHash = await returnHash(tempCover);
  await fs.rename(tempCover, coverFolderPath + coverHash + ".jpg");
  
  return coverHash;
};


// Converts audio to another file type
async function convertAudio(audioPath, outputPath) {
  const cmd = `ffmpeg -i "${audioPath}" "${outputPath}"`;
  return await runCommand(cmd);
}


module.exports = async function initializeAudio (audioPath) {
  await fs.mkdir('./temp/');

  const songUUID = crypto.randomUUID();
  const folderPath = './cassettes/' + songUUID + '/';
  
  await fs.mkdir(folderPath + "originalAudio/", { recursive: true });

  const audioMeta = new Object();
  audioMeta.filename = path.basename(audioPath);
  audioMeta.coverHash = await retrieveAudioCover(audioPath);
  audioMeta.title = await audioTitle(audioPath);
  audioMeta.artist = await audioArtist(audioPath);
  audioMeta.duration = await audioDuration(audioPath);

  const audioMetaStr = JSON.stringify(audioMeta, null, 2).replace(/\\n/g, '')
  await fs.writeFile(folderPath + "meta.json", audioMetaStr);

  await convertAudio(audioPath, folderPath + "song.ogg");
  await fs.copyFile(audioPath, folderPath + "originalAudio/" + path.basename(audioPath));

  await fs.rm('./temp/', { recursive: true, force: true });
};