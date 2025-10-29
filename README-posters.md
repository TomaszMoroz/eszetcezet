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

Heuristic: pick a visually good frame (avoid black first frames)
-----------------------------------------------------------

If your source videos may have a black or unhelpful first frame, run the script with the `--best-frame` flag. The script will sample a small set of candidate times (by default `0,1,2` seconds), analyze each frame's luminance and texture using ffmpeg's signalstats, and pick the most informative frame to generate the final posters from.

Examples:

  # Sample 0,1,2s and pick the best frame; update manifest
  node ./scripts/generate-posters.js --best-frame --update-manifest

  # Custom candidate times (0,0.5,1,2)
  node ./scripts/generate-posters.js --best-frame --candidates 0,0.5,1,2 --update-manifest

Notes on candidates
- The default candidates are `0,1,2` seconds. For short clips, you may want `0,0.2,0.5`.
- If the chosen candidate time is `0`, the script captures the actual first decoded frame using ffmpeg's `select=eq(n\,0)` filter to avoid seeking issues.

CI recommendation
-----------------

The repository includes a GitHub Actions workflow `.github/workflows/generate-posters.yml` which runs the poster generator during CI and then builds the site. By default the workflow uses the `--best-frame` heuristic so generated posters are more likely to be visually informative in production. Ensure Actions runners have ffmpeg available (the workflow installs it via apt).

Local testing
-------------

Install ffmpeg on macOS:

```bash
brew install ffmpeg
```

Then run locally with the heuristic:

```bash
node ./scripts/generate-posters.js --best-frame --update-manifest
```

Or the faster first-frame-only option:

```bash
node ./scripts/generate-posters.js --update-manifest --time 0
```

Notes
- The script will not attempt to generate posters if no video files are found in `public/videos`.
- By default the script generates a high-quality JPG (width 1280) and a smaller WebP (width 800) for efficient delivery.
- If you need other sizes or additional formats, edit `scripts/generate-posters.js` or pass different flags.
