$(function () {
    let wavesurfer = null;
    let regionsPlugin = null;
    let isLoaded = false;
    let currentAudioPath = null;
    let currentUUID = null;
    let beatTimestamps = [];
    const beatSound = new Audio('../beat_previewer/beat_sound/beat.wav');

    // ── Init WaveSurfer ──────────────────────────────────────────────
    function initWaveSurfer() {
        if (wavesurfer) return;

        // Regions plugin for beat markers
        regionsPlugin = WaveSurfer.Regions.create({
            dragSelection: false
        });

        // Timeline plugin
        const timelinePlugin = WaveSurfer.Timeline.create({
            container: '#waveform-timeline',
            primaryLabelSpacing: 10,
            secondaryLabelOpacity: 0.3,
            style: 'color: #aaa; font-size: 11px;'
        });

        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#4a9eff',
            progressColor: '#1e5f99',
            cursorColor: '#ff4a4a',
            height: 128,
            normalize: true,
            interact: true,
            plugins: [regionsPlugin, timelinePlugin]
        });

        regionsPlugin.on('region-in', (region) => {
            // Audio Metronome Click
            if ($('#chk-metronome').is(':checked')) {
                beatSound.currentTime = 0;
                beatSound.play().catch(e => console.error('Audio play failed', e));
            }
            // Visual Beat Pulse Flash
            const $indicator = $('#beat-flash-indicator');
            if ($indicator.length) {
                $indicator.addClass('flash');
                setTimeout(() => $indicator.removeClass('flash'), 80);
            }
        });

        wavesurfer.on('click', () => {
            if (wavesurfer) wavesurfer.playPause();
        });

        wavesurfer.on('audioprocess', () => {
            const cur = wavesurfer.getCurrentTime();
            const dur = wavesurfer.getDuration();
            $('#playback-time').text(`${fmtTime(cur)} / ${fmtTime(dur)}`);
        });

        wavesurfer.on('ready', () => {
            const dur = wavesurfer.getDuration();
            $('#playback-time').text(`0:00 / ${fmtTime(dur)}`);
            $('#waveform-loading').hide();
        });

        wavesurfer.on('play', () => $('#btn-play-preview').text('⏸ Pause'));
        wavesurfer.on('pause', () => $('#btn-play-preview').text('▶ Play'));
    }

    function fmtTime(s) {
        if (!s || isNaN(s)) return '0:00';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    }

    // ── Render beat markers ──────────────────────────────────────────
    function renderBeats(beats) {
        if (!regionsPlugin) return;
        regionsPlugin.clearRegions();
        beats.forEach(b => {
            const t = parseFloat(b);
            if (!isNaN(t)) {
                regionsPlugin.addRegion({
                    start: t,
                    end: t + 0.02,
                    color: 'rgba(255, 74, 74, 0.5)',
                    drag: false,
                    resize: false
                });
            }
        });
    }

    // ── Load track page ──────────────────────────────────────────────
    window.loadTrackPage = async function () {
        if (!window.currentCassetteUUID) return;

        // Only re-load audio if the cassette changed
        if (currentUUID === window.currentCassetteUUID && isLoaded) {
            const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
            if (data && data.beats) showBeatStats(data.beats);
            return;
        }

        currentUUID = window.currentCassetteUUID;
        isLoaded = false;
        beatTimestamps = [];
        $('#beat-stats').hide();
        $('#bpm-display').text('');

        const data = window.cassetteData.find(c => c.UUID === currentUUID);
        if (!data || !data.filename) return;

        const relPath = `cassettes/${data.UUID}/originalAudio/${data.filename}`;
        currentAudioPath = relPath;

        initWaveSurfer();
        wavesurfer.empty();
        regionsPlugin.clearRegions();
        $('#waveform-loading').show();

        // Load audio via IPC
        const result = await window.metadata.getAudioBuffer(relPath);
        if (result && result.success && result.buffer) {
            const arr = new Uint8Array(result.buffer.data || result.buffer);
            const blob = new Blob([arr]);
            
            wavesurfer.once('ready', () => {
                isLoaded = true;
                // If previous beats exist in meta, render them right away
                if (data.beats && data.beats.length > 0) {
                    beatTimestamps = data.beats;
                    renderBeats(beatTimestamps);
                    showBeatStats(beatTimestamps);
                }
            });
            wavesurfer.loadBlob(blob);
        } else {
            $('#waveform-loading').text('Failed to load audio.').show();
        }
    };

    // ── Beat detection ───────────────────────────────────────────────
    $('#btn-detect-bpm').on('click', async () => {
        if (!currentAudioPath) { alert('Please select a cassette first.'); return; }

        const data = window.cassetteData.find(c => c.UUID === currentUUID);
        const originalPath = `cassettes/${currentUUID}/originalAudio/${data.filename}`;

        $('#beat-progress').show();
        $('#btn-detect-bpm').prop('disabled', true).text('⏳ Detecting...');
        animateProgress();

        try {
            const beats = await window.metadata.findBeats(originalPath);
            beatTimestamps = beats.map(Number).filter(n => !isNaN(n));

            if (beatTimestamps.length > 0) {
                // Save to meta
                await window.metadata.saveCassetteData(currentUUID, { beats: beatTimestamps });
                data.beats = beatTimestamps;

                renderBeats(beatTimestamps);
                showBeatStats(beatTimestamps);
            } else {
                alert('No beats detected. Check if the essentia executable is present.');
            }
        } catch (err) {
            console.error('Beat detection error:', err);
        } finally {
            $('#beat-progress').hide();
            $('#btn-detect-bpm').prop('disabled', false).text('⚡ Find Beats');
        }
    });

    function animateProgress() {
        let w = 0;
        const interval = setInterval(() => {
            w = Math.min(w + Math.random() * 3, 95);
            $('#beat-progress-fill').css('width', w + '%');
            if ($('#beat-progress').is(':hidden')) {
                $('#beat-progress-fill').css('width', '100%');
                clearInterval(interval);
            }
        }, 200);
    }

    function showBeatStats(beats) {
        const n = beats.length;
        if (n < 2) return;
        const dur = beats[n - 1] - beats[0];
        const avgBPM = ((n / dur) * 60).toFixed(1);
        $('#stat-total-beats').text(`${n} beats`);
        $('#stat-bpm').text(`~${avgBPM} BPM`);
        $('#stat-duration').text(`Range: ${fmtTime(beats[0])} – ${fmtTime(beats[n - 1])}`);
        $('#bpm-display').text(`BPM: ${avgBPM}`);
        $('#beat-stats').css('display', 'flex');
    }

    // ── Mode Toggling Panel Visibility ───────────────────────────────
    $('#btn-mode-auto').on('click', () => {
        $('#btn-mode-auto').addClass('active');
        $('#btn-mode-constant').removeClass('active');
        $('#constant-bpm-panel').hide();
        $('#auto-bpm-panel').show();
    });

    $('#btn-mode-constant').on('click', () => {
        $('#btn-mode-constant').addClass('active');
        $('#btn-mode-auto').removeClass('active');
        $('#constant-bpm-panel').show();
        $('#auto-bpm-panel').hide();
    });

    // Generate constant-BPM grid on demand
    $('#bpm-input, #offset-input').on('change', () => {
        if ($('#btn-mode-constant').hasClass('active') && isLoaded) {
            const bpm = parseFloat($('#bpm-input').val());
            const offsetMs = parseFloat($('#offset-input').val() || 0);
            if (!bpm || bpm <= 0) return;

            const dur = wavesurfer.getDuration();
            const interval = 60 / bpm;
            const startSec = offsetMs / 1000;
            const generatedBeats = [];
            for (let t = startSec; t < dur; t += interval) {
                generatedBeats.push(parseFloat(t.toFixed(4)));
            }
            beatTimestamps = generatedBeats;
            renderBeats(generatedBeats);
            showBeatStats(generatedBeats);
        }
    });

    // ── Playback & Tab Swapping Stops ────────────────────────────────
    function stopPlayback() {
        if (wavesurfer && isLoaded) {
            wavesurfer.pause();
        }
    }

    $('#btn-play-preview').on('click', () => {
        if (wavesurfer) wavesurfer.playPause();
    });

    $('#btn-clear-beats').on('click', () => {
        if (regionsPlugin) regionsPlugin.clearRegions();
        beatTimestamps = [];
        $('#beat-stats').hide();
        $('#bpm-display').text('');
    });

    // Pause audio when switching pages
    const originalOpenPage = window.openPage;
    window.openPage = function(pageName) {
        if (pageName !== 'track') {
            stopPlayback();
        }
        if (typeof originalOpenPage === 'function') {
            originalOpenPage(pageName);
        }
    };
});
