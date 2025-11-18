<template>
  <div class="admin-panel">
    <div class="admin-inner">
    <div v-if="!authed" class="auth-modal">
      <div class="auth-box">
        <h2>Logowanie do panelu administracyjnego</h2>
        <p>Wprowadź hasło, aby kontynuować.</p>
        <input v-model="password" type="password" placeholder="Hasło" />
        <div class="auth-actions">
          <button class="btn" @click="tryLogin">Zaloguj</button>
          <button class="btn secondary" @click="cancelLogin">Anuluj</button>
        </div>
        <p class="hint">Domyślne hasło: <code>admin</code> (zmień to później)</p>
      </div>
    </div>
    <div v-else>
      <h1>Panel administracyjny</h1>
    </div>
  <section class="card" v-if="authed">
      <h2>Kolejność zdjęć/wideo</h2>
      <label class="checkbox-row">
        <input type="checkbox" v-model="showVideos" @change="toggleShowVideos" />
        <span>Włącz sekcję wideo</span>
      </label>
      <div class="edit-mode-switch">
        <span class="switch-label">Edytuj sekcję:</span>
        <button :class="['mode-btn', { active: editingMode === 'photos' }]" @click="editingMode = 'photos'">Zdjęcia</button>
        <button :class="['mode-btn', { active: editingMode === 'videos' }]" @click="editingMode = 'videos'">Wideo</button>
      </div>
      <draggable v-model="items" item-key="id">
        <template #item="{element}">
          <div class="admin-tile">
            <img v-if="element.type==='photo'" :src="element.thumb" :alt="element.title" />
            <span v-else>🎬</span>
            <span>{{ element.title }}</span>
          </div>
        </template>
      </draggable>
      <div class="divider" />
      <div class="files-grid">
        <div class="files-col">
          <h3>Pliki na serwerze</h3>
          <div class="file-list">
            <draggable v-model="draggableFileOrder" item-key="name">
              <template #item="{element}">
                <div class="file-tile" role="group" :aria-label="`file ${element.name}`">
                  <span class="handle" aria-hidden>☰</span>
                  <span class="fname">{{ element.name }}</span>
                  <button class="btn small secondary" aria-label="Dodaj {{ element.name }} do sekwencji" @click.stop="addToSequence(element)">Dodaj</button>
                </div>
              </template>
            </draggable>
          </div>
          <div class="file-actions">
            <button class="btn" @click="saveFileOrder">Zapisz kolejność plików</button>
            <button class="btn" @click="applyFileOrder">Zastosuj kolejność do galerii</button>
          </div>
        </div>

        <div class="seq-col">
          <h3>Gallery Sequence (kolejność galerii)</h3>
          <div class="sequence-list">
            <draggable v-model="gallerySequence" item-key="name">
              <template #item="{element, index}">
                <div class="file-tile" role="group" :aria-label="`sequence ${element.name}`">
                  <span class="handle" aria-hidden>☰</span>
                  <span class="fname">{{ element.name }}</span>
                  <div>
                    <button class="btn small" aria-label="Edytuj {{ element.name }}" @click.stop="selectSequenceItemByName(element.name)">Edytuj</button>
                    <button class="btn small secondary" aria-label="Usuń {{ element.name }} z sekwencji" @click.stop="removeFromSequence(index)">Usuń</button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
          <div class="file-actions">
            <button class="btn" @click="saveGallerySequence">Zapisz sekwencję</button>
            <button class="btn" @click="applyGallerySequence">Zastosuj sekwencję w galerii</button>
            <button class="btn small secondary" @click="clearGallerySequence">Wyczyść</button>
            <button class="btn small" @click="publishManifest">Publikuj manifest</button>
          </div>
        </div>
      </div>
  </section>
  <section class="card" v-if="authed">
    <h2>Edytor metadanych</h2>
      <div class="meta-editor">
      <div v-if="selectedMetaName">
        <p>Edytujesz: <strong>{{ selectedMetaName }}</strong></p>
        <div class="meta-grid">
          <div class="meta-left">
            <label>Title: <input v-model="metadata[selectedMetaName].title" /></label>
            <label>Ratio:
              <select v-model="metadata[selectedMetaName].ratio">
                <option value="landscape">landscape</option>
                <option value="square">square</option>
                <option value="portrait">portrait</option>
              </select>
            </label>
            <label>Tags (oddziel przecinkami): <input v-model="metadata[selectedMetaName].tags" placeholder="tag1,tag2" /></label>
            <label>Description:
              <textarea v-model="metadata[selectedMetaName].description" placeholder="Krótki opis zdjęcia lub filmu" rows="4" :maxlength="DESCRIPTION_MAXLEN" @input="onDescriptionInput(selectedMetaName)"></textarea>
            </label>
            <div class="desc-counter">{{ (metadata[selectedMetaName].description || '').length }} / {{ DESCRIPTION_MAXLEN }} znaków</div>

            <label>Thumbnail / Poster URL: 
              <input v-model="metadata[selectedMetaName].thumbnail" placeholder="/img/.. or https://.." />
            </label>
            <label>Wybierz z plików serwera:
              <select @change="(e)=>{ metadata[selectedMetaName].thumbnail = e.target.value }">
                <option value="">— wybierz —</option>
                <option v-for="f in fileOrder.filter(x => x.type === (editingMode === 'photos' ? 'photo' : 'video'))" :key="f.name" :value="f.name">{{ f.name.split('/').pop() }}</option>
              </select>
            </label>

            <label class="time-row">Start Time (sekundy):
              <input type="number" min="0" step="0.1" v-model.number="metadata[selectedMetaName].startTime" @input="onStartTimeInput(selectedMetaName)" />
              <div class="time-hint">
                <div class="hint">Jeśli ustawione, wideo w lightboxie rozpocznie od tej sekundy.</div>
                <div v-if="metadata[selectedMetaName] && metadata[selectedMetaName].startTime != null" class="time-preview">({{ formatTime(metadata[selectedMetaName].startTime) }})</div>
              </div>
            </label>

            <fieldset class="focal-fieldset">
              <legend>Ustaw punkt centralny kafelka (focal point)</legend>
              <p class="hint">Kliknij na obrazku obok, aby wskazać, która część ma być widoczna. Możesz też użyć suwaków.</p>
              <label>Focal X: <input type="range" min="0" max="100" v-model.number="metadata[selectedMetaName].focalX" /> <span>{{ metadata[selectedMetaName].focalX }}%</span></label>
              <label>Focal Y: <input type="range" min="0" max="100" v-model.number="metadata[selectedMetaName].focalY" /> <span>{{ metadata[selectedMetaName].focalY }}%</span></label>
            </fieldset>

            <div class="file-actions">
              <button class="btn" @click="saveMetadata">Zapisz metadane</button>
              <button class="btn small secondary" @click="removeFromMetadata(selectedMetaName)">Usuń metadane</button>
              <button class="btn small secondary" @click="selectedMetaName = null">Zamknij</button>
            </div>
          </div>

          <div class="meta-right">
            <p>Podgląd kafelka (kliknij, aby ustawić punkt):</p>
            <div class="preview-wrap landscape" @click.stop="previewClick($event)">
              <template v-if="isVideoPreview(selectedMetaName)">
                <video :src="previewSrcFor(selectedMetaName)" controls muted loop playsinline class="preview-media" style="object-fit:cover;width:100%;height:100%;"></video>
              </template>
              <template v-else>
                <img 
                  :src="previewSrcFor(selectedMetaName)" 
                  alt="preview" 
                  class="preview-media" 
                  :style="{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    objectPosition: (metadata[selectedMetaName]?.focalX != null ? (metadata[selectedMetaName].focalX + '% ' + (metadata[selectedMetaName]?.focalY != null ? metadata[selectedMetaName].focalY + '%' : '50%')) : '50% 50%')
                  }"
                />
              </template>
              <div v-if="metadata[selectedMetaName].focalX!=null" class="focal-dot" :style="{ left: metadata[selectedMetaName].focalX + '%', top: metadata[selectedMetaName].focalY + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
    <section class="card">
      <h2>Motyw strony</h2>
      <ThemeEditor />
    </section>
    <section class="card">
      <h2>Edytor sekcji</h2>
      <SectionEditor />
    </section>
    <section class="card">
      <h2>Podsumowanie zmian i publikacja</h2>
      <div class="publish-summary">
        <div class="summary-row"><strong>Pliki na serwerze:</strong> {{ fileOrder.length }}</div>
        <div class="summary-row"><strong>Sekwencja zdjęć:</strong> {{ gallerySequencePhotos.length }}</div>
        <div class="summary-row"><strong>Sekwencja wideo:</strong> {{ gallerySequenceVideos.length }}</div>
        <div class="summary-row"><strong>Pozycje w metadata:</strong> {{ metadataCount }}</div>
        <div class="summary-row"><strong>Konfiguracja sekcji (site-sections):</strong> {{ sectionsCount }}</div>
        <div class="summary-row"><strong>Motyw (site-theme):</strong> {{ themePresent ? 'tak' : 'brak' }}</div>

        <label class="endpoint-row">Endpoint publikacji:
          <input v-model="publishEndpoint" placeholder="https://example.com/api/manifest" />
        </label>
        <label class="endpoint-row">Token (X-ADMIN-TOKEN):
          <input v-model="publishToken" placeholder="opcjonalny token" />
        </label>

        <div class="file-actions">
          <button class="btn" @click="publishChanges">Publikuj zmiany na serwer</button>
          <button class="btn small secondary" @click="savePublishSettings">Zapisz ustawienia</button>
        </div>
        <div v-if="lastPublishedAt" class="hint">Ostatnia publikacja: {{ lastPublishedAt }}</div>
      </div>
    </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import draggable from 'vuedraggable';
import ThemeEditor from '../components/ThemeEditor.vue';
import SectionEditor from '../components/SectionEditor.vue';
// admin styles
import '../styles/admin.css'

// no hard-coded sample items — items are populated from manifest/sequence
const items = ref([])

const fileOrder = ref([])
const gallerySequencePhotos = ref([])
const gallerySequenceVideos = ref([])
const metadata = ref({})
const selectedMetaName = ref(null)

const METADATA_KEY = 'gallery-metadata'

const GALLERY_SEQUENCE_KEY_PHOTOS = 'gallery-sequence:photos'
const GALLERY_SEQUENCE_KEY_VIDEOS = 'gallery-sequence:videos'
const SHOW_VIDEOS_KEY = 'gallery-show-videos'
const DESCRIPTION_MAXLEN = 1000
const PUBLISH_ENDPOINT_KEY = 'admin-publish-endpoint'
const PUBLISH_TOKEN_KEY = 'admin-publish-token'
const LAST_PUBLISHED_KEY = 'admin-last-published'

// computed writable sequence for current editing mode
const gallerySequence = computed({
  get() {
    return (editingMode.value === 'photos') ? gallerySequencePhotos.value : gallerySequenceVideos.value
  },
  set(val) {
    if (editingMode.value === 'photos') gallerySequencePhotos.value = val
    else gallerySequenceVideos.value = val
  }
})

// whether admin is editing photo or video assets
const editingMode = ref('photos')

// computed writable list for draggable that only includes items matching editingMode
const draggableFileOrder = computed({
  get() {
    const mode = editingMode.value === 'photos' ? 'photo' : 'video'
    return fileOrder.value.filter(f => f.type === mode)
  },
  set(newList) {
    // merge newList back into fileOrder preserving relative positions of other types
    const mode = editingMode.value === 'photos' ? 'photo' : 'video'
    const result = []
    // index for consuming newList
    let idx = 0
    for (const item of fileOrder.value) {
      if (item.type === mode) {
        // if newList has an item at idx, use it; otherwise keep original
        if (idx < newList.length) {
          result.push(newList[idx])
        } else {
          result.push(item)
        }
        idx++
      } else {
        result.push(item)
      }
    }
    // if fileOrder had no entries of this type (empty), append newList
    if (!fileOrder.value.some(f => f.type === mode)) {
      result.push(...newList)
    }
    fileOrder.value = result
  }
})


// Simple auth state (session only)
const authed = ref(sessionStorage.getItem('admin-authed') === '1')
const password = ref('')

function tryLogin() {
  // default password = 'admin' (not secure) — for later replace with real auth
  if (password.value === 'admin') {
    authed.value = true
    sessionStorage.setItem('admin-authed', '1')
  } else {
    alert('Nieprawidłowe hasło')
  }
}

function cancelLogin() {
  password.value = ''
}

const FILE_ORDER_KEY = 'gallery-file-order'

// publish endpoint (configurable via Vite env)
const PUBLISH_URL = import.meta.env.VITE_PUBLISH_MANIFEST_URL || '/api/manifest'
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || ''

async function loadManifest() {
  try {
    // prefer backend file listing which exposes files uploaded via FTP or other methods
    const filesRes = await fetch('/api/files')
    if (filesRes && filesRes.ok) {
      const body = await filesRes.json()
      const list = (body.files || []).map(f => ({ name: f.name, type: f.type || 'photo' }))
      // merge with saved order if present
      const saved = JSON.parse(localStorage.getItem(FILE_ORDER_KEY) || 'null')
      if (saved && Array.isArray(saved) && saved.length) {
        const merged = saved.map(n => {
          const found = list.find(x => x.name === n)
          return { name: n, type: found ? found.type : 'photo' }
        })
        list.forEach(it => { if (!merged.find(m => m.name === it.name)) merged.push(it) })
        fileOrder.value = merged
      } else {
        fileOrder.value = list
      }
      return
    }

    // fallback: read manifest.json from public if /api/files isn't available
    const res = await fetch('/img/manifest.json')
    if (!res.ok) return
    const data = await res.json()
    const list = []
    ;(data.files || []).forEach(p => {
      if (p.includes('/img/dashboard/')) {
        list.push({ name: p, type: 'photo' })
      } else if (p.startsWith('/videos/') || p.includes('/videos/')) {
        list.push({ name: p, type: 'video' })
      }
    })
    const saved = JSON.parse(localStorage.getItem(FILE_ORDER_KEY) || 'null')
    if (saved && Array.isArray(saved) && saved.length) {
      const merged = saved.map(n => {
        const found = list.find(x => x.name === n)
        return { name: n, type: found ? found.type : 'photo' }
      })
      list.forEach(it => { if (!merged.find(m=>m.name===it.name)) merged.push(it) })
      fileOrder.value = merged
    } else {
      fileOrder.value = list
    }
  } catch (e) {
    console.warn('Could not load manifest/files', e)
  }
}

function saveFileOrder() {
  try {
    const arr = fileOrder.value.map(f => f.name)
    localStorage.setItem(FILE_ORDER_KEY, JSON.stringify(arr))
    alert('Kolejność plików zapisana lokalnie')
  } catch (e) { console.warn(e) }
}

function applyFileOrder() {
  // Reorder items based on file names contained in thumb paths or title
  const order = fileOrder.value.map(f => f.name)
  // Helper: basename
  const basename = (p) => {
    if (!p) return ''
    const segs = p.split('/')
    return segs[segs.length-1]
  }

  const reordered = []
  const remaining = [...items.value]
  order.forEach(fname => {
    const targetBase = basename(fname).toLowerCase()
    const idx = remaining.findIndex(it => {
      const tf = basename(it.thumb).toLowerCase()
      if (tf && tf === targetBase) return true
      if (it.title && it.title.toLowerCase().includes(targetBase)) return true
      return false
    })
    if (idx > -1) {
      reordered.push(remaining.splice(idx,1)[0])
    }
  })
  // append leftover items
  reordered.push(...remaining)
  // replace items
  items.value = reordered
  alert('Galeria zaktualizowana zgodnie z zapisanym porządkiem nazw')
}

onMounted(() => {
  loadManifest()
  // load saved gallery sequences for photos and videos
  try {
    const savedPhotos = JSON.parse(localStorage.getItem(GALLERY_SEQUENCE_KEY_PHOTOS) || 'null')
    if (savedPhotos && Array.isArray(savedPhotos)) {
      gallerySequencePhotos.value = savedPhotos.map(n => ({ name: n }))
    }
  } catch (e) {}
  try {
    const savedVideos = JSON.parse(localStorage.getItem(GALLERY_SEQUENCE_KEY_VIDEOS) || 'null')
    if (savedVideos && Array.isArray(savedVideos)) {
      gallerySequenceVideos.value = savedVideos.map(n => ({ name: n }))
    }
  } catch (e) {}
  // load metadata
  try {
    const savedMeta = JSON.parse(localStorage.getItem(METADATA_KEY) || 'null')
    if (savedMeta && typeof savedMeta === 'object') metadata.value = savedMeta
  } catch (e) {}
  // load show videos setting (default true)
  try {
    const sv = localStorage.getItem(SHOW_VIDEOS_KEY)
    if (sv != null) showVideos.value = sv === '1' || sv === 'true'
  } catch (e) {}
  // load publish settings
  try {
    const ep = localStorage.getItem(PUBLISH_ENDPOINT_KEY)
    if (ep) publishEndpoint.value = ep
    const tok = localStorage.getItem(PUBLISH_TOKEN_KEY)
    if (tok) publishToken.value = tok
    const last = localStorage.getItem(LAST_PUBLISHED_KEY)
    if (last) lastPublishedAt.value = last
  } catch (e) {}
})

// publish UI state
const publishEndpoint = ref(localStorage.getItem(PUBLISH_ENDPOINT_KEY) || '/api/manifest')
const publishToken = ref(localStorage.getItem(PUBLISH_TOKEN_KEY) || '')
const lastPublishedAt = ref(localStorage.getItem(LAST_PUBLISHED_KEY) || '')

const metadataCount = computed(() => Object.keys(metadata.value || {}).length)
const sectionsCount = computed(() => {
  try { const s = JSON.parse(localStorage.getItem('site-sections')||'{}'); return Object.keys(s||{}).length } catch(e){return 0}
})
const themePresent = computed(() => !!localStorage.getItem('site-theme'))

function savePublishSettings() {
  try {
    localStorage.setItem(PUBLISH_ENDPOINT_KEY, publishEndpoint.value || '')
    localStorage.setItem(PUBLISH_TOKEN_KEY, publishToken.value || '')
    alert('Ustawienia publikacji zapisane lokalnie')
  } catch (e) { console.warn(e) }
}

async function publishChanges() {
  const ep = (publishEndpoint.value || '').trim()
  if (!ep) return alert('Podaj endpoint publikacji')
  // build payload
  const payload = {
    fileOrder: fileOrder.value.map(f => f.name),
    gallerySequence: {
      photos: (gallerySequencePhotos.value || []).map(f => f.name || f),
      videos: (gallerySequenceVideos.value || []).map(f => f.name || f)
    },
    metadata: metadata.value || {},
    sections: (() => { try { return JSON.parse(localStorage.getItem('site-sections')||'{}') } catch(e){return {}} })(),
    theme: (() => { try { return JSON.parse(localStorage.getItem('site-theme')||'null') } catch(e){return null} })(),
    timestamp: new Date().toISOString()
  }

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (publishToken.value) headers['x-admin-token'] = publishToken.value
    const res = await fetch(ep, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (!res.ok) {
      const txt = await res.text().catch(()=>res.statusText)
      return alert('Publikacja nie powiodła się: ' + res.status + ' ' + txt)
    }
    const now = new Date().toLocaleString()
    lastPublishedAt.value = now
    try { localStorage.setItem(LAST_PUBLISHED_KEY, now) } catch(e){}
    alert('Publikacja zakończona powodzeniem')
  } catch (e) {
    console.error(e)
    alert('Błąd podczas publikacji: ' + (e && e.message ? e.message : e))
  }
}

function addToSequence(file) {
  if (!file) return
  // avoid duplicates
  if (!gallerySequence.value.find(f => f.name === file.name)) {
    gallerySequence.value.push({ name: file.name })
  }
}

// show/hide video section (persisted)
const showVideos = ref(true)

function toggleShowVideos() {
  try {
    localStorage.setItem(SHOW_VIDEOS_KEY, showVideos.value ? '1' : '0')
    // notify gallery to refresh
    try { window.dispatchEvent(new CustomEvent('gallery-updated')) } catch (e) {}
  } catch (e) { console.warn(e) }
}

function removeFromSequence(idx) {
  gallerySequence.value.splice(idx, 1)
}

function saveGallerySequence() {
  try {
    const arr = gallerySequence.value.map(f => f.name)
    const key = (editingMode.value === 'photos') ? GALLERY_SEQUENCE_KEY_PHOTOS : GALLERY_SEQUENCE_KEY_VIDEOS
    localStorage.setItem(key, JSON.stringify(arr))
    // notify other windows/components
    try { window.dispatchEvent(new CustomEvent('gallery-updated')) } catch (e) {}
    // automatycznie publikuj manifest po zapisaniu sekwencji
    setTimeout(() => publishManifest(), 100)
  } catch (e) { console.warn(e) }
}

function clearGallerySequence() {
  if (!confirm('Wyczyścić sekwencję galerii?')) return
  gallerySequence.value = []
  const key = (editingMode.value === 'photos') ? GALLERY_SEQUENCE_KEY_PHOTOS : GALLERY_SEQUENCE_KEY_VIDEOS
  localStorage.removeItem(key)
}

function applyGallerySequence() {
  // Save first
  saveGallerySequence()
  // Notifying user: Gallery.vue will pick up the sequence on reload or on mount
  try { window.dispatchEvent(new CustomEvent('gallery-updated')) } catch (e) {}
  alert('Sekwencja zapisana. Galeria zostanie zaktualizowana automatycznie.')
}

// Publish a manifest (files, sequences and metadata) to a central endpoint
async function publishManifest() {
  try {
    const manifest = {
      generatedAt: new Date().toISOString(),
      files: fileOrder.value.map(f => f.name),
      sequences: {
        photos: gallerySequencePhotos.value.map(f => f.name),
        videos: gallerySequenceVideos.value.map(f => f.name)
      },
      metadata: metadata.value || {}
    }

    const headers = { 'Content-Type': 'application/json' }
    if (ADMIN_TOKEN) headers['X-ADMIN-TOKEN'] = ADMIN_TOKEN

    const res = await fetch(PUBLISH_URL, { method: 'POST', headers, body: JSON.stringify(manifest) })
    if (!res.ok) {
      const txt = await res.text().catch(()=>res.statusText)
      throw new Error(`Publish failed: ${res.status} ${txt}`)
    }
    alert('Manifest został opublikowany pomyślnie')
    // notify gallery to refresh
    try { window.dispatchEvent(new CustomEvent('gallery-updated')) } catch (e) {}
  } catch (e) {
    console.error('publishManifest error', e)
    alert('Błąd publikacji manifestu: ' + (e && e.message ? e.message : String(e)))
  }
}

function selectSequenceItemByName(name) {
  selectedMetaName.value = name
  if (!metadata.value[name]) {
    metadata.value[name] = { title: name.split('/').pop(), ratio: 'landscape', tags: '', focalX: 50, focalY: 50, thumbnail: '', description: '', startTime: 0 }
  } else {
    // ensure focal defaults exist
    if (metadata.value[name].focalX == null) metadata.value[name].focalX = 50
    if (metadata.value[name].focalY == null) metadata.value[name].focalY = 50
  }
}

function previewSrcFor(name) {
  // name is often the path from manifest (/img/...), if so return it directly
  if (!name) return ''
  if (name.startsWith('/img/') || name.startsWith('http')) return name
  // otherwise try to find in fileOrder or gallerySequence
  const found = (fileOrder.value || []).find(f => f.name && f.name.endsWith(name))
  if (found) return found.name
  const seqFound = (gallerySequence.value || []).find(f => f.name && f.name.endsWith(name))
  if (seqFound) return seqFound.name
  return name
}

function previewClick(e) {
  if (!selectedMetaName.value) return
  // find either img or video inside preview
  const el = e.currentTarget.querySelector('img, video')
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
  metadata.value[selectedMetaName.value].focalX = Math.max(0, Math.min(100, x))
  metadata.value[selectedMetaName.value].focalY = Math.max(0, Math.min(100, y))
}

function onDescriptionInput(name) {
  if (!name) return
  const val = metadata.value[name] && metadata.value[name].description ? String(metadata.value[name].description) : ''
  if (val.length > DESCRIPTION_MAXLEN) {
    metadata.value[name].description = val.slice(0, DESCRIPTION_MAXLEN)
  }
}

function onStartTimeInput(name) {
  if (!name) return
  const m = metadata.value[name]
  if (!m) return
  // coerce to number and clamp to >= 0
  const n = Number(m.startTime)
  if (!Number.isFinite(n) || n < 0) {
    m.startTime = 0
  } else {
    // keep one decimal place precision
    m.startTime = Math.round(n * 10) / 10
  }
}

function formatTime(sec) {
  const s = Number(sec) || 0
  if (s <= 0) return '0:00'
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

function isVideoPreview(name) {
  const src = previewSrcFor(name)
  if (!src) return false
  return /\.(mp4|webm|ogg|m4v)$/i.test(src) || String(src).startsWith('/videos/')
}

function saveMetadata() {
  try {
    // ensure numeric fields are normalized before saving
    try {
      Object.keys(metadata.value || {}).forEach(k => {
        const m = metadata.value[k]
        if (!m) return
        if (m.startTime != null) {
          const n = Number(m.startTime)
          m.startTime = (Number.isFinite(n) && n >= 0) ? Math.round(n * 10) / 10 : 0
        }
      })
    } catch (e) {}
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata.value))
    // notify gallery to refresh
    try { window.dispatchEvent(new CustomEvent('gallery-updated')) } catch (e) {}
    alert('Metadata zapisana')
  } catch (e) { console.warn(e) }
}

function removeFromMetadata(name) {
  if (!name) return
  if (!confirm('Usunąć metadane dla ' + name + '?')) return
  delete metadata.value[name]
  localStorage.setItem(METADATA_KEY, JSON.stringify(metadata.value))
}
</script>

<style scoped>
.preview-wrap.landscape {
  width: 320px;
  aspect-ratio: 16/9;
  background: #222;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px #0002;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #222;
  border-radius: 0;
}
.focal-dot {
  position: absolute;
  width: 18px;
  height: 18px;
  background: #e22;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 0 6px #0008;
}
</style>
