import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: 'localhost',
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://backendreviewtool.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://backendreviewtool.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
