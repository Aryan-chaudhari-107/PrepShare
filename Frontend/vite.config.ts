import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split the two heavyweight vendors so the app chunk (routes/pages)
        // can be cached independently of library updates.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
