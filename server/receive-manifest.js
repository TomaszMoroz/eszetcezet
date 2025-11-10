const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' })) // allow reasonably sized JSON payloads

// Protect the endpoint by setting ADMIN_TOKEN env var when running the server.
// If ADMIN_TOKEN is empty, the endpoint will accept unauthenticated requests (dev only).
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''

app.post('/api/manifest', (req, res) => {
  if (ADMIN_TOKEN) {
    const token = req.headers['x-admin-token'] || req.headers['x-admin-token'.toLowerCase()]
    if (!token || token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const payload = req.body
  if (!payload) return res.status(400).json({ error: 'Missing JSON body' })

  // Write to public/img/manifest.json (relative to repo root)
  const outDir = path.join(__dirname, '..', 'public', 'img')
  const outPath = path.join(outDir, 'manifest.json')

  try {
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8')
    console.log('Wrote manifest to', outPath)
    return res.json({ ok: true, written: outPath })
  } catch (e) {
    console.error('Failed to write manifest', e && e.stack ? e.stack : e)
    // In dev expose the message; in production you should avoid sending stacks to clients
    return res.status(500).json({ error: e && e.message ? e.message : String(e), stack: (e && e.stack) ? e.stack : undefined })
  }
})

// List files available on the server for the admin panel to manage.
// Scans public/img and public/videos and returns an array of file entries { name: '/img/..', type: 'photo'|'video' }
app.get('/api/files', (req, res) => {
  try {
    const root = path.join(__dirname, '..', 'public')
    const imagesDir = path.join(root, 'img')
    const videosDir = path.join(root, 'videos')

    const out = []

    function pushFiles(dirPath, urlPrefix, type) {
      if (!fs.existsSync(dirPath)) return
      const items = fs.readdirSync(dirPath, { withFileTypes: true })
      items.forEach(it => {
        if (it.isFile()) {
          out.push({ name: `${urlPrefix}/${it.name}`, type })
        } else if (it.isDirectory()) {
          // include files in subfolders (one level deep)
          const sub = path.join(dirPath, it.name)
          fs.readdirSync(sub, { withFileTypes: true }).forEach(sit => {
            if (sit.isFile()) out.push({ name: `${urlPrefix}/${it.name}/${sit.name}`, type })
          })
        }
      })
    }

    pushFiles(imagesDir, '/img', 'photo')
    pushFiles(videosDir, '/videos', 'video')

    return res.json({ files: out })
  } catch (e) {
    console.error('Failed to list files', e && e.stack ? e.stack : e)
    return res.status(500).json({ error: e && e.message ? e.message : String(e) })
  }
})

// Health endpoint for readiness checks
app.get('/api/health', (req, res) => {
  try {
    return res.json({ ok: true, time: new Date().toISOString(), pid: process.pid, adminTokenConfigured: !!ADMIN_TOKEN })
  } catch (e) {
    console.error('Health check error', e)
    return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Manifest receiver listening on http://localhost:${port}`))
