// Theme color/font presets for quick selection in ThemeEditor
export const colorPresets = [
  {
    name: 'Domyślny',
    colors: {
      '--color-bg': '#181818',
      '--color-text': '#fff',
      '--color-header-bg': '#232323',
      '--color-accent': '#ff5a36',
      '--color-section-dark': '#232323',
      '--color-section-light': '#fff',
      '--color-text-dark': '#181818',
    }
  },
  {
    name: 'Jasny',
    colors: {
      '--color-bg': '#f7f7f7',
      '--color-text': '#232323',
      '--color-header-bg': '#fff',
      '--color-accent': '#007aff',
      '--color-section-dark': '#eaeaea',
      '--color-section-light': '#fff',
      '--color-text-dark': '#232323',
    }
  },
  {
    name: 'Ciemny niebieski',
    colors: {
      '--color-bg': '#0a192f',
      '--color-text': '#e6f1ff',
      '--color-header-bg': '#112240',
      '--color-accent': '#64ffda',
      '--color-section-dark': '#112240',
      '--color-section-light': '#233554',
      '--color-text-dark': '#0a192f',
    }
  }
]

export const fontPresets = [
  { name: 'System', font: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" },
  { name: 'Inter', font: 'Inter, system-ui, sans-serif' },
  { name: 'Merriweather', font: 'Merriweather, serif' },
  { name: 'Playfair Display', font: 'Playfair Display, serif' },
  { name: 'Roboto', font: 'Roboto, Arial, sans-serif' }
]
