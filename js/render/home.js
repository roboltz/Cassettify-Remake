async function selectAudioFiles() {
    const audioPaths = await window.filesystem.openFileDialog()
    for (const path of audioPaths) {
        await window.metadata.initializeAudio(path);
    }
}