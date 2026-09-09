# Pixel Decomposer

[简体中文](README.md) · [日本語](README.ja.md) · **English**

Struggling to split sprite sheets? Can't find someone to help?

Let **Pixel Decomposer** take care of the repetitive work! Locate and extract characters, animation frames, scenery, and other assets from game sprite sheets. Detect regions, export images, and package your assets with a click. When details need extra care, adjust the selection areas manually before exporting.

Save and share project files with the assets included so teammates can continue editing. Use the built-in drawing tools for quick touch-ups, then select the frames you need—or import your own images—to create GIF animations.

Less repetitive work, more time to create. Give it a try!

**Current version: V0.1.4** · [Download](https://github.com/CZTV-28/Pixel-Decomposer/releases/latest)

## Supported platforms

Available for **Windows PCs** and **Android phones**, with a Windows EXE installer and an Android APK.

iOS, macOS, and Linux are not supported yet. Support is planned for future updates; release dates have not been announced.

## Contact and feedback

Having trouble or have a feature in mind? Get in touch:

- Email: [cztv.offical@gmail.com](mailto:cztv.offical@gmail.com)
- Discord: `cztv`
- [Report an issue or request a feature](https://github.com/CZTV-28/Pixel-Decomposer/issues)

## Features

- Automatic region detection, grid splitting, and manual rectangular selections.
- Solid-color background removal with edge-connected detection, color tolerance, and source restoration.
- Pixel drawing, fill, eyedropper, and a persistent 48-color palette with import/export.
- Lines, rectangles, ellipses, mirrored brushes, selection movement, copy/paste, flips, and rotation.
- A standalone GIF timeline with duplicate frames, reordering, and durations adjustable in 0.01-second increments.
- Custom animation canvases, part layers, keyframe interpolation, and hand-drawn motion paths.
- PNG, ZIP, and GIF export, plus `.pdec` projects containing your assets.

Open Drawing Tools at the top of the editor. Part layers belong to the GIF animation workspace; the drawing editor does not yet support independent drawing layers.

## Run locally

Install Node.js and npm, then run:

```sh
npm ci
npm start
```

## Build

Windows installer: `npm run build:win`.

For Android, install JDK 21 and the Android SDK and configure the SDK path. Set `PIXEL_DECOMPOSER_KEYSTORE`, `PIXEL_DECOMPOSER_STORE_PASSWORD`, `PIXEL_DECOMPOSER_KEY_ALIAS`, and `PIXEL_DECOMPOSER_KEY_PASSWORD` in your local environment, then run `npm run build:apk`. Use your own signing certificate; the release signing private key is not included.

Installers are distributed through GitHub Releases. The Windows installer has no publisher code signature. Android release packages are signed with a release certificate.

## Validation and limitations

Line drawing, undo, and redo were verified for V0.1.4. Basic background removal and part animation workflows have Electron runtime checks. Android touch controls and orientation layouts still need broader device coverage.

Dependencies and associated assets retain their respective licenses. A license for this project's source code has not yet been specified.
