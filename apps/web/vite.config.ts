import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  // Use relative paths so assets load correctly inside Capacitor (iOS/macOS)
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    // Do not auto-open a browser window during development
    open: false,
  },
  build: {
    // Optimize for modern Safari on iOS/macOS while keeping ES2020 features
    target: ['safari15', 'es2020'],
    sourcemap: false,
    cssCodeSplit: true,
    minify: 'esbuild',
    brotliSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      treeshake: 'recommended',
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@reduxjs')) {
              return 'vendor-redux'
            }
            if (id.includes('stripe')) {
              return 'vendor-stripe'
            }
            return 'vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}))


