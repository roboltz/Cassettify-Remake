$(function() {
    const $themeSelect = $('#settings-theme');
    const $fontSelect = $('#settings-font');
    const $autoMetaCheck = $('#settings-auto-meta');
    const $btnResetData = $('#btn-reset-data');

    // Load stored settings or use defaults
    function loadSettings() {
        const theme = localStorage.getItem('settings-theme') || 'system';
        const font = localStorage.getItem('settings-font') || 'Quicksand';
        const autoMeta = localStorage.getItem('settings-auto-meta') !== 'false'; // default true

        $themeSelect.val(theme);
        $fontSelect.val(font);
        $autoMetaCheck.prop('checked', autoMeta);

        applyTheme(theme);
        applyFont(font);
    }

    function applyTheme(theme) {
        const $root = $('html');
        $root.removeClass('theme-light theme-dark');
        if (theme === 'dark') {
            $root.addClass('theme-dark');
        } else if (theme === 'light') {
            $root.addClass('theme-light');
        }
        // If 'system', it will naturally fall back to light-dark() CSS variables
    }

    function applyFont(font) {
        const $root = $('html');
        $root.removeClass('font-quicksand font-system font-monospace');
        if (font === 'Quicksand') {
            $root.addClass('font-quicksand');
        } else if (font === 'System') {
            $root.addClass('font-system');
        } else if (font === 'Courier New') {
            $root.addClass('font-monospace');
        }
    }

    // Save functions
    $themeSelect.on('change', function() {
        const val = $(this).val();
        localStorage.setItem('settings-theme', val);
        applyTheme(val);
    });

    $fontSelect.on('change', function() {
        const val = $(this).val();
        localStorage.setItem('settings-font', val);
        applyFont(val);
    });

    $autoMetaCheck.on('change', function() {
        const checked = $(this).is(':checked');
        localStorage.setItem('settings-auto-meta', checked ? 'true' : 'false');
    });

    $btnResetData.on('click', async () => {
        const confirmed = confirm("Are you absolutely sure you want to reset all user data?\nThis will permanently delete all cassettes, original audios, cover arts, and configuration files.");
        if (!confirmed) return;

        $btnResetData.prop('disabled', true).text('⏳ Wiping Data...');

        try {
            const result = await window.filesystem.resetUserData();
            if (result.success) {
                // Clear localStorage settings as well
                localStorage.clear();
                alert("All user data and settings have been successfully reset. The application will now reload.");
                window.location.reload();
            } else {
                alert("Failed to reset user data: " + result.error);
                $btnResetData.prop('disabled', false).text('⚠️ Reset All User Data');
            }
        } catch (err) {
            alert("Error resetting user data: " + err.message);
            $btnResetData.prop('disabled', false).text('⚠️ Reset All User Data');
        }
    });

    // Make init function globally available
    window.initSettingsPage = function() {
        loadSettings();
    };

    // Auto-run once script is loaded to apply settings immediately to index.html
    loadSettings();
});
