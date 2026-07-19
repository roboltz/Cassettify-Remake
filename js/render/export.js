$(function() {
    function tick(id, pass) {
        const el = document.getElementById(id);
        if (!el) return;
        const icon = el.querySelector('.check-icon');
        if (icon) icon.textContent = pass ? '✅' : '⬜';
        el.classList.toggle('check-pass', pass);
    }

    function runChecklist(data) {
        if (!data) return;
        tick('check-audio',  !!data.filename);
        tick('check-title',  !!data.title?.trim());
        tick('check-artist', !!data.artist?.trim());
        tick('check-cover',  !!data.coverHash);
        tick('check-beats',  data.beats && data.beats.length > 0);

        const allReady = !!data.filename && !!data.title?.trim() && !!data.artist?.trim() && !!data.coverHash;
        $('#btn-export').prop('disabled', !allReady);
    }

    window.loadExportPage = function() {
        if (!window.currentCassetteUUID) return;
        const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;

        // Show summary card
        $('#export-cover').attr('src', `../cassetteAlbumCovers/${data.coverHash}.jpg`);
        $('#export-title').text(data.title || '—');
        $('#export-artist').text(data.artist || '—');
        const dur = parseFloat(data.duration) || 0;
        const mins = Math.floor(dur / 60), secs = Math.floor(dur % 60);
        $('#export-duration').text(`Duration: ${mins}:${String(secs).padStart(2,'0')}`);
        $('#export-summary-card').show();

        runChecklist(data);
    };

    $('#btn-export').on('click', async () => {
        if (!window.currentCassetteUUID) return;

        const destFolder = await window.filesystem.selectExportFolder();
        if (!destFolder) return;

        const format = $('input[name="export-format"]:checked').val() || 'robobeat';

        $('#btn-export').prop('disabled', true).text('⏳ Exporting...');
        $('#export-status').text('Packaging cassette...');

        const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
        const result = await window.filesystem.exportCassette(window.currentCassetteUUID, destFolder, format, data ? data.customTextureBase64 : null);

        if (result.success) {
            $('#export-status').text(`✅ Exported to: ${result.outputFile}`);
            $('#btn-export').text('📦 Export Cassette').prop('disabled', false);
        } else {
            $('#export-status').text(`❌ Export failed: ${result.error}`);
            $('#btn-export').text('📦 Export Cassette').prop('disabled', false);
        }
    });
});
