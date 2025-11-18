<template>
  <div class="section-editor">
    <h3>Edytor sekcji strony</h3>
    <label>Wybierz sekcję:
      <select v-model="selected" @change="onSectionChange">
        <option v-for="s in sections" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
    </label>

    <div class="controls">

      <label>Kolor tła:
        <input type="color" v-model="cfg.bg" @input="applyBg" />
        <input class="hex" type="text" v-model="cfg.bg" @change="applyBg" />
      </label>

      <label>Kolor tekstu:
        <input type="color" v-model="cfg.textColor" @input="applyTextColor" />
        <input class="hex" type="text" v-model="cfg.textColor" @change="applyTextColor" />
      </label>

      <label>Font sekcji:
        <select v-model="cfg.font" @change="applyFont">
          <optgroup label="Project fonts" v-if="projectFonts.length">
            <option v-for="f in projectFonts" :key="'proj-'+f.family" :value="f.family">{{ f.label }}</option>
          </optgroup>
          <optgroup label="System fonts">
            <option v-for="f in systemFonts" :key="'sys-'+f.family" :value="f.family">{{ f.label }}</option>
          </optgroup>
        </select>
      </label>
      <label class="checkbox-row">
        <input type="checkbox" v-model="cfg.applyToMedia" />
        <span class="checkbox-label">Zastosuj tło bezpośrednio na warstwie media (np. <code>.hero-media</code>)</span>
      </label>
    </div>

    <div class="content-editor">
      <h4>Treść sekcji (możesz dodać kilka bloków tekstu)</h4>
      <div v-for="(b, idx) in cfg.blocks" :key="idx" class="block-row">
        <textarea v-model="cfg.blocks[idx]" rows="3"></textarea>
        <div class="block-actions">
          <button class="btn small secondary" @click="removeBlock(idx)">Usuń</button>
          <button class="btn small" @click="moveUp(idx)" :disabled="idx===0">Góra</button>
          <button class="btn small" @click="moveDown(idx)" :disabled="idx===cfg.blocks.length-1">Dół</button>
        </div>
      </div>
      <div style="margin-top:0.5rem">
        <button class="btn" @click="addBlock">Dodaj blok tekstu</button>
      </div>
    </div>

    <div class="actions">
      <button class="btn" @click="save">Zapisz sekcję</button>
      <button class="btn small secondary" @click="reset">Resetuj</button>
    </div>

    <div class="preview">
      <h4>Podgląd</h4>
      <div class="preview-box" :style="previewStyle">
        <div v-for="(b, i) in cfg.blocks" :key="i" class="preview-block">{{ b }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'

const SECTIONS_KEY = 'site-sections'

const sections = [
  { key: 'navbar', label: 'Navbar' },
  { key: 'hero', label: 'Hero' },
  { key: 'gallery', label: 'Galeria' },
  { key: 'info', label: 'Informacje' },
  { key: 'footer', label: 'Footer / Kontakt' },
]

const sectionsByKey = Object.fromEntries(sections.map(s => [s.key, s]))

const selected = ref(sections[0].key)

// simple system fonts list (kept small)
const systemFonts = [
  { family: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", label: 'System (sans-serif)' },
  { family: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", label: 'Inter' },
  { family: "Merriweather, serif", label: 'Merriweather' },
  { family: "Playfair Display, serif", label: 'Playfair Display' },
]

const projectFonts = ref([])

const data = ref({})

function ensureDefaultsFor(key) {
  if (!data.value[key]) {
    data.value[key] = { bg: '', textColor: '#222222', font: systemFonts[0].family, blocks: [], applyToMedia: false }
  } else {
    if (!Array.isArray(data.value[key].blocks)) data.value[key].blocks = []
    if (!data.value[key].font) data.value[key].font = systemFonts[0].family
    if (!data.value[key].bg) data.value[key].bg = ''
    if (!data.value[key].textColor) data.value[key].textColor = '#222222'
    if (data.value[key].applyToMedia == null) data.value[key].applyToMedia = false
  }
}
function applyTextColor() {
  const k = selected.value
  const c = (data.value[k] && data.value[k].textColor) || ''
  try { document.documentElement.style.setProperty(`--section-${k}-text-color`, c) } catch (e) {}
}

const cfg = computed(() => {
  ensureDefaultsFor(selected.value)
  return data.value[selected.value]
})

onMounted(() => {
  // load saved sections from localStorage
  reloadData()
  // ensure defaults for all
  sections.forEach(s => ensureDefaultsFor(s.key))

  // detect project fonts from @font-face rules (best-effort)
  try {
    const found = new Set()
    for (const ss of Array.from(document.styleSheets || [])) {
      let rules
      try { rules = ss.cssRules } catch (e) { continue }
      if (!rules) continue
      for (const r of Array.from(rules)) {
        if (r.type === CSSRule.FONT_FACE_RULE || (r.constructor && r.constructor.name === 'CSSFontFaceRule')) {
          const fam = (r.style && r.style.getPropertyValue('font-family')) || r.cssText.match(/font-family\s*:\s*([^;\n]+)/i)
          let famName = ''
          if (typeof fam === 'string') famName = fam.replace(/['\"]+/g, '').trim()
          else if (Array.isArray(fam)) famName = String(fam[1] || '').replace(/['\"]+/g,'').trim()
          if (famName) found.add(famName)
        }
      }
    }
    projectFonts.value = Array.from(found).map(f => ({ family: f, label: f }))
  } catch (e) { console.warn('Could not detect project fonts', e) }
})

// reload sections from storage (used when other windows/components update sections)
function reloadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(SECTIONS_KEY) || 'null')
    if (saved && typeof saved === 'object') data.value = saved
    else data.value = {}
  } catch (e) { data.value = {} }
}

// listen for external updates
onMounted(() => {
  const onUpdate = () => {
    reloadData()
  }
  window.addEventListener('sections-updated', onUpdate)
  window.addEventListener('storage', onUpdate)
  onUnmounted(() => {
    window.removeEventListener('sections-updated', onUpdate)
    window.removeEventListener('storage', onUpdate)
  })
})

function onSectionChange() {
  // reload latest data and ensure defaults for the newly selected section
  reloadData()
  ensureDefaultsFor(selected.value)
}

function applyBg() {
  const k = selected.value
  const c = (data.value[k] && data.value[k].bg) || ''
  try { document.documentElement.style.setProperty(`--section-${k}-bg`, c) } catch (e) {}
}

function applyFont() {
  const k = selected.value
  const f = (data.value[k] && data.value[k].font) || ''
  try { document.documentElement.style.setProperty(`--section-${k}-font`, f) } catch (e) {}
}

function addBlock() {
  ensureDefaultsFor(selected.value)
  data.value[selected.value].blocks.push('Nowy blok tekstu')
}

function removeBlock(idx) {
  if (!confirm('Usunąć blok tekstu?')) return
  data.value[selected.value].blocks.splice(idx, 1)
}

function moveUp(idx) {
  if (idx <= 0) return
  const arr = data.value[selected.value].blocks
  const tmp = arr[idx-1]
  arr[idx-1] = arr[idx]
  arr[idx] = tmp
}

function moveDown(idx) {
  const arr = data.value[selected.value].blocks
  if (idx >= arr.length-1) return
  const tmp = arr[idx+1]
  arr[idx+1] = arr[idx]
  arr[idx] = tmp
}

function save() {
  try {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(data.value))
    applyBg(); applyFont(); applyTextColor();
    // also set inline styles immediately for better visual feedback
    try {
      const map = {
        navbar: '.site-header',
        hero: '.hero',
        gallery: '.works-section, .gallery-container',
        info: '.text-section',
        footer: '.site-footer'
      }
      const k = selected.value
      const sel = map[k]
      if (sel) {
        const nodes = document.querySelectorAll(sel)
        nodes.forEach(n => {
          try {
            // tło
            if (data.value[k] && data.value[k].bg) n.style.background = data.value[k].bg
            else n.style.removeProperty('background')
            // font
            if (data.value[k] && data.value[k].font) n.style.fontFamily = data.value[k].font
            else n.style.removeProperty('font-family')
            // kolor tekstu
            if (data.value[k] && data.value[k].textColor) n.style.color = data.value[k].textColor
            else n.style.removeProperty('color')
          } catch (e) {}
        })
      }
      // Specjalne przypadki: .hero-media (tło), .site-header (kolor tekstu w linkach)
      if (k === 'hero' && data.value[k] && data.value[k].applyToMedia) {
        document.querySelectorAll('.hero-media').forEach(m => {
          try {
            if (data.value[k].bg) m.style.background = data.value[k].bg
            else m.style.removeProperty('background')
          } catch (e) {}
        })
      }
      if (k === 'navbar') {
        document.querySelectorAll('.site-header .nav-link').forEach(l => {
          try {
            if (data.value[k] && data.value[k].textColor) l.style.color = data.value[k].textColor
            else l.style.removeProperty('color')
          } catch (e) {}
        })
      }
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('sections-updated'))
      // Broadcast do innych zakładek (BroadcastChannel działa cross-tab)
      if (window.BroadcastChannel) {
        try {
          const bc = new BroadcastChannel('sections-sync')
          bc.postMessage('sections-updated')
          bc.close()
        } catch (e) {}
      }
    } catch(e) {}
    alert('Sekcja zapisana lokalnie')
// Odbiór broadcastu w tej zakładce (na wypadek, gdyby PA było otwarte w kilku)
if (window.BroadcastChannel) {
  try {
    const bc = new BroadcastChannel('sections-sync')
    bc.onmessage = (ev) => {
      if (ev && ev.data === 'sections-updated') reloadData()
    }
  } catch (e) {}
}
  } catch (e) { console.warn(e) }
}

function reset() {
  if (!confirm('Przywrócić domyślne ustawienia tej sekcji?')) return
  data.value[selected.value] = { bg: '', textColor: '#222222', font: systemFonts[0].family, blocks: [], applyToMedia: false }
  save()
}

const previewStyle = computed(() => {
  const k = selected.value
  const c = (data.value[k] && data.value[k].bg) || ''
  const f = (data.value[k] && data.value[k].font) || 'inherit'
  const t = (data.value[k] && data.value[k].textColor) || '#222222'
  return { background: c || 'transparent', fontFamily: f, color: t, padding: '1rem', borderRadius: '6px' }
})
</script>

<style scoped>
.section-editor { padding: 1rem; background: var(--color-section-dark); color: var(--color-text); border-radius: 8px; }
.controls { display:flex; gap:1rem; flex-wrap:wrap }
.controls label { display:flex; flex-direction:column; color: rgba(255,255,255,0.9) }
.hex { width:5.5rem }
.content-editor { margin-top:0.75rem }
.block-row { display:flex; gap:0.5rem; align-items:flex-start; margin-bottom:0.5rem }
.block-row textarea { flex:1; min-height:56px; border-radius:6px; padding:0.5rem; background: rgba(255,255,255,0.02); color: var(--color-text); border: 1px solid rgba(255,255,255,0.04) }
.block-actions { display:flex; flex-direction:column; gap:0.25rem }
.actions { margin-top:0.75rem; display:flex; gap:0.5rem }
.preview { margin-top:1rem }
.preview-box { border:1px solid rgba(255,255,255,0.04); border-radius:8px; padding:0.75rem; background: rgba(255,255,255,0.02) }
.preview-block { margin-bottom:0.5rem }
</style>
