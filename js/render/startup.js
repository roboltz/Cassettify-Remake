async function updateAudioFiles() {
    let cassetteData = await window.metadata.getCassetteData();
    const audioListContainer = document.getElementById("songlist-container");

    cassetteData.forEach(data => {
        const audioContainer = document.createElement("div");
        audioContainer.classList.add("song-container");

        audioContainer.innerHTML = `
            <li>
                <ul>Artist: ${data.artist}</ul>
                <ul>Title: ${data.title}</ul>
            </li>
        `;

        audioListContainer.appendChild(audioContainer);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateAudioFiles();
});