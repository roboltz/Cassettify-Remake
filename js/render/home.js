async function selectAudioFiles() {
    const audioPaths = await window.filesystem.openFileDialog();
    // creates an item in the cassettes folder for each file selected in the file dialog
    for (const path of audioPaths) {
        await window.metadata.initializeAudio(path);
    }
    await updateAudioFiles()
}

async function updateAudioFiles() {
    const newDiv = document.createElement("div");
    let cassetteData = await window.metadata.getCassetteData();

    for (let i = 0; i < cassetteData.length; i++)  {
        console.log(cassetteData[i]);
        newDiv.textContent += cassetteData[i]["artist"] + " " + cassetteData[i]["title"] + "\n";
        //newDiv.textContent += JSON.stringify(cassetteData[i], null, 2).replace(/\\n/g, '');
    }
    //const newContent = document.createTextNode(await window.metadata.getCassetteData());


    document.body.appendChild(newDiv);
}