const func = async () => {
  console.log(await window.ffmpeg.audioDuration("./music/song.mp3"));
  console.log(await window.ffmpeg.audioTitle("./music/song.mp3"));
  console.log(await window.ffmpeg.audioArtist("./music/song.mp3"));
  await window.ffmpeg.retrieveAudioCover("./music/song.mp3", "./cassettes/!default/cover.jpg");
}

func();