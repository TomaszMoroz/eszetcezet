#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'

// Generate public/img/manifest.json by scanning the public/img directory
// Also include video files from public/videos so the admin/gallery can pick them
const IMG_DIR = path.join(process.cwd(), 'public', 'img')
const VIDEO_DIR = path.join(process.cwd(), 'public', 'videos')
const OUT_FILE = path.join(process.cwd(), 'public', 'img', 'manifest.json')

async function walk(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const rel = prefix ? path.posix.join(prefix, e.name) : e.name
    if (e.isDirectory()) {
      const nested = await walk(path.join(dir, e.name), rel)
      files.push(...nested)
    } else if (e.isFile()) {
      if (e.name === 'manifest.json') continue
      files.push('/img/' + rel.replaceAll('\\\\','/'))
    }
  }
  return files
}

async function main() {
  try {
    // ensure img dir exists
    await fs.access(IMG_DIR)
  } catch (err) {
    console.error('Directory not found:', IMG_DIR)
    process.exit(1)
  }

  try {
    const imgFiles = await walk(IMG_DIR)
    let files = [...imgFiles]
    // include video files if video dir exists
    try {
      await fs.access(VIDEO_DIR)
      const vEntries = await fs.readdir(VIDEO_DIR, { withFileTypes: true })
      for (const e of vEntries) {
        if (e.isFile()) {
          const name = e.name
          // include common video extensions
          if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(name)) {
            files.push('/videos/' + name)
          }
        }
      }
    } catch (e) {
      // no video dir, that's fine
    }

    const payload = { files }
    await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8')
    console.log('Wrote manifest with', files.length, 'entries to', OUT_FILE)
  } catch (err) {
    console.error('Failed to generate manifest:', err)
    process.exitCode = 1
  }
}

main()
