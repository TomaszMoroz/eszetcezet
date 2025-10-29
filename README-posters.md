Poster generation (ffmpeg)
==========================

This project includes a small Node.js script to generate poster images (thumbnail frames) for videos stored in `public/videos`.

File: `scripts/generate-posters.js`

What it does:
 - Scans `public/videos` for common video extensions (mp4, mov, m4v, webm, ogg).
- Uses `ffmpeg` to extract a single frame at a specified time and writes posters to `public/img/posters/`.
  By default it generates both a JPEG (`{basename}.jpg`) and a WebP (`{basename}.webp`) poster to provide a small modern format for the web plus a JPEG fallback.
- Optionally updates `public/img/manifest.json` to include the generated poster paths.

Requirements
- Node.js (v14+)
- ffmpeg installed and available on PATH. On macOS install via Homebrew:

  brew install ffmpeg

Usage
------

Generate posters (default time 1s, formats jpg+webp):

  node scripts/generate-posters.js

Specify capture time (in seconds):

  node scripts/generate-posters.js --time 2

Skip existing posters (don't overwrite):

  node scripts/generate-posters.js --skip-existing

Generate posters and update manifest (appends `/img/posters/*`):

  node scripts/generate-posters.js --update-manifest

Control formats and widths:

- Generate only jpg:

  node scripts/generate-posters.js --formats jpg

- Generate jpg+webp but with different widths:

  node scripts/generate-posters.js --formats jpg,webp --jpg-width 1280 --webp-width 720

You can also use the npm scripts:

  npm run generate-posters
  npm run generate-posters:update-manifest -- --time 2

Notes
- The script will not attempt to generate posters if no video files are found in `public/videos`.
- By default the script generates a high-quality JPG (width 1280) and a smaller WebP (width 800) for efficient delivery.
- If you need other sizes or additional formats, edit `scripts/generate-posters.js` or pass different flags.
