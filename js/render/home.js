let cassetteData = [];
let audioList = [];
let activeAudioIndex = -1;


async function updateAudioFiles() {
    cassetteData = await window.metadata.getCassetteData();
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

        const coverSrc = data.coverHash 
            ? `../cassetteAlbumCovers/${data.coverHash}.jpg` 
            : '../images_original/SmallCustomCassetteTemplate.png';

        audioContainer.innerHTML = `
            <figure>
                <div class="image-container" onclick="toggleAudio(${i});">
                    <img src="${coverSrc}" alt="cover"/>
                </div>
                <figcaption>
                    <li>
                        <ul>${data.artist}</ul>
                        <ul>${data.title}</ul>
                    </li>
                </figcaption>
                <div class="song-container-buttons">
                    <button></button>
                    <button onclick="openConfigForCassette(${i})"></button>
                    <button></button>
                </div>
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
    if (audioPaths && audioPaths.length > 0) {
        await handlePaths(audioPaths);
    }
}


async function setAudioState(i) {
    const data = await cassetteData[i]
    window.currentCassetteUUID = data.UUID;
    window.cassetteData = cassetteData;

    const audio = audioList[i];
    const element = document.getElementById("song-container-" + i);

    const coverSrc = data.coverHash 
        ? `../cassetteAlbumCovers/${data.coverHash}.jpg` 
        : '../images_original/SmallCustomCassetteTemplate.png';
        
        

    for (let j = 0; j < audioList.length; j++) {
        if (j != i && audio.paused) {
            audioList[j].pause();
            audioList[j].currentTime = 0;
            const otherElement = document.getElementById("song-container-" + j);
            if (otherElement) otherElement.classList.remove('active');
        }
    }

    if (element) {
        if (element.classList.contains('active')) {
            audio.play();
        } else {
            audio.pause();
        }
    }

    audio.addEventListener('ended', () => {
        if (element) element.classList.remove('active');
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
            };
        };
    };
};

function toggleAudio(i, usedAudioPlayer = false) {
    activeAudioIndex = i;
    const songContainerElement = document.getElementById('song-container-' + i);
    
    if (songContainerElement) {
        songContainerElement.classList.toggle('active');
    }

    setAudioState(i);
}

function openConfigForCassette(i) {
    const data = cassetteData[i];
    window.currentCassetteUUID = data.UUID;
    window.cassetteData = cassetteData; // keep global reference up to date

    openPage('config');

    // config.js listens for this after the page is loaded
    if (typeof window.refreshConfigPage === 'function') {
        window.refreshConfigPage();
    }

    // Smart Palette Extraction (only run if we haven't already extracted colors for this cassette)
    if (!data.colors && window.metadata.extractPalette && data.coverHash) {
        window.metadata.extractPalette(data.coverHash).then(result => {
            if (result.success) {
                data.colors = result.palette;
                window.metadata.saveCassetteData(data.UUID, { colors: result.palette });
            }
        });
    }
}

function showLoadingScreen(msg = 'Processing...') {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.getElementById('loading-text');
    if (loadingScreen) loadingScreen.style.display = 'flex';
    if (loadingText) loadingText.textContent = msg;
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}



async function handlePaths(allPaths) {
    console.log('[handlePaths] valid paths to process:', allPaths);

    if (!allPaths || allPaths.length === 0) {
        console.warn('[handlePaths] No paths found.');
        return;
    }

    showLoadingScreen(`Processing 0 / ${allPaths.length}...`);
    let done = 0;
    const errors = [];

    for (const filePath of allPaths) {
        console.log(`[handlePaths] Processing (${done + 1}/${allPaths.length}):`, filePath);
        try {
            if (window.metadata && window.metadata.initializeAudio) {
                const autoMetaSetting = localStorage.getItem('settings-auto-meta') !== 'false';
                await window.metadata.initializeAudio(filePath, !autoMetaSetting);
                console.log(`[handlePaths] ✅ Done:`, filePath);
            }
        } catch (err) {
            const name = filePath.replace(/\\/g, '/').split('/').pop();
            console.error(`[handlePaths] ❌ Failed:`, filePath, err);
            errors.push(`${name}: ${err.message || err}`);
        }
        done++;
        showLoadingScreen(`Processing ${done} / ${allPaths.length}...`);
    }

    await updateAudioFiles();
    hideLoadingScreen();

    if (errors.length > 0) {
        alert(`${errors.length} file(s) failed to import:\n${errors.slice(0, 5).join('\n')}`);
    }
}

// Called by index.html after all fragments are injected into the DOM
window.initHomePage = function () {
    console.log('[home.js] initHomePage called');

    // Load existing cassettes
    updateAudioFiles();

    // Search
    const songSearchInput = document.getElementById('song-search-input');
    if (songSearchInput) {
        songSearchInput.addEventListener('input', (e) => searchAudio(e.target.value));
    }

    // Drag and Drop Logic
    const dropZone = document.getElementById('drop-zone');

    if (dropZone) {
        console.log('[DropZone] drop zone found — attaching listeners');

        dropZone.addEventListener('click', async () => {
            console.log('[DropZone] clicked — opening native file picker');
            await selectAudioFiles();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            console.log('[DropZone] drop event, files:', e.dataTransfer.files.length);
            if (e.dataTransfer.files.length) {
                const paths = Array.from(e.dataTransfer.files).map(f => f.path).filter(Boolean);
                if (paths.length > 0) {
                    await handlePaths(paths);
                } else {
                    alert('Could not read dropped file paths. Web security may be blocking it. Please use click instead.');
                }
            } else {
                console.warn('[DropZone] drop event fired but no files in dataTransfer');
            }
        });
    } else {
        console.error('[DropZone] MISSING ELEMENTS — dropZone:', !!dropZone);
    }
};
