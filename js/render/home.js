async function selectAudioFiles() {
    const audioPaths = await window.filesystem.openFileDialog()
    console.log(audioPaths);
    for (const path of audioPaths) {
        await window.metadata.initializeAudio(path);
    }
}