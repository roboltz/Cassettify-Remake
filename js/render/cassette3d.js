window.Cassette3D = (function() {
    let threeScene, threeCamera, threeRenderer, threeModel, animationFrameId;
    let canvasTextureInstance;
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const imageCache = {};
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;

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
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async function generateTexture(data) {
        const ctx = textureCanvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 512);

        const visuals = data.visuals || {};
        const pattern = visuals.CassetteTextureInternalName || 'DEFAULT';
        let textureFile = 'cassetteDEFAULT.png';
        if (pattern === 'CUSTOM') textureFile = 'CustomCassetteTemplate.png';
        else if (pattern === 'bpm1') textureFile = 'cassette_bpm1.png';
        else if (pattern !== 'DEFAULT') textureFile = `cassette${pattern}.png`;

        if (pattern === 'CUSTOM') {
            const coverSrc = data.coverHash ? `../cassetteAlbumCovers/${data.coverHash}.jpg` : null;
            const atlasScale = 330 / 300;

            // Fallback to global defaults if visuals undefined
            const defaultAlignStr = localStorage.getItem('default-cover-align');
            const defaultAlign = defaultAlignStr ? JSON.parse(defaultAlignStr) : {};
            
            const sx = visuals.CoverScaleX ?? defaultAlign.CoverScaleX ?? 100;
            const sy = visuals.CoverScaleY ?? defaultAlign.CoverScaleY ?? 100;
            const ox = visuals.CoverOffsetX ?? defaultAlign.CoverOffsetX ?? 0;
            const oy = visuals.CoverOffsetY ?? defaultAlign.CoverOffsetY ?? 0;
            const rot = visuals.CoverRotation ?? defaultAlign.CoverRotation ?? 0;

            if (coverSrc && data.coverHash) {
                const coverImg = await cacheImage('cover_' + data.coverHash, coverSrc);
                if (coverImg) {
                    for (const baseX of [128, 384]) {
                        ctx.save();
                        ctx.translate(baseX, 256);
                        
                        const isRight = baseX === 384;
                        const baseRotation = isRight ? Math.PI / 2 : -Math.PI / 2;
                        ctx.rotate(baseRotation);
                        
                        const curOx = isRight ? -ox : ox;
                        const curOy = isRight ? oy : -oy;
                        ctx.translate(curOx * atlasScale, curOy * atlasScale);
                        ctx.rotate((rot * Math.PI) / 180);
                        ctx.scale((sx / 100) * atlasScale, (sy / 100) * atlasScale);
                        
                        ctx.drawImage(coverImg, -128, -128, 256, 256);
                        ctx.restore();
                    }
                }
            }
        }

        const patternImg = await cacheImage('pattern_' + pattern, `../images/${textureFile}`);
        if (patternImg) {
            ctx.drawImage(patternImg, 0, 0, 512, 512);
        }

        if (pattern === 'CUSTOM') {
            // Draw stickers on top of the template
            const stickers = visuals.Stickers || [];
            for (const sticker of stickers) {
                if (sticker.hash) {
                    const stImg = await cacheImage('sticker_' + sticker.hash, `../cassetteAlbumCovers/${sticker.hash}.png`);
                    if (stImg) {
                        for (const baseX of [128, 384]) {
                            ctx.save();
                            ctx.translate(baseX, 256);
                            
                            const isRight = baseX === 384;
                            const baseRotation = isRight ? Math.PI / 2 : -Math.PI / 2;
                            ctx.rotate(baseRotation);
                            
                            const atlasScale = 330 / 300;
                            const curStickerX = isRight ? -sticker.x : sticker.x;
                            const curStickerY = isRight ? sticker.y : -sticker.y;
                            ctx.translate(curStickerX * atlasScale, curStickerY * atlasScale);
                            ctx.rotate((sticker.rotation * Math.PI) / 180);
                            ctx.scale((sticker.scale / 100) * atlasScale, (sticker.scale / 100) * atlasScale);
                            
                            // Sticker base size is assumed 100x100
                            ctx.drawImage(stImg, -50, -50, 100, 100);
                            ctx.restore();
                        }
                    }
                }
            }
        }

        if (canvasTextureInstance) {
            canvasTextureInstance.needsUpdate = true;
        }
        
        if (data) {
            if (pattern === 'CUSTOM') {
                data.customTextureBase64 = textureCanvas.toDataURL('image/png');
            } else {
                data.customTextureBase64 = null;
            }
        }
    }

    function init(containerElement, data) {
        if (!containerElement) return;

        // Cleanup previous if exists
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (threeRenderer) {
            threeRenderer.dispose();
            containerElement.innerHTML = '';
        }

        const width = containerElement.clientWidth || 400;
        const height = containerElement.clientHeight || 350;

        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        threeCamera.position.set(0, 0, 3.5);

        threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        threeRenderer.setSize(width, height);
        threeRenderer.setPixelRatio(window.devicePixelRatio);
        containerElement.appendChild(threeRenderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        threeScene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight1.position.set(5, 10, 7);
        threeScene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(-5, -5, -5);
        threeScene.add(dirLight2);

        canvasTextureInstance = new THREE.CanvasTexture(textureCanvas);
        canvasTextureInstance.wrapS = THREE.RepeatWrapping;
        canvasTextureInstance.wrapT = THREE.RepeatWrapping;
        
        let color = '#ffffff';
        if (data && data.hexColors && data.hexColors.cassette) color = data.hexColors.cassette;

        const material = new THREE.MeshStandardMaterial({
            map: canvasTextureInstance,
            color: color,
            roughness: 0.45,
            metalness: 0.15
        });

        const objLoader = new THREE.OBJLoader();
        objLoader.load('../originalGameAssetDump/Mesh/cassettelow.obj', (object) => {
            threeModel = object;
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                }
            });

            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            object.position.x += (object.position.x - center.x);
            object.position.y += (object.position.y - center.y);
            object.position.z += (object.position.z - center.z);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.2 / maxDim; // Adjust scale to fit viewport
            object.scale.set(scale, scale, scale);
            
            object.rotation.y = Math.PI / 2; // Initial rotation to face forward
            object.rotation.x = Math.PI / 8; // Slight tilt

            threeScene.add(object);
            
            if (data) {
                generateTexture(data);
            }
        });

        // Mouse tracking for drag-to-rotate
        containerElement.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mouseleave', onMouseUp, false);
        window.addEventListener('blur', onMouseUp, false);
        containerEl = containerElement;

        animate();
    }
    
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let containerEl = null;

    function onMouseDown(event) {
        // Prevent default to stop text selection/image dragging that breaks mouseup
        if (event.cancelable) {
            event.preventDefault();
        }
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    function onMouseMove(event) {
        if (!isDragging || !threeModel) return;

        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };

        // Update target rotation based on drag distance
        targetRotationY += deltaMove.x * 0.01;
        targetRotationX += deltaMove.y * 0.01;

        // Clamp vertical rotation so we don't flip the cassette upside down
        targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));

        previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    function onMouseUp(event) {
        isDragging = false;
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        
        if (threeModel) {
            // Smoothly interpolate current rotation to target rotation
            threeModel.rotation.y += (targetRotationY - threeModel.rotation.y) * 0.05;
            threeModel.rotation.x += (targetRotationX - threeModel.rotation.x) * 0.05;
        }

        if (threeRenderer && threeScene && threeCamera) {
            threeRenderer.render(threeScene, threeCamera);
        }
    }

    function destroy() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (containerEl) {
            containerEl.removeEventListener('mousedown', onMouseDown, false);
            containerEl.innerHTML = '';
            containerEl = null;
        }
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mouseleave', onMouseUp, false);
        window.removeEventListener('blur', onMouseUp, false);
        
        if (threeRenderer) {
            threeRenderer.dispose();
            threeRenderer = null;
        }
        threeScene = null;
        threeCamera = null;
        threeModel = null;
    }

    function updateData(data) {
        if (data) {
            generateTexture(data);
            if (threeModel && data.hexColors && data.hexColors.cassette) {
                threeModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.color.set(data.hexColors.cassette);
                    }
                });
            }
        }
    }

    return {
        init: init,
        destroy: destroy,
        updateData: updateData
    };
})();
