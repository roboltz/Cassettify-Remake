# Cassettify → Cassettify-Remake (Electron) Migration Plan

## Phase 1: Setup & Assets Migration ✅
- [x] Clone `images`, `font`, `ffmpeg`, `beat_finder`, etc. from the original Cassettify project.
- [x] Set up the basic Electron `main.js` and IPC handlers to match the Python backend features (metadata extraction, ffmpeg integration).
- [x] Adapt CSS/UI to match the CustomTkinter style from the original.

## Phase 2: Core UI & Homepage ✅
- [x] Implement the scrollable list of uploaded songs.
- [x] Add drag-and-drop to the song list (for uploading songs).
- [x] Add the 3D cassette viewer (interactive mouse-follow rotation).
- [x] Loading screen shown during long processes (metadata extraction, audio conversion).
- [x] Fix div/text overflow for long file names in song list and bottom bar.
- [x] Fix 3D cassette viewer rendering oversize / off-center when sidebar opens.
- [x] Proper flex layout with `min-width: 0` constraints to prevent content overflow.

## Phase 3: Configuration & Visuals ✅
- [x] Port configuration logic (Backend/IPC auto-save with debounce).
- [x] Allow changing the cover image by clicking the album cover.
- [x] Overhaul Config page with glassmorphism card layout and styled form inputs.
- [x] "Use Original Extracted Info" checkbox restores original metadata (with legacy cassette fallback).
- [x] Store `originalTitle` / `originalArtist` permanently in `meta.json`.
- [x] Implement Visuals page: easier adjustment, non-1:1 image support, rotation, color settings, stickers.
- [x] Integrate `node-vibrant` for Smart Palette Extraction (auto-fill cassette/label colors from album art).
- [x] Enhance 3D Viewer to reflect color, pattern, and J-card changes in real-time.

## Phase 4: Track Page ✅
- [x] BPM detection using Essentia streaming beat tracker.
- [x] Interactive Waveform Editor using `wavesurfer.js` with draggable beat markers.
- [x] Web Audio API beat tick previewer to test detection accuracy in-app.
- [x] Constant BPM Mode (ArrowVortex style) with Global Offset calculation.
- [x] BPM Range Target Filter to prevent half-time/double-time detection errors.
- [x] Visual beat pulse indicator (animated circle that flashes on each beat).
- [x] Configurable metronome audio toggle for beat monitoring.
- [x] Auto/Constant mode toggle with dynamic panel switching.
- [x] Beat statistics display (total beats, average BPM, time range).

## Phase 4.5: Export & Settings ✅
- [x] Export popup UI with format selection and checklist.
- [x] Multi-format export support (`.robobeat` ZIP archive).
- [x] Fix export failures with special characters in filenames (proper quoting for PowerShell).
- [x] Auto-convert all imported audio to OGG format for game compatibility.
- [x] Settings page: font selection, dark/light/system mode, auto-actions config, and data reset.

## Phase 5: Performance Optimizations
- [ ] Implement Worker Threads for heavy algorithms (parsing beat arrays, generating waveforms) to ensure 60 FPS UI.
- [ ] Implement non-blocking audio piping (Node.js Streams + fluent-ffmpeg) to build `.robobeat` files in memory, reducing SSD wear and speeding up exports.

## Phase 6: Future Enhancements
- [ ] Batch export for multiple cassettes at once.
- [ ] Undo/redo for visual parameter changes.
- [ ] Custom beat sound selection (metronome, click, gunshot, etc.).
- [ ] Keyboard shortcuts for common actions.
- [ ] Auto-update mechanism for the Electron app.
