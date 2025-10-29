<template>
  <div class="theme-editor">
    <h3>Edytor motywu</h3>
    <div class="fields">
      <div v-for="item in items" :key="item.var" class="field">
        <label>{{ item.label }}</label>
        <input type="color" v-model="item.value" @input="updateVar(item.var, item.value)" />
        <input class="hex" type="text" v-model="item.value" @change="updateVar(item.var, item.value)" />
      </div>
    </div>

    <div class="actions">
      <button @click="save">Zapisz</button>
      <button @click="reset">Resetuj</button>
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
              <button class="small" @click="loadGoogleFont">Load Google Font</button>
              <button class="small" @click="addGoogleFontToList">Add to project fonts</button>
            </div>
          </label>

          <label>
            <div style="font-weight:600">Dodaj własny @font-face</div>
            <input v-model="customFontName" placeholder="Font family name" />
            <input v-model="customFontUrl" placeholder="URL do pliku font (woff/woff2/ttf)" />
            <div style="display:flex;gap:0.5rem;margin-top:0.25rem">
              <button class="small" @click="addCustomFont">Dodaj font</button>
              <button class="small" @click="copyFontFaceCss">Kopiuj CSS</button>
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
import { ref, onMounted, computed } from 'vue'

const VAR_KEY = 'site-theme'

const defaults = [
  { var: '--color-bg', label: 'Tło', value: '' },
  { var: '--color-text', label: 'Tekst', value: '' },
  { var: '--color-header-bg', label: 'Nagłówek', value: '' },
  { var: '--color-accent', label: 'Accent', value: '' },
  { var: '--color-section-dark', label: 'Sekcja (ciemna)', value: '' },
  { var: '--color-section-light', label: 'Sekcja (jasna)', value: '' },
  { var: '--color-text-dark', label: 'Tekst (ciemny)', value: '' },
]

const items = ref(JSON.parse(JSON.stringify(defaults)))

// typography defaults and font list
// system-available fonts (common fallbacks)
const systemFonts = [
  { family: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", label: 'System (sans-serif)' },
  { family: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", label: 'Inter' },
  { family: "Merriweather, serif", label: 'Merriweather (serif)' },
  { family: "Playfair Display, serif", label: 'Playfair Display (serif)' },
]

// projectFonts will be discovered from loaded stylesheets (@font-face rules)
const projectFonts = ref([])

const sections = [
  { key: 'base', label: 'Tekst podstawowy (body)' },
  { key: 'heading', label: 'Nagłówki (h1,h2)' },
  { key: 'caption', label: 'Podpisy/mały tekst' },
  { key: 'nav', label: 'Nawigacja / przyciski' },
]

const sectionsByKey = Object.fromEntries(sections.map(s => [s.key, s]))

const selectedSection = ref(sections[0].key)

const typography = ref({})
function ensureTypographyDefaults() {
  sections.forEach(s => {
    if (!typography.value[s.key]) {
      const defaultFont = (projectFonts.value && projectFonts.value[0] && projectFonts.value[0].family) || (systemFonts && systemFonts[0] && systemFonts[0].family) || 'system-ui'
      typography.value[s.key] = { font: defaultFont, size: (s.key === 'heading' ? 28 : s.key === 'caption' ? 12 : 16), weight: 400, color: readCssVar('--color-text') || '#111' }
    }
  })
}

// initialize defaults synchronously so template bindings don't access undefined
ensureTypographyDefaults()

function readCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || ''
}

function applyTheme(obj) {
  Object.entries(obj || {}).forEach(([k, v]) => {
    try { document.documentElement.style.setProperty(k, v) } catch (e) {}
  })
}

onMounted(() => {
  // initialize current values from computed styles or saved storage
  const saved = JSON.parse(localStorage.getItem(VAR_KEY) || 'null')
  if (saved) {
    // apply saved first
    applyTheme(saved.colors || saved)
    if (saved.typography) {
      typography.value = saved.typography
    }
  }
  items.value.forEach(i => {
    const val = (saved && saved.colors && saved.colors[i.var]) || readCssVar(i.var) || ''
    i.value = val
  })
  ensureTypographyDefaults()
  // apply typography to document
  Object.keys(typography.value).forEach(k => applyTypography(k))
  // detect @font-face rules in stylesheets and populate projectFonts
  try {
    const found = new Set()
    for (const ss of Array.from(document.styleSheets || [])) {
      let rules
      try { rules = ss.cssRules } catch (e) { continue }
      if (!rules) continue
      for (const r of Array.from(rules)) {
        // CSSFontFaceRule type
        if (r.type === CSSRule.FONT_FACE_RULE || (r.constructor && r.constructor.name === 'CSSFontFaceRule')) {
          const fam = (r.style && r.style.getPropertyValue('font-family')) || r.cssText.match(/font-family\s*:\s*([^;\n]+)/i)
          let famName = ''
          if (typeof fam === 'string') famName = fam.replace(/['"]+/g, '').trim()
          else if (Array.isArray(fam)) famName = String(fam[1] || '').replace(/['"]+/g,'').trim()
          if (famName) found.add(famName)
        }
      }
    }
    projectFonts.value = Array.from(found).map(f => ({ family: f, label: f }))
  } catch (e) { console.warn('Could not detect project fonts', e) }
})

function updateVar(name, value) {
  // ensure hex trimmed
  const v = (value || '').trim()
  document.documentElement.style.setProperty(name, v)
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
  } catch (e) {}
}

function save() {
  const colorsObj = {}
  items.value.forEach(i => colorsObj[i.var] = i.value)
  const obj = { colors: colorsObj, typography: typography.value }
  localStorage.setItem(VAR_KEY, JSON.stringify(obj))
  // re-apply to be safe
  applyTheme(colorsObj)
  Object.keys(typography.value).forEach(k => applyTypography(k))
  alert('Motyw zapisany lokalnie')
}

function reset() {
  localStorage.removeItem(VAR_KEY)
  // reload page to reset CSS to defaults from files
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
.theme-editor { padding: 1rem; background: var(--color-section-light); color: var(--color-text-dark); border-radius: 8px; }
.theme-editor h3 { margin-top: 0; }
.fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
.field { display: flex; gap: 0.5rem; align-items: center; }
.field label { min-width: 120px; font-size: 0.9rem; }
.field input[type="color"] { width: 44px; height: 30px; border: none; padding: 0; }
.field .hex { flex: 1; padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid #ccc; }
.actions { margin-top: 1rem; display:flex; gap:0.5rem; }
.actions button { padding: 0.5rem 1rem; border-radius:6px; border:none; cursor:pointer }
.actions button:first-child { background: var(--color-accent); color: #fff }
.actions button:last-child { background: #ddd; color: #111 }

.typography { margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.03); border-radius:8px }
.typography-row { display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center }
.typography-row label { display:flex; flex-direction:column; font-size:0.85rem }
.typography-preview { margin-top:0.75rem }
.preview-box { border-radius:8px; background:var(--color-section-light); border:1px solid rgba(0,0,0,0.06) }
.preview-h1 { font-size:1.15rem; font-weight:700; margin-bottom:0.35rem }
.preview-body { font-size:0.95rem }
</style>
