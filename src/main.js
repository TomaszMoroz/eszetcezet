
import { createApp } from 'vue';
import './main.css';
import './style.css';
import App from './App.vue';
import router from './router';

function applySavedTheme(savedTheme) {
	if (!savedTheme || typeof savedTheme !== 'object') return

	if (savedTheme.colors && typeof savedTheme.colors === 'object') {
		Object.entries(savedTheme.colors).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, value)
		})
	}

	if (savedTheme.typography && typeof savedTheme.typography === 'object') {
		Object.entries(savedTheme.typography).forEach(([sectionKey, config]) => {
			if (!config || typeof config !== 'object') return
			if (config.font) document.documentElement.style.setProperty(`--font-${sectionKey}`, config.font)
			if (config.size != null) document.documentElement.style.setProperty(`--font-${sectionKey}-size`, `${config.size}px`)
			if (config.weight != null) document.documentElement.style.setProperty(`--font-${sectionKey}-weight`, String(config.weight))
			if (config.color) document.documentElement.style.setProperty(`--color-${sectionKey}-text`, config.color)
		})
	}
}

// Apply saved theme variables from localStorage (if present)
try {
	const saved = JSON.parse(localStorage.getItem('site-theme') || 'null')
	applySavedTheme(saved)
} catch (e) {
	// ignore malformed storage
}

createApp(App)
	.use(router)
	.mount('#app');
