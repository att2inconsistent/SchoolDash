import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Port 5174 supaya bisa jalan berdampingan dengan frontend-user (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
})
