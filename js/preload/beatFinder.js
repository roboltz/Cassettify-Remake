const { exec } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('path');
const util = require('util');
const crypto = require('crypto');
const execPromise = util.promisify(exec);

async function runCommand(cmd) {
  try {
    const { stdout, _ } = await execPromise(cmd);
    return stdout || true;
  } catch (error) {
    console.error("Command failed: ", cmd, error);
    return null;
  }
}

module.exports = async function findBeats(audioPath) {
  const outputDir = './beat_finder/output';
  const reqId = crypto.randomUUID();
  const outputFile = path.join(outputDir, `beat_${reqId}.txt`);
  const ext = path.extname(audioPath);
  const tempInputFile = path.join(outputDir, `temp_${reqId}${ext}`);
  
  await fs.mkdir(outputDir, { recursive: true });

  try {
    await fs.copyFile(audioPath, tempInputFile);
  } catch (err) {
    console.error("Failed to copy file to temp for beat finding:", err);
    return [];
  }

  const cmd = `.\\beat_finder\\essentia_streaming_beattracker_multifeature_mirex2013.exe "${tempInputFile}" "${outputFile}"`;
  
  const success = await runCommand(cmd);

  // Clean up input file
  try { await fs.unlink(tempInputFile); } catch (e) {}

  if (!success) {
    try { await fs.unlink(outputFile); } catch (e) {}
    return [];
  }

  try {
    const data = await fs.readFile(outputFile, 'utf8');
    const beats = data.split('\n').map(b => b.trim().replace(',', '')).filter(b => b.length > 0);
    try { await fs.unlink(outputFile); } catch (e) {}
    return beats;
  } catch (err) {
    console.error("Failed to read beat output file", err);
    return [];
  }
};
