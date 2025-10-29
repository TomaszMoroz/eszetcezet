#!/usr/bin/env node
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const VIDEO_DIR = path.join(PUBLIC_DIR, 'videos')
const POSTER_DIR = path.join(PUBLIC_DIR, 'img', 'posters')
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'img', 'manifest.json')

function usage() {
  console.log(`generate-posters.js
Usage: node scripts/generate-posters.js [options]

Options:
  --time, -t <seconds>        Time (in seconds) to capture frame (default: 1)
  --skip-existing             Skip files that already have a poster in ${POSTER_DIR}
  --update-manifest           After generating posters, add them to ${MANIFEST_PATH}
  --best-frame                Sample candidate frames and pick the visually best (avoids black first frames)
  --candidates <csv>          Comma-separated candidate times in seconds (default: 0,1,2)
  --formats <csv>             Comma-separated formats to generate (jpg,webp). Default: jpg,webp
  --jpg-width <px>            Width for generated JPG (default: 1280)
  --webp-width <px>           Width for generated WebP (default: 800)
  --help                      Show this message

Examples:
  node scripts/generate-posters.js --time 2
  node scripts/generate-posters.js --skip-existing --update-manifest --formats jpg,webp --webp-width 720
`)
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function checkFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function listVideoFiles() {
  if (!fs.existsSync(VIDEO_DIR)) return []
  return fs.readdirSync(VIDEO_DIR).filter(f => /\.(mp4|mov|m4v|webm|ogg)$/i.test(f))
}

function generatePosterForVideo(videoFilename, timeSec = 1, overwrite = false) {
  const srcPath = path.join(VIDEO_DIR, videoFilename)
  const base = path.parse(videoFilename).name
  // generate multiple formats (jpg + webp by default) handled by caller
  return { base, srcPath }
}

function updateManifestWithPosters(posters) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn('Manifest not found at', MANIFEST_PATH)
    return
  }
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8')
    const json = JSON.parse(raw)
    json.files = json.files || []
    posters.forEach(p => {
      // manifest uses paths starting with /img/
      const rel = `/img/posters/${path.basename(p)}`
      if (!json.files.includes(rel)) json.files.push(rel)
    })
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(json, null, 2), 'utf8')
    console.log('Updated manifest at', MANIFEST_PATH)
  } catch (e) {
    console.error('Failed to update manifest:', e)
  }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes('--help')) return usage()

  let time = 1
  let skipExisting = false
  let updateManifest = false
  let formats = ['jpg','webp']
  let jpgWidth = 1280
  let webpWidth = 800
  let bestFrame = false
  let candidateTimes = [0,1,2]

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--time' || a === '-t') {
      const v = argv[i+1]
      i++
      time = Number(v) || 1
    } else if (a === '--skip-existing') {
      skipExisting = true
    } else if (a === '--update-manifest') {
      updateManifest = true
    } else if (a === '--formats') {
      const v = argv[i+1]; i++
      formats = String(v || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
    } else if (a === '--jpg-width') {
      const v = argv[i+1]; i++
      jpgWidth = Number(v) || jpgWidth
    } else if (a === '--webp-width') {
      const v = argv[i+1]; i++
      webpWidth = Number(v) || webpWidth
    } else if (a === '--best-frame') {
      bestFrame = true
    } else if (a === '--candidates') {
      const v = argv[i+1]; i++
      candidateTimes = String(v || '0,1,2').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
    }
  }

  // normalize formats
  const parsedFormats = (formats && formats.length) ? formats.map(f=>f.trim().toLowerCase()).filter(f=>['jpg','webp'].includes(f)) : ['jpg','webp']

  console.log('Poster generator — scanning', VIDEO_DIR)
  if (!checkFfmpeg()) {
    console.error('ffmpeg not found in PATH. Install ffmpeg (e.g. `brew install ffmpeg`) and try again.')
    process.exit(2)
  }

  ensureDir(POSTER_DIR)
  const videos = listVideoFiles()
  if (!videos.length) {
    console.log('No video files found in', VIDEO_DIR)
    return
  }

  console.log('Requested formats:', parsedFormats.join(','), 'jpgWidth=', jpgWidth, 'webpWidth=', webpWidth)

  const generated = []
  for (const v of videos) {
    const info = generatePosterForVideo(v, time, !skipExisting)
    if (info.error) { console.warn('Skipping', v); continue }
    const { base, srcPath } = info
    // determine which timestamp to use. If bestFrame is requested, sample candidate times and pick the best
    let chosenTime = Number(time)
    if (bestFrame) {
      // helper to analyze a single image using ffmpeg signalstats
      const analyzeImage = (imgPath) => {
        try {
          const out = execFileSync('ffmpeg', ['-i', imgPath, '-vf', 'signalstats', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] })
          return String(out)
        } catch (e) {
          // ffmpeg outputs stats to stderr; capture stderr if available
          const err = e && e.stderr ? String(e.stderr) : String(e)
          return err
        }
      }

      const parseStats = (txt) => {
        const yavgMatch = txt.match(/YAVG[:=]\s*([0-9.]+)/i)
        const ystdMatch = txt.match(/YSTD[:=]\s*([0-9.]+)/i)
        const yavg = yavgMatch ? Number(yavgMatch[1]) : null
        const ystd = ystdMatch ? Number(ystdMatch[1]) : null
        return { yavg, ystd }
      }

      let bestScore = -Infinity
      let bestT = chosenTime
      for (const t of candidateTimes) {
        try {
          const candidateName = `${base}.candidate.${t}.jpg`
          const candidatePath = path.join(POSTER_DIR, candidateName)
          // extract single frame at time t
          try {
            execFileSync('ffmpeg', ['-ss', String(t), '-i', srcPath, '-frames:v', '1', '-q:v', '2', '-y', candidatePath], { stdio: 'ignore' })
          } catch (e) {
            // try an alternative extraction (no -ss) in case seek fails for very short videos
            try {
              execFileSync('ffmpeg', ['-i', srcPath, '-frames:v', '1', '-q:v', '2', '-y', candidatePath], { stdio: 'ignore' })
            } catch (err) {
              console.warn('Failed to extract candidate frame at', t, 'for', v)
              continue
            }
          }
          const statsOut = analyzeImage(candidatePath)
          const { yavg, ystd } = parseStats(statsOut)
          // score: prefer higher average luminance and some texture (ystd)
          const score = (yavg || 0) + (ystd || 0) * 0.5
          console.log('Candidate', t, 'for', v, '-> YAVG=', yavg, 'YSTD=', ystd, 'score=', score)
          if (score > bestScore) {
            bestScore = score
            bestT = t
          }
          // cleanup candidate image
          try { fs.unlinkSync(candidatePath) } catch (e) {}
        } catch (e) {
          console.warn('Error sampling candidate', t, 'for', v, e)
        }
      }
      chosenTime = bestT
      console.log('Chosen best time for', v, '=>', chosenTime)
    }
    // for each requested format generate an output
    const useSelectFirstFrame = Number(time) === 0
    // if bestFrame selected and chosenTime === 0, we want to use select first-frame method
    const useSelect = bestFrame ? Number(chosenTime) === 0 : useSelectFirstFrame
    for (const fmt of parsedFormats) {
      try {
        if (fmt === 'jpg') {
          const outName = `${base}.jpg`
          const outPath = path.join(POSTER_DIR, outName)
          if (!skipExisting || !fs.existsSync(outPath)) {
            let args
            if (useSelect) {
              // grab the very first decoded frame (frame number 0)
              // use select=eq(n\\,0) with vsync vfr to ensure single frame
              args = ['-i', srcPath, '-vf', `select=eq(n\\,0),scale=${jpgWidth}:-2`, '-vsync', 'vfr', '-frames:v', '1', '-q:v', '2', '-y', outPath]
            } else {
              args = ['-ss', String(chosenTime), '-i', srcPath, '-frames:v', '1', '-vf', `scale=${jpgWidth}:-2`, '-q:v', '2', '-y', outPath]
            }
            execFileSync('ffmpeg', args, { stdio: 'ignore' })
            console.log('Generated JPG poster for', v, '->', outPath)
            generated.push(outPath)
          } else {
            console.log('Skipped existing JPG for', v)
          }
        } else if (fmt === 'webp') {
          const outName = `${base}.webp`
          const outPath = path.join(POSTER_DIR, outName)
          if (!skipExisting || !fs.existsSync(outPath)) {
            let args
            if (useSelect) {
              args = ['-i', srcPath, '-vf', `select=eq(n\\,0),scale=${webpWidth}:-2`, '-vsync', 'vfr', '-frames:v', '1', '-lossless', '0', '-q:v', '50', '-y', outPath]
            } else {
              args = ['-ss', String(chosenTime), '-i', srcPath, '-vframes', '1', '-vf', `scale=${webpWidth}:-2`, '-lossless', '0', '-q:v', '50', '-y', outPath]
            }
            execFileSync('ffmpeg', args, { stdio: 'ignore' })
            console.log('Generated WebP poster for', v, '->', outPath)
            generated.push(outPath)
          } else {
            console.log('Skipped existing WebP for', v)
          }
        }
      } catch (e) {
        console.warn('Failed to generate', fmt, 'for', v, ':', String(e))
      }
    }
  }

  if (updateManifest && generated.length) {
    updateManifestWithPosters(generated)
  }

  console.log('Done. Posters generated:', generated.length)
}

main().catch(e => { console.error(e); process.exit(1) })
