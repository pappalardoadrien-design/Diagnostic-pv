import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist-audit',
    lib: {
      entry: 'src/index-with-audit.tsx',
      formats: ['es'],
      fileName: '_worker'
    },
    rollupOptions: {
      external: ['__STATIC_CONTENT_MANIFEST']
    }
  }
})
