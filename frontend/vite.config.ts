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
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'shader-park': ['shader-park-core'],
          'three': ['three'],
        },
      },
      external: [],
      // Preserve shader-park-core's internal structure
      treeshake: {
        moduleSideEffects: (id) => {
          // Don't tree-shake shader-park-core to preserve internal functions
          return id.includes('shader-park-core');
        },
      },
    },
  },
  optimizeDeps: {
    include: ['shader-park-core', 'three'],
  },
})
