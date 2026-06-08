import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kotacom/shared-contracts': path.resolve(__dirname, './packages/shared-contracts/src/index.ts'),
      '@kotacom/shared-contracts/sync': path.resolve(__dirname, './packages/shared-contracts/src/sync/index.ts'),
    },
  },
})
