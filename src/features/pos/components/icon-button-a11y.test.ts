import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../../..')

function read(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8')
}

describe('icon-only action button accessibility', () => {
  it('names POS cart icon-only actions', () => {
    const source = read('src/features/pos/components/cart-panel.tsx')

    expect(source).toContain('aria-label={`Hapus ${item.name} dari keranjang`}')
    expect(source).toContain('aria-label={`Kurangi jumlah ${item.name}`}')
    expect(source).toContain('aria-label={`Tambah jumlah ${item.name}`}')
  })

  it('names line item remove buttons', () => {
    const files = [
      'src/features/sales-orders/components/sales-order-form.tsx',
      'src/features/purchases/components/purchase-form.tsx',
      'src/features/returns/components/return-form.tsx',
    ]

    for (const file of files) {
      const source = read(file)
      expect(source).toContain('aria-label={`Hapus item ${index + 1}`}')
    }
  })
})
