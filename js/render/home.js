async function selectAudioFiles() {
    const audioPaths = await window.filesystem.openFileDialog();
    // creates an item in the cassettes folder for each file selected in the file dialog
    for (const path of audioPaths) {
        await window.metadata.initializeAudio(path);
    }
    await updateAudioFiles()
}