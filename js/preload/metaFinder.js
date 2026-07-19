const { exec } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('path');
const crypto = require("crypto");
const util = require('util');
const execPromise = util.promisify(exec);

// Supported video containers that we should extract frame from instead of embedded art
const VIDEO_EXTENSIONS = new Set(['.webm', '.mp4', '.m4v', '.mkv', '.avi', '.mov']);

async function runCommand(cmd, allowFail = false) {
  try {
    const { stdout } = await execPromise(cmd, { maxBuffer: 50 * 1024 * 1024 });
    return stdout || '';
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

// Returns the SHA-1 hash of any local file
function returnHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = require('fs').createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

// Extract the title tag from a media file
async function audioTitle(audioPath) {
  const cmd = `.\\ffmpeg\\ffprobe.exe -v error -show_entries format_tags=title -of default=nw=1:nk=1 "${audioPath}"`;
  const out = await runCommand(cmd, true);
  return out ? out.trim() : null;
}

// Extract the artist tag from a media file
async function audioArtist(audioPath) {
  const cmd = `.\\ffmpeg\\ffprobe.exe -v error -show_entries format_tags=artist -of default=nw=1:nk=1 "${audioPath}"`;
  const out = await runCommand(cmd, true);
  return out ? out.trim() : null;
}

// Extract duration in seconds
async function audioDuration(audioPath) {
  const cmd = `.\\ffmpeg\\ffprobe.exe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`;
  const out = await runCommand(cmd, true);
  return out ? out.trim() : null;
}

// Detect if the file has a video stream (for webm/mp4 etc.)
async function hasVideoStream(filePath) {
  const cmd = `.\\ffmpeg\\ffprobe.exe -v error -select_streams v:0 -show_entries stream=codec_type -of default=nw=1:nk=1 "${filePath}"`;
  const out = await runCommand(cmd, true);
  return out && out.trim() === 'video';
}

// Extract cover art (embedded for audio, or a frame for video).
// For video files, seeks to `frameTimeSec` (default 0) — user can override later.
async function retrieveAudioCover(audioPath, frameTimeSec = 0) {
  const coverFolderPath = './cassetteAlbumCovers/';
  const tempCover = './temp/cover.jpg';
  await fs.mkdir(coverFolderPath, { recursive: true });

  const ext = path.extname(audioPath).toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.has(ext);

  let cmd;
  if (isVideo) {
    // Seek to user-defined time and grab one video frame
    const seekArg = frameTimeSec > 0 ? `-ss ${frameTimeSec}` : '';
    cmd = `.\\ffmpeg\\ffmpeg.exe -y ${seekArg} -i "${audioPath}" -vframes 1 -q:v 2 "${tempCover}"`;
  } else {
    // Try to extract embedded album art (mp3, m4a, flac, opus, etc.)
    cmd = `.\\ffmpeg\\ffmpeg.exe -y -i "${audioPath}" -map 0:v:0 -an "${tempCover}"`;
  }

  try {
    await runCommand(cmd);
  } catch {
    // No cover / no video frame — return null (app shows placeholder)
    return null;
  }

  // Sanity check — file must exist and be non-empty
  try {
    const stat = await fs.stat(tempCover);
    if (stat.size === 0) return null;
  } catch {
    return null;
  }

  const coverHash = await returnHash(tempCover);
  const destPath = coverFolderPath + coverHash + '.jpg';
  await fs.rename(tempCover, destPath);
  return coverHash;
}

// Convert media to 11025 Hz OGG (the format used internally by the app for preview)
async function convertAudio(audioPath, outputPath) {
  // -map 0:a picks the first audio stream (works for video files too)
  const cmd = `.\\ffmpeg\\ffmpeg.exe -y -i "${audioPath}" -map 0:a:0 -map_metadata -1 -ar 11025 "${outputPath}"`;
  return await runCommand(cmd, true);
}

// Convert media to high-quality OGG for the final export
async function convertAudioToHighQualityOgg(audioPath, outputPath) {
  // -q:a 5 gives good VBR quality (approx 160kbps), -ar 44100 ensures a standard sample rate
  const cmd = `.\\ffmpeg\\ffmpeg.exe -y -i "${audioPath}" -map 0:a:0 -q:a 5 -ar 44100 "${outputPath}"`;
  return await runCommand(cmd, true);
}

// ────────────────────────────────────────────────────────────────
// Main entry point: initialise a single media file into the cassettes folder
// Accepts an optional frameTimeSec for video cover thumbnail extraction
// ────────────────────────────────────────────────────────────────
module.exports = async function initializeAudio(audioPath, frameTimeSec = 0, skipMeta = false) {
  console.log('[metaFinder] initializeAudio START:', audioPath, 'skipMeta:', skipMeta);
  const tempPath = './temp/';
  await fs.mkdir(tempPath, { recursive: true });

  const songUUID = crypto.randomUUID();
  const folderPath = './cassettes/' + songUUID + '/';
  await fs.mkdir(folderPath + 'originalAudio/', { recursive: true });
  console.log('[metaFinder] created cassette folder:', folderPath);

  const ext = path.extname(audioPath).toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.has(ext);
  console.log('[metaFinder] ext:', ext, '| isVideo:', isVideo);

  const audioMeta = {};
  // Always use OGG as the standardized final audio format
  audioMeta.filename    = 'audio.ogg';
  audioMeta.UUID        = songUUID;
  audioMeta.isVideo     = isVideo;
  audioMeta.frameTimeSec = isVideo ? frameTimeSec : undefined;

  console.log('[metaFinder] extracting cover...');
  audioMeta.coverHash   = skipMeta ? null : await retrieveAudioCover(audioPath, frameTimeSec);
  console.log('[metaFinder] coverHash:', audioMeta.coverHash);

  console.log('[metaFinder] reading title/artist/duration...');
  audioMeta.title       = skipMeta ? null : await audioTitle(audioPath);
  audioMeta.artist      = skipMeta ? null : await audioArtist(audioPath);
  audioMeta.originalTitle = audioMeta.title;
  audioMeta.originalArtist = audioMeta.artist;
  audioMeta.duration    = await audioDuration(audioPath);
  console.log('[metaFinder] meta:', audioMeta.title, '/', audioMeta.artist, '/', audioMeta.duration, 's');

  const audioMetaStr = JSON.stringify(audioMeta, null, 2);
  await fs.writeFile(folderPath + 'meta.json', audioMetaStr);

  console.log('[metaFinder] converting audio to OGG (preview)...');
  await convertAudio(audioPath, folderPath + 'song.ogg');
  
  console.log('[metaFinder] converting original to high-quality OGG (final)...');
  await convertAudioToHighQualityOgg(audioPath, folderPath + 'originalAudio/audio.ogg');

  await fs.rm(tempPath, { recursive: true, force: true });
  console.log('[metaFinder] initializeAudio DONE:', songUUID);
};

// Export the helper so the IPC handler can call it for re-extracting a cover frame
module.exports.retrieveAudioCover = retrieveAudioCover;
module.exports.VIDEO_EXTENSIONS = VIDEO_EXTENSIONS;