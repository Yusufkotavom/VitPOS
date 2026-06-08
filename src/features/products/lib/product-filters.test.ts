import { describe, it, expect } from 'vitest'
import { filterProducts } from './product-filters'
import type { LocalProduct } from '@/services/local-db/schema'

describe('filterProducts', () => {
  const products: LocalProduct[] = [
    { id: '1', name: 'Baju M', category: 'Pakaian', type: 'Produk Fisik', price: 100, stock: 10, status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: '' },
    { id: '2', name: 'Celana', category: 'Pakaian', type: 'Produk Fisik', price: 200, stock: 5, status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: '' }
  ]

  it('returns all when query is empty', () => {
    expect(filterProducts(products, '')).toHaveLength(2)
  })

  it('filters by name match', () => {
    expect(filterProducts(products, 'baju')).toHaveLength(1)
    expect(filterProducts(products, 'baju')[0].name).toBe('Baju M')
  })
})
