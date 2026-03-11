<template>
  <div class="theme-editor">
    <h3>Edytor motywu</h3>
    <div class="fields">
      <div v-for="item in items" :key="item.var" class="field color-field">
        <label :for="item.var">{{ item.label }}</label>
        <div class="color-picker-row">
          <input :id="item.var" type="color" v-model="item.value" @input="updateVar(item.var, item.value)" />
          <span class="color-value">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn" @click="save">Zapisz</button>
      <button class="btn secondary" @click="reset">Resetuj</button>
    </div>

    <div class="typography">
      <h4>Typografia i fonty</h4>
  <div class="typography-row">
        <label>Sekcja:
          <select v-model="selectedSection">
            <option v-for="s in sections" :key="s.key" :value="s.key">{{ s.label }}</option>
          </select>
        </label>

          <label>
            <div style="font-weight:600">Google Fonts</div>
            <input v-model="googleFontQuery" placeholder="e.g. Roboto:ital,wght@0,400;1,700" />
            <div style="display:flex;gap:0.5rem;margin-top:0.25rem;align-items:center">
              <button class="btn small" @click="loadGoogleFont">Load Google Font</button>
              <button class="btn small" @click="addGoogleFontToList">Add to project fonts</button>
            </div>
          </label>

          <label>
            <div style="font-weight:600">Dodaj własny @font-face</div>
            <input v-model="customFontName" placeholder="Font family name" />
            <input v-model="customFontUrl" placeholder="URL do pliku font (woff/woff2/ttf)" />
            <div style="display:flex;gap:0.5rem;margin-top:0.25rem">
              <button class="btn small" @click="addCustomFont">Dodaj font</button>
              <button class="btn small" @click="copyFontFaceCss">Kopiuj CSS</button>
            </div>
          </label>

        <label>Font:
          <select v-model="typography[selectedSection].font" @change="applyTypography(selectedSection)">
            <optgroup label="Project fonts" v-if="projectFonts.length">
              <option v-for="f in projectFonts" :key="'proj-'+f.family" :value="f.family">{{ f.label }}</option>
            </optgroup>
            <optgroup label="System fonts">
              <option v-for="f in systemFonts" :key="'sys-'+f.family" :value="f.family">{{ f.label }}</option>
            </optgroup>
          </select>
        </label>

        <label>Rozmiar (px):
          <input type="number" v-model.number="typography[selectedSection].size" @input="applyTypography(selectedSection)" min="8" max="120" />
        </label>

        <label>Waga:
          <select v-model="typography[selectedSection].weight" @change="applyTypography(selectedSection)">
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
          </select>
        </label>

        <label>Kolor tekstu:
          <input type="color" v-model="typography[selectedSection].color" @input="applyTypography(selectedSection)" />
        </label>
      </div>

      <div class="typography-preview">
        <div class="preview-box" :style="previewStyle">
          <div class="preview-h1">Nagłówek — {{ sectionsByKey[selectedSection].label }}</div>
          <div class="preview-body">To jest przykładowy tekst podglądu — zobacz jak będą wyglądać fonty i kolory.</div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { colorPresets, fontPresets } from './ThemePresets.js'

// Section definitions (example sections, adjust as needed)
const sections = ref([
  { key: 'header', label: 'Nagłówek' },
  { key: 'body', label: 'Treść' },
  { key: 'footer', label: 'Stopka' }
])

const selectedSection = ref(sections.value[0]?.key || '')

// Project fonts list
const projectFonts = ref([])

// Typography config per section
const typography = ref({
  header: { font: '', size: 24, weight: 700, color: '#111111' },
  body: { font: '', size: 16, weight: 400, color: '#222222' },
  footer: { font: '', size: 14, weight: 400, color: '#333333' }
})

// Helper for preview label
const sectionsByKey = computed(() => {
  const map = {}
  sections.value.forEach(s => { map[s.key] = s })
  return map
})

const VAR_KEY = 'site-theme'
const SITE_STATE_TIMESTAMP_KEY = 'site-state-timestamp'

const defaults = [
  { var: '--color-bg', label: 'Tło', value: '#ffffff' },
  { var: '--color-text', label: 'Tekst', value: '#111111' },
  { var: '--color-header-bg', label: 'Nagłówek', value: '#222222' },
  { var: '--color-accent', label: 'Accent', value: '#ff6600' },
  { var: '--color-section-dark', label: 'Sekcja (ciemna)', value: '#333333' },
  { var: '--color-section-light', label: 'Sekcja (jasna)', value: '#eeeeee' },
  { var: '--color-text-dark', label: 'Tekst (ciemny)', value: '#444444' },
]

function cloneValue(value) {
  if (value == null) return value
  return JSON.parse(JSON.stringify(value))
}

function markThemeUpdated(value = new Date().toISOString()) {
  try { localStorage.setItem(SITE_STATE_TIMESTAMP_KEY, value) } catch (e) {}
  try { window.dispatchEvent(new CustomEvent('theme-updated')) } catch (e) {}
}

function loadSavedTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(VAR_KEY) || 'null')
    if (!saved || typeof saved !== 'object') {
      items.value = cloneValue(defaults)
      return
    }

    const colors = saved.colors && typeof saved.colors === 'object' ? saved.colors : {}
    items.value = defaults.map((item) => ({
      ...item,
      value: colors[item.var] || item.value,
    }))

    if (saved.typography && typeof saved.typography === 'object') {
      typography.value = {
        ...typography.value,
        ...cloneValue(saved.typography),
      }
    }

    applyTheme(colors)
    Object.keys(typography.value).forEach(key => applyTypography(key))
  } catch (e) {
    items.value = cloneValue(defaults)
  }
}
// Update CSS variable when color changes
function updateVar(variable, value) {
  // Ensure value is valid hex color
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    document.documentElement.style.setProperty(variable, value)
  }
}

// Apply theme colors to document
function applyTheme(colorsObj) {
  Object.entries(colorsObj).forEach(([variable, value]) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      document.documentElement.style.setProperty(variable, value)
    }
  })
}

const items = ref(JSON.parse(JSON.stringify(defaults)))

// typography defaults and font list
// system-available fonts (common fallbacks)
const systemFonts = [
  { family: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", label: 'System (sans-serif)' },
  { family: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", label: 'Inter' },
  { family: "Merriweather, serif", label: 'Merriweather (serif)' },
  { family: "Playfair Display, serif", label: 'Playfair Display (serif)' },
]

// Preset handlers
function applyColorPreset(preset) {
  if (!preset || !preset.colors) return
  items.value.forEach(i => {
    if (preset.colors[i.var]) {
      i.value = preset.colors[i.var]
      updateVar(i.var, i.value)
    }
  })
}
function applyFontPreset(preset) {
  if (!preset || !preset.font) return
  Object.keys(typography.value).forEach(k => {
    typography.value[k].font = preset.font
    applyTypography(k)
  })
}
function applyTypography(sectionKey) {
  const cfg = typography.value[sectionKey]
  if (!cfg) return
  // set CSS variables per section
  try {
    document.documentElement.style.setProperty(`--font-${sectionKey}`, cfg.font)
    document.documentElement.style.setProperty(`--font-${sectionKey}-size`, cfg.size + 'px')
    document.documentElement.style.setProperty(`--font-${sectionKey}-weight`, String(cfg.weight))
    document.documentElement.style.setProperty(`--color-${sectionKey}-text`, cfg.color)
    // Powiązanie dla footer: kolor tekstu i tła
    if (sectionKey === 'footer') {
      document.documentElement.style.setProperty('--section-footer-text-color', cfg.color)
      // Jeśli chcesz dodać wybór tła dla stopki, możesz dodać input w ThemeEditor i ustawić:
      // document.documentElement.style.setProperty('--section-footer-bg', wybranyKolorTla)
    }
  } catch (e) {}
}

function save() {
  const colorsObj = {}
  items.value.forEach(i => colorsObj[i.var] = i.value)
  // Deep clone typography to avoid Vue reactivity issues
  const typogObj = JSON.parse(JSON.stringify(typography.value))
  const obj = { colors: colorsObj, typography: typogObj }
  // Validate: ensure at least one color and one typography entry
  if (Object.keys(colorsObj).length === 0 || Object.keys(typogObj).length === 0) {
    alert('Błąd: motyw nie zawiera kolorów lub typografii!')
    return
  }
  localStorage.setItem(VAR_KEY, JSON.stringify(obj))
  markThemeUpdated()
  // re-apply to be safe
  applyTheme(colorsObj)
  Object.keys(typogObj).forEach(k => applyTypography(k))

  // --- Automatyczna publikacja motywu do manifest.json ---
  try {
    const manifestUrl = '/img/manifest.json'
    fetch(manifestUrl + '?t=' + Date.now())
      .then(res => res.json())
      .then(manifest => {
        // Zbuduj pełny manifest z wymaganymi polami
        const newManifest = {
          files: Array.isArray(manifest.files) ? manifest.files : [],
          gallerySequence: manifest.gallerySequence || { photos: [], videos: [] },
          metadata: typeof manifest.metadata === 'object' ? manifest.metadata : {},
          sections: typeof manifest.sections === 'object' ? manifest.sections : {},
          theme: obj,
          timestamp: new Date().toISOString()
        }
        fetch('http://localhost:3000/api/manifest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newManifest)
        })
        .then(r => r.ok ? alert('Motyw opublikowany!') : r.text().then(txt => alert('Błąd publikacji: ' + txt)))
        .catch(e => alert('Błąd publikacji: ' + e.message))
      })
      .catch(e => alert('Błąd pobierania manifestu: ' + e.message))
  } catch (e) { alert('Błąd automatycznej publikacji: ' + e.message) }
}

function reset() {
  localStorage.removeItem(VAR_KEY)
  items.value = cloneValue(defaults)
  typography.value = {
    header: { font: '', size: 24, weight: 700, color: '#111111' },
    body: { font: '', size: 16, weight: 400, color: '#222222' },
    footer: { font: '', size: 14, weight: 400, color: '#333333' }
  }
  markThemeUpdated()
  location.reload()
}

const previewStyle = computed(() => {
  const s = typography.value[selectedSection.value] || {}
  return {
    fontFamily: s.font || 'inherit',
    fontSize: (s.size ? s.size + 'px' : 'inherit'),
    fontWeight: s.weight || 'normal',
    color: s.color || readCssVar('--color-text') || '#111',
    padding: '1rem'
  }
})

// Google Fonts and custom font support
const googleFontQuery = ref('')
const customFontName = ref('')
const customFontUrl = ref('')
const googleFontsAdded = ref([])

onMounted(() => {
  loadSavedTheme()
  window.addEventListener('theme-updated', loadSavedTheme)
})

onUnmounted(() => {
  window.removeEventListener('theme-updated', loadSavedTheme)
})

function loadGoogleFont() {
  if (!googleFontQuery.value) return alert('Wprowadź zapytanie Google Fonts (np. Roboto:wght@400;700)')
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFontQuery.value)}&display=swap`
  if (!document.querySelector(`link[href="${href}"]`)) {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    document.head.appendChild(l)
  }
  // try to extract family name (part before :)
  const fam = googleFontQuery.value.split(':')[0]
  if (fam) {
    // add to projectFonts so it appears in select
    const exists = projectFonts.value.find(p => p.family === fam)
    if (!exists) projectFonts.value.unshift({ family: fam, label: fam })
    googleFontsAdded.value.push(fam)
  }
  alert('Załadowano Google Font. Może być konieczne odświeżenie, żeby wprowadzić zmiany w niektórych miejscach.')
}

function addGoogleFontToList() {
  if (!googleFontQuery.value) return
  const fam = googleFontQuery.value.split(':')[0]
  if (fam && !projectFonts.value.find(p => p.family === fam)) {
    projectFonts.value.unshift({ family: fam, label: fam })
    alert('Dodano font do listy projektowych fontów: ' + fam)
  }
}

function addCustomFont() {
  const name = (customFontName.value || '').trim()
  const url = (customFontUrl.value || '').trim()
  if (!name || !url) return alert('Podaj nazwę fontu i URL pliku')
  const css = `@font-face { font-family: '${name}'; src: url('${url}') format('woff2'); font-display: swap; }`
  const style = document.createElement('style')
  style.setAttribute('data-generated-font', name)
  style.appendChild(document.createTextNode(css))
  document.head.appendChild(style)
  projectFonts.value.unshift({ family: name, label: name })
  alert('Dodano font: ' + name)
}

function copyFontFaceCss() {
  const name = (customFontName.value || '').trim()
  const url = (customFontUrl.value || '').trim()
  if (!name || !url) return alert('Podaj nazwę fontu i URL pliku')
  const css = `@font-face {\n  font-family: '${name}';\n  src: url('${url}') format('woff2');\n  font-display: swap;\n}`
  navigator.clipboard && navigator.clipboard.writeText(css).then(() => alert('Skopiowano CSS do schowka'), () => alert('Kopiowanie nieudane'))
}
</script>

<style scoped>
.theme-editor { padding: 1rem; background: var(--color-section-dark); color: var(--color-text); border-radius: 8px; }
.theme-editor h3 { margin-top: 0; }
/* Color fields UX improvements */
.fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
.color-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  padding: 1rem 1rem 0.75rem 1rem;
  box-shadow: 0 1px 4px #0001;
}
.color-field label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text, #fff);
  margin-bottom: 0.25rem;
}
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.color-picker-row input[type="color"] {
  width: 44px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #0002;
}
.color-value {
  font-family: monospace;
  font-size: 0.98rem;
  color: #aaa;
  background: #222;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.5px;
}
.actions { margin-top: 1rem; display:flex; gap:0.5rem; }
.actions button { padding: 0.5rem 1rem; border-radius:6px; border:1px solid rgba(255,255,255,0.06); background: transparent; color: var(--color-text); cursor:pointer }
.actions button:first-child { background: var(--color-accent); color: #fff; border-color: var(--color-accent) }
.actions button:last-child { background: rgba(255,255,255,0.03); color: var(--color-text) }

.typography { margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius:8px }
.typography-row { display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center }
.typography-row label { display:flex; flex-direction:column; font-size:0.85rem; color: rgba(255,255,255,0.9) }
.typography-preview { margin-top:0.75rem }
.preview-box { border-radius:8px; background: var(--color-section-dark); border:1px solid rgba(255,255,255,0.04); padding: 0.75rem }
.preview-h1 { font-size:1.15rem; font-weight:700; margin-bottom:0.35rem }
.preview-body { font-size:0.95rem }
</style>
