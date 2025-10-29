#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function usage() {
  console.log(`add-font.js
Usage: node scripts/add-font.js --file <path-to-font> --family "Font Family Name" [--weight 400] [--style normal|italic] [--display swap]

Options:
  --file, -f    Path to local font file (woff, woff2, ttf, otf)
  --family, -n  Font family name to register (eg. "MyFont")
  --weight, -w  Font weight (default: 400)
  --style       Font style (normal|italic) (default: normal)
  --display     Font display (swap|fallback|optional) (default: swap)

Example:
  node scripts/add-font.js --file ./downloads/MyFont.woff2 --family "MyFont" --weight 400
`)
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--file' || a === '-f') { out.file = argv[++i] }
    else if (a === '--family' || a === '-n') { out.family = argv[++i] }
    else if (a === '--weight' || a === '-w') { out.weight = argv[++i] }
    else if (a === '--style') { out.style = argv[++i] }
    else if (a === '--display') { out.display = argv[++i] }
    else if (a === '--help' || a === '-h') { out.help = true }
  }
  return out
}

function formatFromExt(ext) {
  ext = ext.toLowerCase()
  if (ext === '.woff2') return 'woff2'
  if (ext === '.woff') return 'woff'
  if (ext === '.ttf') return 'truetype'
  if (ext === '.otf') return 'opentype'
  return ''
}

function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function main() {
  const argv = process.argv.slice(2)
  const args = parseArgs(argv)
  if (args.help || !args.file || !args.family) {
    usage(); process.exit(args.help ? 0 : 1)
  }

  const srcPath = path.resolve(args.file)
  if (!fs.existsSync(srcPath)) {
    console.error('Font file not found:', srcPath); process.exit(2)
  }

  const ext = path.extname(srcPath)
  const fmt = formatFromExt(ext)
  if (!fmt) { console.error('Unsupported font extension:', ext); process.exit(3) }

  const family = args.family
  const weight = args.weight || '400'
  const style = args.style || 'normal'
  const display = args.display || 'swap'

  const destBase = path.join(process.cwd(), 'public', 'fonts', slugify(family))
  fs.mkdirSync(destBase, { recursive: true })
  const destName = path.basename(srcPath)
  const destPath = path.join(destBase, destName)

  // copy file
  fs.copyFileSync(srcPath, destPath)
  console.log('Copied font to', destPath)

  // create @font-face CSS block
  const relUrl = `/fonts/${slugify(family)}/${destName}`
  const css = `\n/* Added by scripts/add-font.js */\n@font-face {\n  font-family: '${family}';\n  src: url('${relUrl}') format('${fmt}');\n  font-weight: ${weight};\n  font-style: ${style};\n  font-display: ${display};\n}\n`;

  // append to src/main.css
  const mainCss = path.join(process.cwd(), 'src', 'main.css')
  if (!fs.existsSync(mainCss)) {
    console.error('Could not find src/main.css to update. Please add the @font-face manually.');
    console.log('CSS snippet:\n')
    console.log(css)
    process.exit(0)
  }

  // append to end of file
  fs.appendFileSync(mainCss, css, 'utf8')
  console.log('Appended @font-face rule to src/main.css')

  console.log('Done. Font added and registered. You can now select it in ThemeEditor under Project fonts.')
}

main().catch(e => { console.error(e); process.exit(99) })
