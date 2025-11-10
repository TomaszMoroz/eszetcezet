<template>
  <div class="gallery-container">
    <!-- Header z przełącznikami i filtrami -->
    <header class="gallery-header">
      <div class="mode-switcher">
        <button 
          :class="['mode-btn', { active: currentMode === 'photos' }]"
          @click="currentMode = 'photos'"
        >
          Zdjęcia
        </button>
        <button 
          v-if="showVideos"
          :class="['mode-btn', { active: currentMode === 'videos' }]"
          @click="currentMode = 'videos'"
        >
          Wideo
        </button>
      </div>
      
      <div class="tag-filters" v-if="availableTags.length">
        <div class="tag-dropdown">
          <button class="dropdown-toggle" @click="toggleTagDropdown">
            <span>{{ selectedTag || 'Wszystkie kategorie' }}</span>
            <span class="dropdown-arrow" :class="{ open: showTagDropdown }">▼</span>
          </button>
          
          <div v-if="showTagDropdown" class="dropdown-menu">
            <button 
              class="dropdown-item"
              :class="{ active: !selectedTag }"
              @click="selectTagFromDropdown(null)"
            >
              Wszystkie
            </button>
            <button 
              v-for="tag in availableTags" 
              :key="tag"
              class="dropdown-item"
              :class="{ active: selectedTag === tag }"
              @click="selectTagFromDropdown(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Masonry Grid -->
    <div class="masonry-grid" ref="masonryGrid">
      <div 
          v-for="item in filteredItems" 
          :key="item.id"
          :class="['masonry-item', `ratio-${tileRatio}`]"
          @click="openLightbox(item)"
        >
          <img 
            v-if="currentMode === 'photos'" 
            :src="item.src" 
            :alt="item.title"
            loading="lazy"
            :style="{ objectPosition: (item.focalX!=null ? (item.focalX + '% ' + (item.focalY!=null ? item.focalY + '%' : '50%')) : '50% 50%') }"
          />
        <div v-else class="video-preview">
          <div class="play-icon">▶</div>
          <template v-if="item.thumbnail">
            <img :src="item.thumbnail" :alt="item.title" />
          </template>
          <template v-else>
            <!-- lazy-load preview video via data-src; IntersectionObserver will set src when visible -->
            <video class="masonry-video" :data-src="item.src" muted playsinline preload="metadata" style="width:100%;height:auto;display:block;opacity:0.9"></video>
          </template>
          <span v-if="item.duration" class="video-duration">{{ formatDuration(item.duration) }}</span>
        </div>
        
        <div class="item-overlay">
          <span class="item-title">{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="lightboxItem" class="lightbox" @click="closeLightbox">
      <div class="lightbox-content" @click.stop>
        <button class="close-btn" @click="closeLightbox">×</button>
        
        <img 
          v-if="currentMode === 'photos'"
          :src="lightboxItem.src" 
          :alt="lightboxItem.title"
        />
        <video 
          v-else
          :src="lightboxItem.src" 
          controls 
          autoplay
        ></video>
        
        <div class="lightbox-info">
          <h3>{{ lightboxItem.title }}</h3>
          <p v-if="lightboxItem.description" class="lightbox-description" v-html="renderMarkdown(lightboxItem.description)"></p>
          <div class="tags">
            <span v-for="tag in lightboxItem.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template><script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Reactive state
const currentMode = ref('photos')
// force tiles on the site to be uniform landscape (like in the mockup)
const tileRatio = 'landscape'
const selectedTag = ref(null)
const lightboxItem = ref(null)
const masonryGrid = ref(null)
const showTagDropdown = ref(false)
// video section visibility controlled by admin (persisted)
const showVideos = ref(true)
const SHOW_VIDEOS_KEY = 'gallery-show-videos'
const GALLERY_SEQUENCE_KEY_PHOTOS = 'gallery-sequence:photos'
const GALLERY_SEQUENCE_KEY_VIDEOS = 'gallery-sequence:videos'

// `galleryData` is intentionally empty here — we only populate gallery items
// from a manifest (`/img/manifest.json`) or from explicit sequences/metadata
// saved to localStorage. This avoids any mock/sample data baked into the app.
const galleryData = ref([])

// Computed properties
const availableTags = computed(() => {
  const tags = new Set()
  galleryData.value
    .filter(item => {
      if (!showVideos.value && item.type === 'video') return false
      return item.type === (currentMode.value === 'photos' ? 'photo' : 'video')
    })
    .forEach(item => item.tags.forEach(tag => tags.add(tag)))
  return Array.from(tags)
})

const filteredItems = computed(() => {
  return galleryData.value.filter(item => {
    if (!showVideos.value && item.type === 'video') return false
    const typeMatch = item.type === (currentMode.value === 'photos' ? 'photo' : 'video')
    const tagMatch = !selectedTag.value || item.tags.includes(selectedTag.value)
    return typeMatch && tagMatch
  })
})

// --- Video UX helpers ---
let videoObserver = null

function setupVideoObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const vid = entry.target
      const src = vid.getAttribute('data-src')
      if (src && !vid.src) {
        vid.src = src
        // try to load metadata for duration display
        vid.load()
      }
      videoObserver.unobserve(vid)
    })
  }, { rootMargin: '200px' })
  // observe existing masonry videos
  nextTick(() => {
    document.querySelectorAll('.masonry-video').forEach(v => {
      if (v.getAttribute('data-src') && !v.src) videoObserver.observe(v)
    })
  })
}

function pauseAllInlineVideos() {
  try {
    document.querySelectorAll('.masonry-video, .masonry-grid video').forEach(v => {
      if (v && !v.paused) try { v.pause() } catch(e) {}
    })
    // also pause any lightbox video instances except the one we want
  } catch (e) {}
}

function loadVideoDuration(item) {
  return new Promise((resolve) => {
    if (!item || !item.src) return resolve()
    // create a temporary video element to read metadata
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.src = item.src
    const onLoaded = () => {
      try { item.duration = Math.round(v.duration || 0) } catch (e) { item.duration = 0 }
      cleanup()
      resolve()
    }
    const onError = () => { item.duration = 0; cleanup(); resolve() }
    const cleanup = () => {
      v.removeEventListener('loadedmetadata', onLoaded)
      v.removeEventListener('error', onError)
      try { v.src = ''; v.load() } catch(e) {}
      if (v.parentNode) v.parentNode.removeChild(v)
    }
    v.addEventListener('loadedmetadata', onLoaded)
    v.addEventListener('error', onError)
    // keep offscreen
    v.style.position = 'absolute'
    v.style.left = '-9999px'
    document.body.appendChild(v)
  })
}

async function loadAllVideoDurations() {
  for (const it of galleryData.value) {
    if (it.type === 'video') {
      try { await loadVideoDuration(it) } catch (e) {}
    }
  }
}

function formatDuration(sec) {
  if (!sec && sec !== 0) return ''
  const s = Number(sec) || 0
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60).toString().padStart(2,'0')
  return `${m}:${ss}`
}

// Methods
const openLightbox = (item) => {
  lightboxItem.value = item
  document.body.style.overflow = 'hidden'
  // pause any inline preview videos
  pauseAllInlineVideos()
  // if opening a video in lightbox, ensure it plays
  nextTick(() => {
    try {
      const el = document.querySelector('.lightbox-content video')
      if (el) {
        // coerce and clamp startTime
        let start = Number(item.startTime)
        if (!Number.isFinite(start) || start < 0) start = 0

        const setAndPlay = (wanted) => {
          try { el.currentTime = wanted } catch (e) {}
          el.play().catch(()=>{})
        }

        // if metadata is already loaded and duration is available, clamp
        if (el.readyState >= 1 && Number.isFinite(el.duration) && el.duration > 0) {
          const maxStart = Math.max(0, el.duration - 0.1)
          start = Math.min(start, maxStart)
          setAndPlay(start)
        } else {
          // wait for loadedmetadata then clamp and play
          const onLoaded = () => {
            try {
              const maxStart = Number.isFinite(el.duration) ? Math.max(0, el.duration - 0.1) : start
              const finalStart = Math.min(start, maxStart)
              setAndPlay(finalStart)
            } catch (e) { setAndPlay(start) }
            el.removeEventListener('loadedmetadata', onLoaded)
          }
          el.addEventListener('loadedmetadata', onLoaded)
          // still attempt to set currentTime; browser may ignore until loaded
          try { el.currentTime = start } catch(e) {}
          el.play().catch(()=>{})
        }
      }
    } catch (e) {}
  })
}

const closeLightbox = () => {
  // pause lightbox video if playing
  try {
    const el = document.querySelector('.lightbox-content video')
    if (el && !el.paused) el.pause()
  } catch (e) {}
  lightboxItem.value = null
  document.body.style.overflow = ''
}

const filterByTag = (tag) => {
  if (selectedTag.value === tag) {
    selectedTag.value = null // Usuń filtr jeśli ten sam tag
  } else {
    selectedTag.value = tag // Ustaw nowy filtr
  }
}

const toggleTagDropdown = () => {
  showTagDropdown.value = !showTagDropdown.value
}

const selectTagFromDropdown = (tag) => {
  selectedTag.value = tag
  showTagDropdown.value = false
}

const closeDropdownOnClickOutside = (e) => {
  if (!e.target.closest('.tag-dropdown')) {
    showTagDropdown.value = false
  }
}

// Watch for mode changes to reset filters
const resetFiltersOnModeChange = () => {
  selectedTag.value = null
}

// Keyboard controls for lightbox
const handleKeydown = (e) => {
  if (lightboxItem.value && e.key === 'Escape') {
    closeLightbox()
  }
}

// Apply a gallery sequence (array of filenames or paths) to reorder galleryData
// If `strict` is true, only items matching the sequence will be kept (others removed).
const applyGallerySequence = (seq, strict = false) => {
  if (!seq || !Array.isArray(seq) || !seq.length) return
  // helper to get basename
  const basename = (p) => {
    if (!p) return ''
    const parts = p.split('/')
    return parts[parts.length - 1].toLowerCase()
  }
  const seqBasenames = seq.map(s => basename(s))

  const remaining = [...galleryData.value]
  const reordered = []

  seqBasenames.forEach(name => {
    const idx = remaining.findIndex(it => {
      const srcBase = it.src ? basename(it.src) : ''
      const thumbBase = it.thumbnail ? basename(it.thumbnail) : ''
      if (srcBase === name) return true
      if (thumbBase === name) return true
      if (it.title && it.title.toLowerCase().includes(name)) return true
      return false
    })
    if (idx > -1) {
      reordered.push(remaining.splice(idx,1)[0])
    }
  })

  if (!strict) {
    // append leftovers
    reordered.push(...remaining)
  }
  galleryData.value = reordered
}

// Merge metadata (object keyed by /img/... or filename) into current galleryData items
const applyMetadata = (meta) => {
  if (!meta || typeof meta !== 'object') return
  const byBase = {}
  Object.entries(meta).forEach(([k, v]) => {
    const base = k.split('/').pop().toLowerCase()
    byBase[base] = v
    byBase[k.toLowerCase()] = v
  })
  galleryData.value = galleryData.value.map(item => {
    const srcBase = item.src ? item.src.split('/').pop().toLowerCase() : ''
    const thumbBase = item.thumbnail ? item.thumbnail.split('/').pop().toLowerCase() : ''
    const match = byBase[srcBase] || byBase[thumbBase] || byBase[item.title && item.title.toLowerCase()]
    if (match) {
      return {
        ...item,
        title: match.title || item.title,
        // keep the metadata ratio but gallery tiles are rendered as `tileRatio` (landscape)
        ratio: match.ratio || item.ratio,
        tags: match.tags ? (Array.isArray(match.tags) ? match.tags : String(match.tags).split(',').map(t=>t.trim()).filter(Boolean)) : item.tags || [],
        // support focal point metadata (percentages 0-100)
        focalX: (match.focalX != null ? Number(match.focalX) : (item.focalX != null ? item.focalX : 50)),
        focalY: (match.focalY != null ? Number(match.focalY) : (item.focalY != null ? item.focalY : 50)),
        // support thumbnail/poster for videos
        thumbnail: match.thumbnail || item.thumbnail || '',
            // textual description (optional)
            description: match.description || item.description || '',
            // optional start time for videos (seconds)
            startTime: (match.startTime != null ? Number(match.startTime) : (item.startTime != null ? item.startTime : 0))
      }
    }
    return item
  })
}

// Load gallery images from /img/manifest.json and replace galleryData with those entries.
const loadGalleryFromManifest = async () => {
  try {
    // Respect Vite's base path so the app works when deployed under a subpath.
    const base = (import.meta.env.BASE_URL ?? '/')
    const manifestUrl = base.replace(/\/?$/, '/') + 'img/manifest.json'
    const res = await fetch(manifestUrl)
    if (!res.ok) return
    const data = await res.json()
    if (!data || !Array.isArray(data.files) || !data.files.length) return
    // build gallery items from manifest but only from /img/dashboard folder
    const items = []
    data.files.forEach((f, idx) => {
      // images from dashboard (accept either leading slash or not)
      if ((f.includes('/img/dashboard/') || f.includes('img/dashboard/')) && /\.(jpe?g|png|webp|avif|gif|heic|bmp)$/i.test(f)) {
        const name = f.split('/').pop()
        items.push({ id: 10000 + items.length, type: 'photo', title: name, src: f, ratio: 'landscape', tags: [], focalX: 50, focalY: 50 })
      }
      // video files in /videos/
      if ((f.startsWith('/videos/') || f.includes('/videos/') || f.includes('videos/')) && /\.(mp4|webm|m4v|mov|ogg)$/i.test(f)) {
        const name = f.split('/').pop()
        const it = { id: 20000 + items.length, type: 'video', title: name, src: f, thumbnail: '', ratio: 'landscape', tags: [], focalX: 50, focalY: 50 }
        items.push(it)
        // try to auto-detect a generated poster in /img/posters/{basename}.{webp|jpg}
        ;(async () => {
          try {
            await probeForPoster(it)
          } catch (e) {}
        })()
      }
    })
    if (items.length) {
      galleryData.value = items
    }
  } catch (e) {
    // ignore
  }
}

// Try to find a poster image for a video item by probing common extensions.
function probeForPoster(item) {
  return new Promise((resolve) => {
    if (!item || !item.src) return resolve()
    const base = item.src.split('/').pop().split('.').slice(0, -1).join('.')
    // Use Vite base so posters are resolved correctly in production builds
    const baseUrl = (import.meta.env.BASE_URL ?? '/')
    const postersPrefix = baseUrl.replace(/\/?$/, '/') + 'img/posters/'
    const candidates = [postersPrefix + `${base}.webp`, postersPrefix + `${base}.jpg`, postersPrefix + `${base}.jpeg`]
    let i = 0
    const tryNext = () => {
      if (i >= candidates.length) return resolve()
      const url = candidates[i++]
      const img = new Image()
      let settled = false
      img.onload = () => {
        if (settled) return
        settled = true
        item.thumbnail = url
        resolve(url)
      }
      img.onerror = () => {
        if (settled) return
        settled = true
        // try next candidate
        setTimeout(tryNext, 0)
      }
      // start loading
      img.src = url
    }
    tryNext()
  })
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', closeDropdownOnClickOutside)
  // apply saved gallery sequence if present
  // ensure we load manifest first, then apply any saved sequence (so matching uses manifest items)
  ;(async () => {
    try {
      await loadGalleryFromManifest()
    } catch (e) {}

    // load admin setting whether videos should be shown
    try {
      const sv = localStorage.getItem(SHOW_VIDEOS_KEY)
      if (sv != null) showVideos.value = sv === '1' || sv === 'true'
      if (!showVideos.value) currentMode.value = 'photos'
    } catch (e) {}

    try {
      // apply sequence for current mode only (photos vs videos)
      const key = (currentMode.value === 'photos') ? GALLERY_SEQUENCE_KEY_PHOTOS : GALLERY_SEQUENCE_KEY_VIDEOS
      const seq = JSON.parse(localStorage.getItem(key) || 'null')
      if (seq && Array.isArray(seq) && seq.length) {
        applyGallerySequence(seq, true)
      }
    } catch (e) {
      // ignore
    }
    // apply saved metadata (focal points, titles, tags)
    try {
      const meta = JSON.parse(localStorage.getItem('gallery-metadata') || 'null')
      if (meta && typeof meta === 'object') applyMetadata(meta)
    } catch (e) {}
    // lazy-load preview videos and fetch durations for video items
    try {
      // allow DOM to update with masonry items
      await nextTick()
      setupVideoObserver()
      loadAllVideoDurations().catch(()=>{})
    } catch(e) {}
  })()
  // live update: listen to storage and custom events from admin
  const handleGalleryUpdated = () => {
    try {
      // refresh showVideos in case admin changed it
      try { const sv = localStorage.getItem(SHOW_VIDEOS_KEY); if (sv != null) showVideos.value = sv === '1' || sv === 'true' } catch(e){}
      // apply sequence for current mode only
      const key = (currentMode.value === 'photos') ? GALLERY_SEQUENCE_KEY_PHOTOS : GALLERY_SEQUENCE_KEY_VIDEOS
      const seq = JSON.parse(localStorage.getItem(key) || 'null')
      if (seq && Array.isArray(seq) && seq.length) {
        applyGallerySequence(seq, true)
      } else {
        loadGalleryFromManifest()
      }
      if (!showVideos.value) currentMode.value = 'photos'
      // apply metadata if present
      try {
        const meta = JSON.parse(localStorage.getItem('gallery-metadata') || 'null')
        if (meta && typeof meta === 'object') applyMetadata(meta)
      } catch (e) {}
    } catch (e) {}
  }

  const handleStorage = (e) => {
    if (!e) return
    if (e.key === GALLERY_SEQUENCE_KEY_PHOTOS || e.key === GALLERY_SEQUENCE_KEY_VIDEOS || e.key === 'gallery-metadata' || e.key === SHOW_VIDEOS_KEY) {
      handleGalleryUpdated()
    }
  }

  window.addEventListener('gallery-updated', handleGalleryUpdated)
  window.addEventListener('storage', handleStorage)

  // clean up listeners on unmount
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('click', closeDropdownOnClickOutside)
    window.removeEventListener('gallery-updated', handleGalleryUpdated)
    window.removeEventListener('storage', handleStorage)
    try { if (videoObserver) { videoObserver.disconnect(); videoObserver = null } } catch(e) {}
  })
})

// Watch mode changes and re-apply mode-specific sequence
const loadSequenceForMode = async (mode) => {
  try {
    const key = (mode === 'photos') ? GALLERY_SEQUENCE_KEY_PHOTOS : GALLERY_SEQUENCE_KEY_VIDEOS
    const seq = JSON.parse(localStorage.getItem(key) || 'null')
    if (seq && Array.isArray(seq) && seq.length) {
      applyGallerySequence(seq, true)
    } else {
      await loadGalleryFromManifest()
      // If we're in video mode and no sequence was defined, create a default sequence
      // from the manifest-discovered video files so they appear immediately.
      if (mode === 'videos') {
        try {
          const vids = galleryData.value.filter(it => it.type === 'video').map(it => it.src)
          if (vids && vids.length) {
            localStorage.setItem(GALLERY_SEQUENCE_KEY_VIDEOS, JSON.stringify(vids))
            applyGallerySequence(vids, true)
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
}

watch(currentMode, (n) => {
  resetFiltersOnModeChange()
  loadSequenceForMode(n)
})
</script>

<style scoped>
.gallery-container {
  min-height: 100vh;
  background: var(--color-bg);
  padding: 0;
}

/* Header */
.gallery-header {
  position: sticky;
  top: 0;
  background: var(--color-header-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-section-dark);
  padding: 1.5rem 2rem;
  z-index: 100;
}

.mode-switcher {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mode-btn {
  background: var(--color-section-dark);
  border: 1px solid var(--color-section-dark);
  color: var(--color-text);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: var(--color-section-light);
  color: var(--color-text-dark);
  border-color: var(--color-section-light);
}

.tag-filters {
  position: relative;
}

.tag-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  background: var(--color-section-dark);
  border: 1px solid var(--color-section-dark);
  color: var(--color-text);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 200px;
  justify-content: space-between;
  transition: all 0.3s ease;
}

.dropdown-toggle:hover {
  background: var(--color-section-dark);
  border-color: var(--color-section-dark);
}

.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-section-dark);
  border: 1px solid var(--color-section-dark);
  border-radius: 12px;
  margin-top: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.dropdown-item {
  width: 100%;
  background: none;
  border: none;
  color: var(--color-text);
  padding: 0.75rem 1.5rem;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--color-section-dark);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--color-section-dark);
  color: var(--color-text);
}

.dropdown-item.active {
  background: var(--color-section-light);
  color: var(--color-text-dark);
}

/* Masonry Grid */
.masonry-grid {
  padding: 2rem;
  columns: 4;
  column-gap: 1rem;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1rem;
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.masonry-item:hover {
  transform: scale(1.02);
}

.masonry-item img {
  width: 100%;
  height: auto;
  display: block;
}

/* Różne proporcje */
.masonry-item.ratio-square img { aspect-ratio: 1/1; object-fit: cover; }
.masonry-item.ratio-landscape img { aspect-ratio: 4/3; object-fit: cover; }
.masonry-item.ratio-portrait img { aspect-ratio: 3/4; object-fit: cover; }

.video-preview {
  position: relative;
  background: var(--color-section-dark);
}

.video-preview img {
  width: 100%;
  height: auto;
  opacity: 0.8;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-section-light);
  color: var(--color-text-dark);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, var(--color-section-dark));
  padding: 2rem 1rem 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.masonry-item:hover .item-overlay {
  opacity: 1;
}

.item-title {
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 500;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-content img,
.lightbox-content video {
  max-width: 95vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-info {
  margin-top: 1rem;
  text-align: center;
}

.lightbox-info h3 {
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.lightbox-description {
  color: var(--color-text);
  opacity: 0.95;
  max-width: 80vw;
  margin: 0.25rem auto 0.75rem;
  font-size: 0.95rem;
  line-height: 1.4;
}

.tags {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.tag {
  background: var(--color-section-dark);
  color: var(--color-text);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .masonry-grid { columns: 3; }
}

@media (max-width: 768px) {
  .masonry-grid { 
    columns: 2; 
    padding: 1rem;
  }
  
  .gallery-header {
    padding: 1rem;
  }
  
  .mode-switcher {
    justify-content: center;
  }
  
  .dropdown-toggle {
    min-width: 280px;
    font-size: 1rem;
  }
  
  .dropdown-menu {
    max-height: 250px;
  }
}

@media (max-width: 480px) {
  .masonry-grid { 
    columns: 1;
  }
  
  .lightbox {
    padding: 1rem;
  }
}
</style>
