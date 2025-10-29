
import { createApp } from 'vue';
import './main.css';
import './style.css';
import App from './App.vue';
import router from './router';
// Apply saved theme variables from localStorage (if present)
try {
	const saved = JSON.parse(localStorage.getItem('site-theme') || 'null')
	if (saved && typeof saved === 'object') {
		Object.entries(saved).forEach(([k, v]) => {
			document.documentElement.style.setProperty(k, v)
		})
	}
} catch (e) {
	// ignore malformed storage
}

createApp(App)
	.use(router)
	.mount('#app');
