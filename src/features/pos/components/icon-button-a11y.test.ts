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

    expect(source).toContain("aria-label={t('pos.remove_from_cart', { name: item.name })}")
    expect(source).toContain("aria-label={t('pos.decrease_qty', { name: item.name })}")
    expect(source).toContain("aria-label={t('pos.increase_qty', { name: item.name })}")
  })

  it('names line item remove buttons', () => {
    const filePatterns: Record<string, string> = {
      'src/features/sales-orders/components/sales-order-form.tsx': "t('sales_orders.remove_item', { index: index + 1 })",
      'src/features/purchases/components/purchase-form.tsx': "t('purchases.remove_item', { index: index + 1 })",
      'src/features/returns/components/return-form.tsx': 'aria-label={`Hapus item ${index + 1}`}',
    }

    for (const [file, pattern] of Object.entries(filePatterns)) {
      const source = read(file)
      expect(source).toContain(pattern)
    }
  })
})
