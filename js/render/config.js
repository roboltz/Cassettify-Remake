$(function() {
    const $songTitle = $('#song-title');
    const $songAuthor = $('#song-author');
    const $chkUseExtracted = $('#chk-use-extracted');

    // Extracted metadata elements
    const $extractedTitle = $('#extracted-title');
    const $extractedAuthor = $('#extracted-author');
    const $extractedDuration = $('#extracted-duration');
    const $configFileName = $('#config-file-name');

    // ── Debounce helper ────────────────────────────────────────────
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ── Auto-save title/artist ─────────────────────────────────────
    const saveMetadata = debounce(async () => {
        if (!window.currentCassetteUUID) return;
        
        const data = window.cassetteData?.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;

        const updatedData = {
            title:  $songTitle.val(),
            artist: $songAuthor.val()
        };
        await window.metadata.saveCassetteData(window.currentCassetteUUID, updatedData);

        // Keep in-memory representation in sync
        data.title  = updatedData.title;
        data.artist = updatedData.artist;

        // Auto-check or uncheck the "Use Extracted Info" checkbox
        const matchesOriginal = (data.title === (data.originalTitle || '')) && 
                                (data.artist === (data.originalArtist || ''));
        $chkUseExtracted.prop('checked', matchesOriginal);
    }, 500);

    $songTitle.on('input', saveMetadata);
    $songAuthor.on('input', saveMetadata);

    // Use extracted metadata checkbox handler
    $chkUseExtracted.on('change', function() {
        if (!window.currentCassetteUUID) return;
        const data = window.cassetteData?.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;

        if ($(this).is(':checked')) {
            // Use fallback if original properties are not yet in metadata
            const origTitle = data.originalTitle !== undefined ? data.originalTitle : (data.title || '');
            const origArtist = data.originalArtist !== undefined ? data.originalArtist : (data.artist || '');
            
            $songTitle.val(origTitle);
            $songAuthor.val(origArtist);
            saveMetadata();
        }
    });

    // ── Public API ──────────────────────────────────────────────────
    window.refreshConfigPage = function() {
        if (!window.currentCassetteUUID) return;
        const data = window.cassetteData?.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;

        // Fallbacks for older cassettes that didn't record originalTitle/originalArtist initially
        if (data.originalTitle === undefined) data.originalTitle = data.title || '';
        if (data.originalArtist === undefined) data.originalArtist = data.artist || '';

        $songTitle.val(data.title  || '');
        $songAuthor.val(data.artist || '');

        $extractedTitle.text(data.originalTitle || 'No Title Found');
        $extractedAuthor.text(data.originalArtist || 'No Artist Found');
        
        const dur = parseFloat(data.duration) || 0;
        $extractedDuration.text(dur.toFixed(2) + " Seconds");
        $configFileName.text(data.filename || 'Unknown filename');

        // Check if values match original
        const matchesOriginal = (data.title === (data.originalTitle || '')) && 
                                (data.artist === (data.originalArtist || ''));
        $chkUseExtracted.prop('checked', matchesOriginal);
    };
});
