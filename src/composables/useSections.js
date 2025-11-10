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
  try { applyCssVars(); applyInlineSectionStyles() } catch (e) {}
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

// apply inline styles to known selectors so background changes are visible even when
// elements have overlay children or stronger rules.
function applyInlineSectionStyles() {
  try {
    const map = {
      navbar: '.site-header',
      hero: '.hero',
      gallery: '.works-section, .gallery-container',
      info: '.text-section',
      footer: '.site-footer'
    }
    const s = sections.value || {}
    Object.keys(map).forEach(k => {
      const sel = map[k]
      const cfg = s[k] || {}
      const nodes = document.querySelectorAll(sel)
      nodes.forEach(n => {
        try {
          if (cfg.bg) n.style.background = cfg.bg
          else n.style.removeProperty('background')
          if (cfg.font) n.style.fontFamily = cfg.font
          else n.style.removeProperty('font-family')
          if (cfg.textColor) n.style.color = cfg.textColor
        } catch (e) {}
      })
    })
    // also apply to media layers if requested
    try {
      const mediaMap = { hero: '.hero-media' }
      Object.keys(mediaMap).forEach(k => {
        const sel = mediaMap[k]
        const cfg = s[k] || {}
        if (cfg && cfg.applyToMedia) {
          document.querySelectorAll(sel).forEach(m => {
            try {
              if (cfg.bg) m.style.background = cfg.bg
              else m.style.removeProperty('background')
              if (cfg.font) m.style.fontFamily = cfg.font
              else m.style.removeProperty('font-family')
            } catch (e) {}
          })
        }
      })
    } catch (e) {}
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
// also apply inline styles on init
applyInlineSectionStyles()

export function useSections() {
  return { sections, reload: load }
}

export default { useSections }
