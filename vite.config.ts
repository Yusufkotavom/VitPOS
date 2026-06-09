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
})
