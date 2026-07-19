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
  const audioFiles = await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
    properties: ['openFile', 'multiSelections'],
    filters: [{
      name: 'Audio / Video',
      extensions: ['mp3', 'ogg', 'wav', 'flac', 'm4a', 'aac', 'opus', 'mp4', 'm4v', 'webm', 'mkv', 'avi', 'mov']
    }]
  });

  if (audioFiles.canceled) return [];

  return audioFiles.filePaths;
});

// Re-extract video cover at a user-specified timestamp (for webm/mp4)
const { retrieveAudioCover } = require('./js/preload/metaFinder');
ipcMain.handle('reextract-cover', async (event, uuid, originalFilePath, frameTimeSec) => {
  try {
    const coverHash = await retrieveAudioCover(originalFilePath, frameTimeSec);
    if (!coverHash) return { success: false, error: 'No frame extracted' };
    // Update meta.json with the new coverHash and frameTimeSec
    const metaPath = path.join(__dirname, 'cassettes', uuid, 'meta.json');
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    meta.coverHash = coverHash;
    meta.frameTimeSec = frameTimeSec;
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
    return { success: true, coverHash };
  } catch (err) {
    return { success: false, error: err.message };
  }
});


// Read and return metadata from each cassette in the cassettes folder as a dictionary
ipcMain.handle('get-cassette-data', async () => {
  const cassetteFolder = __dirname + '/cassettes/';
  try {
    await fs.access(cassetteFolder);
  } catch {
    return []; // Folder doesn't exist yet, return empty list
  }
  
  let cassetteList = await fs.readdir(cassetteFolder);
  let cassetteDataList = [];
  for (let i = 0; i < cassetteList.length; i++)  {
    try {
        const meta = JSON.parse(await fs.readFile(cassetteFolder + cassetteList[i] + '/meta.json'));
        cassetteDataList.push(meta);
    } catch(err) {
        // Skip folders without valid meta.json
    }
  }
  return cassetteDataList.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
});

// Update cassette metadata in meta.json
ipcMain.handle('save-cassette-data', async (event, uuid, updatedData) => {
  const metaPath = path.join(__dirname, 'cassettes', uuid, 'meta.json');
  try {
    const rawData = await fs.readFile(metaPath, 'utf8');
    let meta = JSON.parse(rawData);
    
    // Update fields
    meta = { ...meta, ...updatedData };
    
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 4));
    return { success: true, meta: meta };
  } catch (err) {
    console.error(`Failed to update meta.json for ${uuid}:`, err);
    return { success: false, error: err.message };
  }
});

// Extract palette using node-vibrant
const { Vibrant } = require('node-vibrant/node');
ipcMain.handle('extract-palette', async (event, coverHash) => {
  const imagePath = path.join(__dirname, 'cassetteAlbumCovers', `${coverHash}.jpg`);
  try {
    const palette = await Vibrant.from(imagePath).getPalette();
    // Format the palette into hex strings
    return {
      success: true,
      palette: {
        Vibrant: palette.Vibrant ? palette.Vibrant.hex : null,
        Muted: palette.Muted ? palette.Muted.hex : null,
        DarkVibrant: palette.DarkVibrant ? palette.DarkVibrant.hex : null,
        DarkMuted: palette.DarkMuted ? palette.DarkMuted.hex : null,
        LightVibrant: palette.LightVibrant ? palette.LightVibrant.hex : null,
        LightMuted: palette.LightMuted ? palette.LightMuted.hex : null,
      }
    };
  } catch (err) {
    console.error(`Failed to extract palette for ${coverHash}:`, err);
    return { success: false, error: err.message };
  }
});

// Load audio file into a buffer
ipcMain.handle('get-audio-buffer', async (event, audioPath) => {
  try {
    const fullPath = path.join(__dirname, audioPath);
    const buffer = await fs.readFile(fullPath);
    return { success: true, buffer: buffer };
  } catch (err) {
    console.error(`Failed to load audio buffer for ${audioPath}:`, err);
    return { success: false, error: err.message };
  }
});

// Export cassette as .robobeat file
const { execFile } = require('node:child_process');
const crypto = require('node:crypto');
ipcMain.handle('export-cassette', async (event, uuid, destFolder, format = 'robobeat', customTextureBase64 = null) => {
    try {
      const metaPath = path.join(__dirname, 'cassettes', uuid, 'meta.json');
      const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
      if (!meta) throw new Error('Cassette not found in database.');

      const internalName = `custom_cassette_${Date.now()}`;
      const safeTitle = (meta.title || 'Untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const audioFile = meta.filename;
      if (!audioFile) throw new Error('No audio file associated.');
      
      const exportedSoundFilename = internalName + '_audio.ogg';
      
      // Parse lengths
      const startTime = parseFloat(meta.audioStart) || 0;
      const duration = parseFloat(meta.duration) || 0;
      const endTime = startTime + duration;
      
      // Parse beats
      const floatBeats = (meta.beats || []).map(b => parseFloat(b));
      
      // Parse visuals
      const visuals = meta.visuals || {};
      const color = visuals.CassetteColor || { r: 1, g: 1, b: 1 };
      
      const isCustom = visuals.CassetteTextureInternalName === 'CUSTOM';

      const configObj = {
        File: {
          InternalName: internalName,
          Info: {
            PathToAudioClip: `C:/Users/ethan/AppData/LocalLow/Inzanity/ROBOBEAT/cassette_audio/${exportedSoundFilename}`,
            InStorage: true,
            FileName: exportedSoundFilename,
            LengthOfClip: duration,
            PublicName: meta.title || 'Untitled',
            ArtistName: meta.artist || 'Unknown',
            BPM: 0
          },
          Beat: {
            StartTime: startTime,
            EndTime: endTime,
            VolumeOffset: 0.0,
            NumberOfBeats: floatBeats.length,
            Beats: floatBeats
          },
          Visuals: {
            CassetteTextureInternalName: isCustom ? (internalName + '.png') : (visuals.CassetteTextureInternalName || 'DEFAULT'),
            CassetteColor: { r: color.r || 1, g: color.g || 1, b: color.b || 1, a: 1.0 },
            CassetteStrength: 1.0,
            IsCustomTexture: isCustom
          },
          IsMixTape: false
        },
        InternalName: internalName
      };
      
      if (format === 'json') {
        const outputFile = path.join(destFolder, safeTitle + '.json');
        await fs.writeFile(outputFile, JSON.stringify(configObj, null, 4), 'utf8');
        return { success: true, outputFile };
      }
      
      // Otherwise it's 'robobeat' format (standard zipped .robobeat file)
      const tempFolder = path.join(__dirname, 'temp_export', internalName);
      await fs.mkdir(tempFolder, { recursive: true });
      
      const originalAudioDir = path.join(__dirname, 'cassettes', uuid, 'originalAudio');
      
      // 1. Copy audio file
      await fs.copyFile(path.join(originalAudioDir, audioFile), path.join(tempFolder, exportedSoundFilename));
      
      // 2. Export album cover / texture
      if (isCustom && customTextureBase64) {
        const base64Data = customTextureBase64.replace(/^data:image\/(jpeg|png);base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(path.join(tempFolder, internalName + '.png'), buffer);
      } else {
        const coverHash = meta.coverHash;
        if (coverHash) {
          const coverSrc = path.join(__dirname, 'cassetteAlbumCovers', coverHash + '.jpg');
          try {
            await fs.copyFile(coverSrc, path.join(tempFolder, internalName + '.jpg'));
          } catch {}
        }
      }
    
    // 3. Prepend the P1 header then write the .cassette file
    const p1 = '{\n    "Main": 5,\n    "Secondary": 8\n}';
    let configStr = p1 + JSON.stringify(configObj, null, 4);
    configStr = configStr.replace(/\r\n/g, '\n');
    const cassettePath = path.join(tempFolder, internalName + '.cassette');
    await fs.writeFile(cassettePath, configStr, 'utf8');
    
    // 4. Zip the temp folder -> rename to .robobeat
    const outputZip = path.join(destFolder, safeTitle + '.robobeat.zip');
    const outputFile = path.join(destFolder, safeTitle + '.robobeat');
    
    await new Promise((resolve, reject) => {
      const ps = require('node:child_process').execFile(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Compress-Archive -Path '${tempFolder}\\*' -DestinationPath '${outputZip.replace(/'/g, "''")}' -Force`
        ],
        (err, stdout, stderr) => {
          if (err) {
            console.error('PowerShell Error:', stderr);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
    
    try { await fs.unlink(outputFile); } catch {}
    await fs.rename(outputZip, outputFile);
    await fs.rm(tempFolder, { recursive: true, force: true });
    
    return { success: true, outputFile };
  } catch (err) {
    console.error('Export failed:', err);
    return { success: false, error: err.message };
  }
});

// Open a folder-select dialog for export destination
ipcMain.handle('select-export-folder', async () => {
  const result = await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
    properties: ['openDirectory'],
    title: 'Select Export Destination'
  });
  return result.canceled ? null : result.filePaths[0];
});

// Reset all user data: clear cassettes, covers, temp folders
ipcMain.handle('reset-user-data', async () => {
  try {
    const cassettesDir = path.join(__dirname, 'cassettes');
    const coversDir = path.join(__dirname, 'cassetteAlbumCovers');
    const tempExportDir = path.join(__dirname, 'temp_export');
    const tempDir = path.join(__dirname, 'temp');

    await fs.rm(cassettesDir, { recursive: true, force: true });
    await fs.rm(coversDir, { recursive: true, force: true });
    await fs.rm(tempExportDir, { recursive: true, force: true });
    await fs.rm(tempDir, { recursive: true, force: true });

    // Recreate empty dirs to prevent crash
    await fs.mkdir(cassettesDir, { recursive: true });
    await fs.mkdir(coversDir, { recursive: true });
    
    return { success: true };
  } catch (err) {
    console.error('Reset user data failed:', err);
    return { success: false, error: err.message };
  }
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