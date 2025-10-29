Font helper and workflow
========================

This project includes a small helper script to add font files to the project and register them via @font-face in `src/main.css`.

File: `scripts/add-font.js`

What it does:
- Copies a font file from your local disk into `public/fonts/<slug>/` (slug derived from the font family name).
- Appends an `@font-face` block to `src/main.css` pointing to the copied font.

Usage
-----

Install any necessary tools and then run the helper:

```bash
# example: add a woff2 font named MyFont.woff2 and register family name "MyFont"
node ./scripts/add-font.js --file ./downloads/MyFont.woff2 --family "MyFont" --weight 400
```

Options:
- `--file` or `-f`: Path to the font file on your machine (required)
- `--family` or `-n`: Font family name to register (required)
- `--weight` or `-w`: Font weight (default: 400)
- `--style`: Font style (normal or italic, default: normal)
- `--display`: Font display (swap|fallback|optional, default: swap)

After running, the script copies the file and appends an `@font-face` block to `src/main.css`. The new font will then appear in the Admin ThemeEditor under "Project fonts" (detected dynamically via @font-face rules).

Notes
-----
- This helper is intended for local workflow. If you prefer to host fonts on a CDN/S3, use the ThemeEditor UI to add a custom @font-face by entering the public URL to the font and family name.
- This script appends CSS to `src/main.css`. If you want to keep your CSS organized, move the generated `@font-face` block to an appropriate place in your styles and commit it.

Security
--------
- Only run this script with font files you trust.
