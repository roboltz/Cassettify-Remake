# Cassettify Remake 📼

A fully-featured, cross-platform custom cassette creator for the game **ROBOBEAT**.

This is a ground-up remake of the original Cassettify project built with **Electron**. It provides a massively improved user experience, broader format support, and far more accurate beat detection for importing your custom music into ROBOBEAT.

> **Note:** This project is currently a Work In Progress (WIP) and is public to make development progress visible.

---

## ✨ Features

### 🏠 Home — Song Library
- Import `.flac`, `.mp3`, `.ogg`, and `.wav` files via **file picker** or **drag-and-drop**.
- All imported audio is automatically converted to **OGG** for ROBOBEAT compatibility.
- Scrollable song list with overflow-safe titles and inline action buttons (configure, delete).
- **3D cassette preview** with interactive mouse-follow rotation, rendered live next to the song list.
- Loading overlay with spinner shown during heavy operations (metadata extraction, audio conversion).

### ⚙️ Config — Metadata Editor
- Edit **song title** and **artist name** with auto-saving (debounced IPC writes to `meta.json`).
- Original metadata (title, artist, duration, source filename) displayed in a read-only info card.
- **"Use Original Extracted Info"** checkbox restores the file's embedded metadata into the editable fields.
- Glassmorphism two-column card layout with styled focus states and custom checkboxes.

### 🎨 Visuals — Cassette Customizer
- Full cassette appearance editor: **rotation**, **color settings**, **stickers**, and **custom album covers**.
- Smart Palette Extraction via `node-vibrant` — auto-fills cassette and label colors from album art.
- Real-time 3D preview reflects all visual parameter changes instantly.
- Support for non-square cover images with configurable positioning.

### 🎵 Track — Beat Detection & Waveform
- **Auto Detect** mode using Essentia's streaming beat tracker with configurable BPM range filter.
- **Constant BPM** mode for manual grid generation with offset control (ArrowVortex style).
- Interactive waveform via `wavesurfer.js` with visual beat markers (red region overlays).
- **Beat pulse monitor** — animated circle that flashes in sync with detected beats during playback.
- Toggleable **metronome audio** click on each beat.
- Playback controls with time display and beat statistics (total beats, average BPM, time range).

### 📦 Export
- One-click export to `.robobeat` format (ZIP archive containing audio + metadata).
- Pre-export checklist validates all required data is present.
- Handles special characters in filenames safely across platforms.

### ⚙️ Settings
- **Font selection** from available system/bundled fonts.
- **Theme mode**: Dark, Light, or System.
- **Auto-actions** configuration (e.g., auto-extract metadata on import).
- **Danger zone**: Reset all user data (cassettes, visuals, settings).

---

## 🚀 Getting Started (Development)

1. **Clone** this repository:
   ```bash
   git clone https://github.com/roboltz/Cassettify-Remake.git
   ```
2. **Install** dependencies:
   ```bash
   npm install
   ```
3. **Run** the application:
   ```bash
   npm start
   ```

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- The bundled `ffmpeg`/`ffprobe` and `essentia` executables are included in the repo under `ffmpeg/` and `beat_finder/`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Electron (Node.js) |
| **Frontend** | HTML, CSS, JavaScript, jQuery |
| **3D Rendering** | Three.js (cassette model viewer) |
| **Audio Waveform** | wavesurfer.js |
| **Color Extraction** | node-vibrant |
| **Audio Processing** | FFmpeg & FFprobe (bundled) |
| **Beat Tracking** | Essentia (`essentia_streaming_beattracker_multifeature`) |

---

## 📋 Roadmap

See [MIGRATION_PLAN.md](MIGRATION_PLAN.md) for the full development roadmap. Current status:

- ✅ **Phase 1–4.5** — Core features complete (Home, Config, Visuals, Track, Export, Settings)
- 🔲 **Phase 5** — Performance optimizations (Worker Threads, streaming audio pipelines)
- 🔲 **Phase 6** — Future enhancements (batch export, undo/redo, custom beat sounds, keyboard shortcuts)

---

## 🙏 Credits & Acknowledgments
- Huge thanks to **miaulyn** for contributing high-quality cassette textures to the project!