import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kotacom/shared-contracts': path.resolve(__dirname, './packages/shared-contracts/src/index.ts'),
      '@kotacom/shared-contracts/sync': path.resolve(__dirname, './packages/shared-contracts/src/sync/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
