$(function() {
    const $cassetteColor = $('#cassette-color');
    const $labelColor = $('#label-color');
    const $patternSelect = $('#pattern-select');
    const $palettePreview = $('#palette-preview');
    const $previewCassette = $('#preview-cassette-template');

    const $coverImage = $('#cover-image');
    const $coverImageContainer = $('#cover-image-container');
    const $fileCustomCover = $('#file-custom-cover');
    const $videoFramePicker = $('#video-frame-picker');
    const $frameTimeInput = $('#frame-time-input');
    const $btnExtractFrame = $('#btn-extract-frame');

    // Visual elements inside the 3D model preview
    const $visualsCoverImage = $('#visuals-cover-image');
    const $visualsStickersContainer = $('#visuals-stickers-container');

    // Alignment Slider Controls
    const $coverScaleX = $('#cover-scale-x');
    const $coverScaleY = $('#cover-scale-y');
    const $coverOffsetX = $('#cover-offset-x');
    const $coverOffsetY = $('#cover-offset-y');
    const $coverRotation = $('#cover-rotation');

    // Sticker Controls
    const $btnAddSticker = $('#btn-add-sticker');
    const $btnClearStickers = $('#btn-clear-stickers');
    const $fileStickerUpload = $('#file-sticker-upload');
    const $stickersControlList = $('#stickers-control-list');

    let stickersList = [];

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const saveVisuals = debounce(async () => {
        if (!window.currentCassetteUUID) return;
        
        const updatedData = {
            visuals: {
                CassetteTextureInternalName: $patternSelect.val(),
                CassetteColor: hexToNormalizedRGB($cassetteColor.val()),
                LabelColor: hexToNormalizedRGB($labelColor.val()),
                CoverScaleX: parseInt($coverScaleX.val()),
                CoverScaleY: parseInt($coverScaleY.val()),
                CoverOffsetX: parseInt($coverOffsetX.val()),
                CoverOffsetY: parseInt($coverOffsetY.val()),
                CoverRotation: parseInt($coverRotation.val()),
                Stickers: stickersList
            },
            hexColors: {
                cassette: $cassetteColor.val(),
                label: $labelColor.val()
            }
        };
        
        await window.metadata.saveCassetteData(window.currentCassetteUUID, updatedData);
        // Sync in-memory representation
        const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
        if (data) {
            data.visuals = updatedData.visuals;
            data.hexColors = updatedData.hexColors;
        }
    }, 500);

    function hexToNormalizedRGB(hex) {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16) / 255.0,
            g: parseInt(hex.substring(2, 4), 16) / 255.0,
            b: parseInt(hex.substring(4, 6), 16) / 255.0,
            a: 1.0
        };
    }
    
    function applyPreviewTint() {
        // Border matches cassette body color, background-color matches label color
        $previewCassette.css('border', `5px solid ${$cassetteColor.val()}`);
        $previewCassette.css('background-color', $labelColor.val());
    }

    function applyCoverAlignment() {
        const sx = $coverScaleX.val();
        const sy = $coverScaleY.val();
        const ox = $coverOffsetX.val();
        const oy = $coverOffsetY.val();
        const rot = $coverRotation.val();

        // The default template orientation is rotated -90 degrees, so we align our cover transformations with it
        const transformStr = `translate(-50%, -50%) translate(${ox}px, ${oy}px) rotate(${-90 + parseInt(rot)}deg) scale(${sx / 100}, ${sy / 100})`;
        $visualsCoverImage.css('transform', transformStr);
    }

    // Dynamic sticker rendering inside the 3D model
    function renderStickers() {
        $visualsStickersContainer.empty();
        $stickersControlList.empty();

        stickersList.forEach((s, index) => {
            // Add sticker element overlay inside 3D model
            const $stickerImg = $(`
                <img src="${s.src}" style="
                    position: absolute;
                    left: calc(50% + ${s.x}px);
                    top: calc(50% + ${s.y}px);
                    transform: translate(-50%, -50%) scale(${s.scale / 100});
                    width: 50px;
                    pointer-events: none;
                ">
            `);
            $visualsStickersContainer.append($stickerImg);

            // Add sticker control row in left panel
            const $ctrl = $(`
                <div class="sticker-control-item" style="border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.15);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size:0.8em; font-weight:bold; color: var(--accent-color);">Sticker #${index + 1}</span>
                        <button class="btn-small btn-del-sticker" data-id="${s.id}" style="padding: 2px 8px; background: #ff4a4a; color: white; border: none; border-radius: 4px; font-size: 0.75em;">✕</button>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size: 0.7em; color: #888; text-transform: uppercase;">X Pos</label>
                            <input type="range" class="sticker-slider-x styled-range" data-id="${s.id}" min="-150" max="150" value="${s.x}">
                        </div>
                        <div>
                            <label style="font-size: 0.7em; color: #888; text-transform: uppercase;">Y Pos</label>
                            <input type="range" class="sticker-slider-y styled-range" data-id="${s.id}" min="-150" max="150" value="${s.y}">
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="font-size: 0.7em; color: #888; text-transform: uppercase;">Scale</label>
                            <input type="range" class="sticker-slider-scale styled-range" data-id="${s.id}" min="10" max="200" value="${s.scale}">
                        </div>
                    </div>
                </div>
            `);
            $stickersControlList.append($ctrl);
        });

        // Attach event listeners to newly rendered controls
        $('.btn-del-sticker').on('click', function() {
            const id = $(this).data('id');
            stickersList = stickersList.filter(s => s.id !== id);
            renderStickers();
            saveVisuals();
        });

        $('.sticker-slider-x').on('input', function() {
            const id = $(this).data('id');
            const val = parseInt($(this).val());
            const sticker = stickersList.find(s => s.id === id);
            if (sticker) {
                sticker.x = val;
                renderStickers();
                saveVisuals();
            }
        });

        $('.sticker-slider-y').on('input', function() {
            const id = $(this).data('id');
            const val = parseInt($(this).val());
            const sticker = stickersList.find(s => s.id === id);
            if (sticker) {
                sticker.y = val;
                renderStickers();
                saveVisuals();
            }
        });

        $('.sticker-slider-scale').on('input', function() {
            const id = $(this).data('id');
            const val = parseInt($(this).val());
            const sticker = stickersList.find(s => s.id === id);
            if (sticker) {
                sticker.scale = val;
                renderStickers();
                saveVisuals();
            }
        });
        if (typeof debounceUpdateTexture === 'function') debounceUpdateTexture();
    }

    // Live slider value readouts
    function updateSliderValues() {
        $('#val-scale-x').text($coverScaleX.val() + '%');
        $('#val-scale-y').text($coverScaleY.val() + '%');
        $('#val-offset-x').text($coverOffsetX.val() + 'px');
        $('#val-offset-y').text($coverOffsetY.val() + 'px');
        $('#val-rotation').text($coverRotation.val() + '°');
    }

    // Setup input change event listeners
    $cassetteColor.on('input', () => { applyPreviewTint(); saveVisuals(); });
    $labelColor.on('input', () => { applyPreviewTint(); saveVisuals(); });
    function getTextureFilename(pattern) {
        if (!pattern || pattern === 'DEFAULT') return 'cassetteDEFAULT.png';
        if (pattern === 'CUSTOM') return 'CustomCassetteTemplate.png';
        if (pattern === 'bpm1') return 'cassette_bpm1.png';
        return `cassette${pattern}.png`;
    }

    function toggleCustomPanels() {
        if ($patternSelect.val() === 'CUSTOM') {
            $('#cover-alignment-card').show();
            $('#stickers-card').show();
        } else {
            $('#cover-alignment-card').hide();
            $('#stickers-card').hide();
        }
    }

    $patternSelect.on('change', () => {
        toggleCustomPanels();
        debounceUpdateTexture();
        saveVisuals();
    });

    // Alignment changes
    $coverScaleX.on('input', () => { applyCoverAlignment(); updateSliderValues(); debounceUpdateTexture(); saveVisuals(); });
    $coverScaleY.on('input', () => { applyCoverAlignment(); updateSliderValues(); debounceUpdateTexture(); saveVisuals(); });
    $coverOffsetX.on('input', () => { applyCoverAlignment(); updateSliderValues(); debounceUpdateTexture(); saveVisuals(); });
    $coverOffsetY.on('input', () => { applyCoverAlignment(); updateSliderValues(); debounceUpdateTexture(); saveVisuals(); });
    $coverRotation.on('input', () => { applyCoverAlignment(); updateSliderValues(); debounceUpdateTexture(); saveVisuals(); });

    $('#btn-reset-cover-align').on('click', () => {
        $coverScaleX.val(100);
        $coverScaleY.val(100);
        $coverOffsetX.val(0);
        $coverOffsetY.val(0);
        $coverRotation.val(0);
        applyCoverAlignment();
        updateSliderValues();
        debounceUpdateTexture();
        saveVisuals();
    });

    $('#btn-save-global-align').on('click', () => {
        const alignSettings = {
            CoverScaleX: parseInt($coverScaleX.val()),
            CoverScaleY: parseInt($coverScaleY.val()),
            CoverOffsetX: parseInt($coverOffsetX.val()),
            CoverOffsetY: parseInt($coverOffsetY.val()),
            CoverRotation: parseInt($coverRotation.val())
        };
        localStorage.setItem('default-cover-align', JSON.stringify(alignSettings));
        alert('Alignment configuration saved as global default for future cassettes!');
    });

    // Sticker uploads
    $btnAddSticker.on('click', () => $fileStickerUpload.trigger('click'));
    $fileStickerUpload.on('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const newSticker = {
                    id: 'sticker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    src: ev.target.result,
                    x: 0,
                    y: 0,
                    scale: 100
                };
                stickersList.push(newSticker);
                renderStickers();
                saveVisuals();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
        $(this).val(''); // Clear target
    });

    $btnClearStickers.on('click', () => {
        if (confirm('Clear all stickers from this cassette?')) {
            stickersList = [];
            renderStickers();
            saveVisuals();
        }
    });

    // ── Custom cover image via click ───────────────────────────────
    $coverImageContainer.on('click', () => $fileCustomCover.trigger('click'));

    $fileCustomCover.on('change', async function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = async function(ev) {
                $coverImage.attr('src', ev.target.result);
                $visualsCoverImage.attr('src', ev.target.result).show();
                delete imageCache['cover'];
                debounceUpdateTexture();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // ── Video frame picker ─────────────────────────────────────────
    $btnExtractFrame.on('click', async () => {
        if (!window.currentCassetteUUID) return;

        const data = window.cassetteData?.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;

        const frameTimeSec = parseFloat($frameTimeInput.val() || 0);
        // Build the original audio path
        const originalFilePath = `cassettes/${data.UUID}/originalAudio/${data.filename}`;

        $btnExtractFrame.prop('disabled', true).text('Extracting…');

        const result = await window.metadata.reextractCover(
            window.currentCassetteUUID,
            originalFilePath,
            frameTimeSec
        );

        if (result && result.success) {
            const freshSrc = `../cassetteAlbumCovers/${result.coverHash}.jpg?t=${Date.now()}`;
            $coverImage.attr('src', freshSrc);
            $visualsCoverImage.attr('src', freshSrc).show();
            if (data) data.coverHash = result.coverHash;
            delete imageCache['cover'];
            debounceUpdateTexture();
        } else {
            alert('Could not extract frame: ' + (result?.error || 'Unknown error'));
        }

        $btnExtractFrame.prop('disabled', false).text('Extract Frame');
    });

    // This function can be called when switching to the visuals page
    window.loadVisualsPage = function() {
        if (!window.currentCassetteUUID) return;
        const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;
        
        if (data.hexColors) {
            $cassetteColor.val(data.hexColors.cassette || '#ffffff');
            $labelColor.val(data.hexColors.label || '#ffffff');
            applyPreviewTint();
        }
        if (data.visuals) {
            const pattern = data.visuals.CassetteTextureInternalName || 'DEFAULT';
            $patternSelect.val(pattern);
            const textureFile = getTextureFilename(pattern);
            $('.cassette-face.front, .cassette-face.back').css('background-image', `url("../images/${textureFile}")`);
            
            // Read cover alignment with localStorage global defaults as fallback
            const defaultAlignStr = localStorage.getItem('default-cover-align');
            const defaultAlign = defaultAlignStr ? JSON.parse(defaultAlignStr) : {};

            $coverScaleX.val(data.visuals.CoverScaleX ?? defaultAlign.CoverScaleX ?? 100);
            $coverScaleY.val(data.visuals.CoverScaleY ?? defaultAlign.CoverScaleY ?? 100);
            $coverOffsetX.val(data.visuals.CoverOffsetX ?? defaultAlign.CoverOffsetX ?? 0);
            $coverOffsetY.val(data.visuals.CoverOffsetY ?? defaultAlign.CoverOffsetY ?? 0);
            $coverRotation.val(data.visuals.CoverRotation ?? defaultAlign.CoverRotation ?? 0);
            
            stickersList = data.visuals.Stickers || [];
        } else {
            // Apply global default alignment
            const defaultAlignStr = localStorage.getItem('default-cover-align');
            if (defaultAlignStr) {
                const defaultAlign = JSON.parse(defaultAlignStr);
                $coverScaleX.val(defaultAlign.CoverScaleX);
                $coverScaleY.val(defaultAlign.CoverScaleY);
                $coverOffsetX.val(defaultAlign.CoverOffsetX);
                $coverOffsetY.val(defaultAlign.CoverOffsetY);
                $coverRotation.val(defaultAlign.CoverRotation);
            } else {
                $coverScaleX.val(100);
                $coverScaleY.val(100);
                $coverOffsetX.val(0);
                $coverOffsetY.val(0);
                $coverRotation.val(0);
            }
            $patternSelect.val('DEFAULT');
            const textureFile = getTextureFilename('DEFAULT');
            $('.cassette-face.front, .cassette-face.back').css('background-image', `url("../images/${textureFile}")`);
            stickersList = [];
        }

        applyCoverAlignment();
        updateSliderValues();
        renderStickers();
        toggleCustomPanels();
        debounceUpdateTexture();

        const coverSrc = data.coverHash
            ? `../cassetteAlbumCovers/${data.coverHash}.jpg`
            : '../images/cassetteFace.png';
        
        $coverImage.attr('src', coverSrc);
        $visualsCoverImage.attr('src', coverSrc).show();

        // Show/hide the video frame picker
        if (data.isVideo) {
            $videoFramePicker.show();
            $frameTimeInput.val(data.frameTimeSec || 0);
        } else {
            $videoFramePicker.hide();
        }

        // Initialize Live 3D Preview
        setTimeout(() => {
            const container = document.getElementById('visuals-3d-canvas-container');
            if (window.Cassette3D && container) {
                window.Cassette3D.init(container, data);
            }
        }, 50);
        
        // Render Palette
        $palettePreview.empty();
        if (data.colors) {
            Object.keys(data.colors).forEach(key => {
                const hex = data.colors[key];
                if (hex) {
                    const $swatch = $(`<div title="${key}" style="width: 30px; height: 30px; border-radius: 50%; cursor: pointer; border: 2px solid #555; background-color: ${hex}"></div>`);
                    $swatch.on('click', () => {
                        $cassetteColor.val(hex);
                        applyPreviewTint();
                        saveVisuals();
                    });
                    $palettePreview.append($swatch);
                }
            });
        }
    };
    
    $('#btn-auto-cassette-color').on('click', () => {
        const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
        if (data && data.colors && data.colors.DarkVibrant) {
            $cassetteColor.val(data.colors.DarkVibrant);
            applyPreviewTint();
            saveVisuals();
        }
    });

    $('#btn-auto-label-color').on('click', () => {
        const data = window.cassetteData.find(c => c.UUID === window.currentCassetteUUID);
        if (data && data.colors && data.colors.Vibrant) {
            $labelColor.val(data.colors.Vibrant);
            applyPreviewTint();
            saveVisuals();
        }
    });

    // ── Canvas-based Texture Synthesis (Real 3D Texture Mapping) ──────
    const imageCache = {};
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    let canvasTextureInstance = null;

    function cacheImage(key, src) {
        return new Promise((resolve) => {
            if (imageCache[key] && imageCache[key].src === src) {
                resolve(imageCache[key]);
                return;
            }
            const img = new Image();
            img.onload = () => {
                imageCache[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                resolve(null);
            };
            img.src = src;
        });
    }

    async function updateGeneratedTexture() {
        const ctx = textureCanvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 512);

        // 1. Draw base pattern texture from images directory
        const pattern = $patternSelect.val() || 'DEFAULT';
        const textureFile = getTextureFilename(pattern);
        const patternImg = await cacheImage('pattern_' + pattern, `../images/${textureFile}`);
        if (patternImg) {
            ctx.drawImage(patternImg, 0, 0, 512, 512);
        }

        const data = window.cassetteData?.find(c => c.UUID === window.currentCassetteUUID);
        if (!data) return;

        // 2. Draw custom cover image mapped to the horizontal label coordinates
        const coverSrc = data.coverHash
            ? `../cassetteAlbumCovers/${data.coverHash}.jpg`
            : null;

        const atlasScale = 330 / 300;

        if (coverSrc && data.coverHash) {
            const coverImg = await cacheImage('cover', coverSrc);
            if (coverImg) {
                const sx = parseFloat($coverScaleX.val());
                const sy = parseFloat($coverScaleY.val());
                const ox = parseFloat($coverOffsetX.val());
                const oy = parseFloat($coverOffsetY.val());
                const rot = parseFloat($coverRotation.val());

                ctx.save();
                // Move to center of vertical front face on texture atlas sheet
                ctx.translate(128, 256);
                ctx.rotate(-Math.PI / 2); // Rotate -90deg so it aligns horizontally
                
                // Apply editor offsets & transformations
                ctx.translate(ox * atlasScale, oy * atlasScale);
                ctx.rotate((rot * Math.PI) / 180);
                ctx.scale(sx / 100, sy / 100);

                const coverW = 220 * atlasScale;
                const coverH = 140 * atlasScale;
                ctx.drawImage(coverImg, -coverW / 2, -coverH / 2, coverW, coverH);
                ctx.restore();
            }
        }

        // 3. Draw stickers
        for (const s of stickersList) {
            const stickerImg = await cacheImage(s.id, s.src);
            if (stickerImg) {
                ctx.save();
                ctx.translate(128, 256);
                ctx.rotate(-Math.PI / 2);

                ctx.translate(s.x * atlasScale, s.y * atlasScale);
                ctx.scale(s.scale / 100, s.scale / 100);

                const stickerW = 50 * atlasScale;
                const stickerH = 50 * atlasScale;
                ctx.drawImage(stickerImg, -stickerW / 2, -stickerH / 2, stickerW, stickerH);
                ctx.restore();
            }
        }

        // 4. Signal WebGL to refresh texture
        if (canvasTextureInstance) {
            canvasTextureInstance.needsUpdate = true;
        }

        // Live update the embedded 3D viewer
        if (window.Cassette3D) {
            window.Cassette3D.updateData(data);
        }
    }

    const debounceUpdateTexture = debounce(updateGeneratedTexture, 100);

    // Ensure Cassette3D is cleaned up if we leave the page (if necessary, though sticking to the DOM is fine)
    // We can initialize it in loadVisualsPage instead.
});
