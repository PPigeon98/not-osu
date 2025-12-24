import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
        usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    commonjsOptions: {
      include: [/shader-park-core/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'shader-park': ['shader-park-core'],
          'three': ['three'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['shader-park-core', 'three'],
  },
})
