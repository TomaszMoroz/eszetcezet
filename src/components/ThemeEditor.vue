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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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
    applyTheme(saved)
  }
  items.value.forEach(i => {
    const val = (saved && saved[i.var]) || readCssVar(i.var) || ''
    i.value = val
  })
})

function updateVar(name, value) {
  // ensure hex trimmed
  const v = (value || '').trim()
  document.documentElement.style.setProperty(name, v)
}

function save() {
  const obj = {}
  items.value.forEach(i => obj[i.var] = i.value)
  localStorage.setItem(VAR_KEY, JSON.stringify(obj))
  // re-apply to be safe
  applyTheme(obj)
  alert('Motyw zapisany lokalnie')
}

function reset() {
  localStorage.removeItem(VAR_KEY)
  // reload page to reset CSS to defaults from files
  location.reload()
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
</style>
