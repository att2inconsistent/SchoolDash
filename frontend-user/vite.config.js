import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Semua request /api (termasuk /api/uploads untuk gambar hasil upload)
      // diteruskan ke backend, jadi frontend tidak perlu tahu host backend
      // dan tidak perlu CORS saat development.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
