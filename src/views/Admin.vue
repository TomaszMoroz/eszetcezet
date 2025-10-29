<template>
  <div class="admin-panel">
    <div v-if="!authed" class="auth-modal">
      <div class="auth-box">
        <h2>Logowanie do panelu administracyjnego</h2>
        <p>Wprowadź hasło, aby kontynuować.</p>
        <input v-model="password" type="password" placeholder="Hasło" />
        <div class="auth-actions">
          <button @click="tryLogin">Zaloguj</button>
          <button @click="cancelLogin">Anuluj</button>
        </div>
        <p class="hint">Domyślne hasło: <code>admin</code> (zmień to później)</p>
      </div>
    </div>
    <div v-else>
      <h1>Panel administracyjny</h1>
    </div>
    <section v-if="authed">
      <h2>Kolejność zdjęć/wideo</h2>
      <label style="margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem">
        <input type="checkbox" v-model="showVideos" @change="toggleShowVideos" />
        <span>Włącz sekcję wideo</span>
      </label>
      <div class="edit-mode-switch" style="margin-bottom:1rem; display:flex; gap:0.5rem; align-items:center;">
        <span style="font-weight:600; margin-right:0.5rem">Edytuj sekcję:</span>
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
                  <button class="small" aria-label="Dodaj {{ element.name }} do sekwencji" @click.stop="addToSequence(element)">Dodaj</button>
                </div>
              </template>
            </draggable>
          </div>
          <div class="file-actions">
            <button @click="saveFileOrder">Zapisz kolejność plików</button>
            <button @click="applyFileOrder">Zastosuj kolejność do galerii</button>
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
                    <button class="small" aria-label="Edytuj {{ element.name }}" @click.stop="selectSequenceItemByName(element.name)">Edytuj</button>
                    <button class="small" aria-label="Usuń {{ element.name }} z sekwencji" @click.stop="removeFromSequence(index)">Usuń</button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
          <div class="file-actions">
            <button @click="saveGallerySequence">Zapisz sekwencję</button>
            <button @click="applyGallerySequence">Zastosuj sekwencję w galerii</button>
            <button @click="clearGallerySequence" class="small">Wyczyść</button>
          </div>
        </div>
      </div>
  </section>
  <section v-if="authed">
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

            <label>Start Time (sekundy):
              <input type="number" min="0" step="0.1" v-model.number="metadata[selectedMetaName].startTime" @input="onStartTimeInput(selectedMetaName)" />
              <div style="display:flex;align-items:center;gap:0.5rem">
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
              <button @click="saveMetadata">Zapisz metadane</button>
              <button class="small" @click="removeFromMetadata(selectedMetaName)">Usuń metadane</button>
              <button class="small" @click="selectedMetaName = null">Zamknij</button>
            </div>
          </div>

          <div class="meta-right">
            <p>Podgląd kafelka (kliknij, aby ustawić punkt):</p>
            <div class="preview-wrap" @click.stop="previewClick($event)">
              <template v-if="isVideoPreview(selectedMetaName)">
                <video :src="previewSrcFor(selectedMetaName)" controls muted loop playsinline style="width:100%;height:100%;object-fit:cover"></video>
              </template>
              <template v-else>
                <img :src="previewSrcFor(selectedMetaName)" alt="preview" />
              </template>
              <div v-if="metadata[selectedMetaName].focalX!=null" class="focal-dot" :style="{ left: metadata[selectedMetaName].focalX + '%', top: metadata[selectedMetaName].focalY + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p>Kliknij element w sekwencji, aby edytować jego metadane.</p>
      </div>
    </div>
  </section>
    <section>
      <h2>Motyw strony</h2>
      <ThemeEditor />
    </section>
    <section>
      <h2>Edytor sekcji</h2>
      <SectionEditor />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import draggable from 'vuedraggable';
import ThemeEditor from '../components/ThemeEditor.vue';
import SectionEditor from '../components/SectionEditor.vue';

const items = ref([
  { id: 1, type: 'photo', title: 'Salon', thumb: '/img/1.jpg' },
  { id: 2, type: 'photo', title: 'Jadalnia', thumb: '/img/2.jpg' },
  { id: 3, type: 'video', title: 'Prezentacja', thumb: '' },
]);

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

async function loadManifest() {
  try {
    const res = await fetch('/img/manifest.json')
    if (!res.ok) return
    const data = await res.json()
    // Build file objects { name, type }
    // Surface dashboard images and any video files in the manifest for portfolio management
    const list = []
    ;(data.files || []).forEach(p => {
      if (p.includes('/img/dashboard/')) {
        list.push({ name: p, type: 'photo' })
      } else if (p.startsWith('/videos/') || p.includes('/videos/')) {
        // treat files under /videos/ as videos
        list.push({ name: p, type: 'video' })
      }
    })
    // load saved order or use manifest order
    const saved = JSON.parse(localStorage.getItem(FILE_ORDER_KEY) || 'null')
    if (saved && Array.isArray(saved) && saved.length) {
      // create fileOrder from saved, but ensure we include any new files
      const merged = saved.map(n => {
        // try to keep type if present in manifest
        const found = list.find(x => x.name === n)
        return { name: n, type: found ? found.type : 'photo' }
      })
      // append any manifest items not present in saved
      list.forEach(it => { if (!merged.find(m=>m.name===it.name)) merged.push(it) })
      fileOrder.value = merged
    } else {
      fileOrder.value = list
    }
  } catch (e) {
    console.warn('Could not load manifest', e)
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
})

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
    alert('Sekwencja galerii zapisana lokalnie')
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
.admin-panel {
  background: var(--color-bg);
  min-height: 100vh;
  color: var(--color-text);
  padding: 2rem;
}
.admin-tile {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-section-dark);
  border-radius: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
}
.admin-tile img {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 0.5rem;
}
/* Auth modal */
.auth-modal { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.6); z-index:1200 }
.auth-box { background: var(--color-section-light); color: var(--color-text-dark); padding: 2rem; border-radius: 12px; width: 420px; max-width: calc(100% - 48px) }
.auth-box input { width:100%; padding:0.6rem; margin:0.5rem 0; border-radius:8px; border:1px solid rgba(0,0,0,0.1) }
.auth-actions { display:flex; gap:0.5rem }
.auth-box .hint { font-size:0.85rem; color: rgba(0,0,0,0.6); margin-top:0.5rem }
section {
  margin-bottom: 2rem;
}
label {
  display: block;
  margin-bottom: 1rem;
}
input[type="color"] {
  margin-left: 1rem;
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 0.5rem;
}
button {
  background: #3a3f4b;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem 2rem;
  cursor: pointer;
}

.files-grid { display:flex; gap:1rem; align-items:flex-start; }
.files-col, .seq-col { flex:1; min-width:0 }
.file-list, .sequence-list { max-height: 320px; overflow:auto; padding:0.5rem; border-radius:8px; background: rgba(255,255,255,0.02) }
.file-tile { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; padding:0.45rem 0.6rem; border-radius:6px; margin-bottom:0.4rem }
.file-tile .fname { font-size:0.9rem; word-break: break-word; color: var(--color-text) }
.file-actions { display:flex; gap:0.5rem; margin-top:0.5rem }
.small { padding:0.25rem 0.6rem; font-size:0.85rem; border-radius:6px }
.divider { height: 1px; background: rgba(255,255,255,0.06); margin: 1rem 0; }
.file-tile .handle { margin-right:0.5rem; cursor: grab; color: var(--color-text); user-select: none; }
.file-tile .handle:active { cursor: grabbing }
.file-tile button.small { min-width: 56px }
.file-tile .fname { max-width: 56%; overflow: hidden; text-overflow: ellipsis; }
/* Meta editor preview styles */
.meta-grid { display:flex; gap:1rem; align-items:flex-start }
.meta-left { flex:1 }
.meta-right { width:260px }
.preview-wrap { width:240px; height:180px; border-radius:8px; overflow:hidden; position:relative; background:var(--color-section-dark); display:flex; align-items:center; justify-content:center }
.preview-wrap img { width:100%; height:100%; object-fit:cover; display:block }
.focal-dot { position:absolute; width:12px; height:12px; border-radius:50%; background: rgba(255,255,255,0.95); transform: translate(-50%, -50%); border: 2px solid rgba(0,0,0,0.6) }
.focal-fieldset { border:1px solid rgba(255,255,255,0.04); padding:0.6rem; border-radius:8px }
.meta-grid .hint { font-size:0.85rem; color: rgba(255,255,255,0.6); margin-bottom:0.5rem }
.desc-counter { font-size:0.85rem; color: rgba(255,255,255,0.6); margin-top:0.25rem }
</style>
