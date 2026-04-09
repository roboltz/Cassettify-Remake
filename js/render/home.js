let audioList = [];


async function updateAudioFiles() {
    let cassetteData = await window.metadata.getCassetteData();
    const audioListContainer = document.getElementById("songlist-container");

    for (let i = 0; i < audioList.length; i++) {
        audioList[i].pause();
        audioList[i].currentTime = 0;
    };

    audioListContainer.textContent = '';

    for (let i = 0; i < cassetteData.length; i++) {
        let data = cassetteData[i];
        const audioContainer = document.createElement("div");
        audioContainer.id = "song-container-" + i;
        audioContainer.classList.add("song-container");

        const audio = new Audio(`../cassettes/${data.UUID}/originalAudio/${data.filename}`);
        audioList[i] = audio;

        audioContainer.innerHTML = `
            <figure>
                <div class="image-container" onclick="document.getElementById('song-container-${i}').classList.toggle('active'); setAudioState(${i});">
                    <img src="../cassetteAlbumCovers/${data.coverHash}.jpg" alt="${data.coverHash}"/>
                </div>
                <figcaption>
                    <li>
                        <ul>${data.artist}</ul>
                        <ul>${data.title}</ul>
                    </li>
                </figcaption>
            </figure>
        `;
        audioListContainer.appendChild(audioContainer);

        audioContainer.classList.add('searched');
    };
    console.log(document.getElementById("song-search-input").value,)
    searchAudio(document.getElementById("song-search-input").value);
}



async function selectAudioFiles() {
    const audioPaths = await window.filesystem.openFileDialog();
    // creates an item in the cassettes folder for each file selected in the file dialog
    for (const path of audioPaths) {
        await window.metadata.initializeAudio(path);
    }
    await updateAudioFiles()
}


function setAudioState(i) {
    const audio = audioList[i];
    const element = document.getElementById("song-container-" + i);

    for (let j = 0; j < audioList.length; j++) {
        if (j != i && audio.paused) {
            audioList[j].pause();
            audioList[j].currentTime = 0;
            document.getElementById("song-container-" + j).classList.remove('active');
        };
    };

    if (element.classList.contains('active')) {
        audio.play();
    }
    else {
        audio.pause();
    };

    audio.addEventListener('ended', () => {
        element.classList.remove('active');
    });
}

function searchAudio(searchInput) {
    console.log(searchInput)
    for (let i = 0; i < audioList.length; i++) {
        const element = document.getElementById("song-container-" + i);
        console.log(element)
        const songDetailElements = element.querySelectorAll('figure figcaption li ul');
        for (let j = 0; j < songDetailElements.length; j++) {
            if ((songDetailElements[j].innerHTML.toLowerCase().includes(searchInput.toLowerCase())) || searchInput == '') {
                element.classList.add('searched');
                break;
            }
            else {
                element.classList.remove('searched')
            }
        };
    };
};

updateAudioFiles();

const songSearchInput = document.getElementById("song-search");
songSearchInput.addEventListener('input', (e) => {
    searchAudio(e.target.value);
});
