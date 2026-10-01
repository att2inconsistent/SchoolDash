import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Port 5174 supaya bisa jalan berdampingan dengan frontend-user (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Sama seperti frontend-user: /api (termasuk /api/uploads) diproksi ke
    // backend, sehingga gambar menu & hasil upload tetap bisa dimuat.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
  },
})
