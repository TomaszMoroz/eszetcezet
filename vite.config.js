import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Dev server proxy: forwards /api requests to local backend at :3000
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
