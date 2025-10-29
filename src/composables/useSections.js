import { ref } from 'vue'

const KEY = 'site-sections'

const sections = ref({})

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && typeof s === 'object') sections.value = s
    else sections.value = {}
  } catch (e) {
    sections.value = {}
  }
  try { applyCssVars() } catch (e) {}
}

function applyCssVars() {
  try {
    const s = sections.value || {}
    Object.keys(s).forEach(k => {
      const cfg = s[k] || {}
      try { document.documentElement.style.setProperty(`--section-${k}-bg`, cfg.bg || '') } catch(e) {}
      try { document.documentElement.style.setProperty(`--section-${k}-font`, cfg.font || '') } catch(e) {}
      // optional text color
      if (cfg.textColor) try { document.documentElement.style.setProperty(`--section-${k}-text-color`, cfg.textColor) } catch(e) {}
    })
  } catch (e) {}
}

// load initially
load()

// listen for storage events from other windows and custom events
window.addEventListener('storage', (e) => {
  if (!e) return
  if (e.key === KEY) load()
})
window.addEventListener('sections-updated', () => load())

// also apply CSS vars whenever sections change (best-effort)
window.addEventListener('storage', () => applyCssVars())
window.addEventListener('sections-updated', () => applyCssVars())
// initial apply
applyCssVars()

export function useSections() {
  return { sections, reload: load }
}

export default { useSections }
