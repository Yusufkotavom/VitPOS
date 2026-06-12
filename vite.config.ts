import path from 'node:path'
import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version?: string }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || packageJson.version || '0.0.0'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kotacom/shared-contracts': path.resolve(__dirname, './packages/shared-contracts/src/index.ts'),
      '@kotacom/shared-contracts/sync': path.resolve(__dirname, './packages/shared-contracts/src/sync/index.ts'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('@react-pdf/pdfkit') || id.includes('pdfkit')) return 'vendor-pdfkit'
          if (id.includes('@react-pdf/textkit')) return 'vendor-pdf-text'
          if (id.includes('@react-pdf/font') || id.includes('fontkit')) return 'vendor-pdf-fonts'
          if (id.includes('@react-pdf/layout') || id.includes('yoga-layout')) return 'vendor-pdf-layout'
          if (id.includes('@react-pdf')) return 'vendor-react-pdf'
          if (id.includes('unicode') || id.includes('linebreak') || id.includes('hyphen') || id.includes('dfa') || id.includes('brotli') || id.includes('pako')) return 'vendor-pdf-utils'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-export'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('@tanstack/react-query')) return 'vendor-query'
          if (id.includes('react-router-dom')) return 'vendor-router'
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) return 'vendor-forms'
          if (id.includes('@radix-ui') || id.includes('radix-ui') || id.includes('embla-carousel-react') || id.includes('vaul')) return 'vendor-ui'
          if (id.includes('dexie')) return 'vendor-db'
          if (id.includes('@capacitor') || id.includes('@tauri-apps')) return 'vendor-native'
          if (id.includes('date-fns')) return 'vendor-date'
          if (id.includes('sonner') || id.includes('class-variance-authority') || id.includes('tailwind-merge') || id.includes('clsx')) return 'vendor-ui-utils'
          if (id.includes('react-dom')) return 'vendor-react-dom'
          if (id.includes('/react/') || id.includes('/react@') || id.includes('scheduler')) return 'vendor-react'

          return 'vendor-misc'
        },
      },
    },
  },
})
