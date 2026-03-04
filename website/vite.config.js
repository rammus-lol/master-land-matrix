import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [
      'landmatrix.artxypro.org'
    ]
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        maps: resolve(__dirname, 'maps.html'),
        documentation: resolve(__dirname, 'documentation.html')
      }
    },
    commonjsOptions: {
      ignoreDynamicRequires: true
    }
  },
  optimizeDeps: {
    include: ['sql.js'],
    exclude: []
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true
  },
  appType: 'mpa'
})