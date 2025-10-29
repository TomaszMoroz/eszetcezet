#!/usr/bin/env node
import { execFileSync } from 'child_process'

function run(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: 'inherit' })
    return true
  } catch (e) {
    return false
  }
}

console.log('Running prebuild: generate-manifest')
if (!run('node', ['./scripts/generate-manifest.js'])) {
  console.error('generate-manifest failed — aborting prebuild')
  process.exit(1)
}

console.log('Attempting to generate posters (optional)')
// try to generate posters but don't fail the build if ffmpeg is absent or generation fails
if (!run('node', ['./scripts/generate-posters.js', '--skip-existing', '--update-manifest'])) {
  console.warn('Poster generation skipped or failed (ffmpeg may be missing). Continuing build.')
}

process.exit(0)
