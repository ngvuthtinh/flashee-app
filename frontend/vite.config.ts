import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward /api/* to the backend so the browser only ever talks to one origin (no CORS, cookies just work)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
