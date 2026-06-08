import { describe, expect, it } from 'vitest'

import { mapProductFormToRecord, productFormSchema, productInitialValues } from '@/features/products/schemas/product-form-schema'

describe('productFormSchema', () => {
  it('rejects blank product name', () => {
    const result = productFormSchema.safeParse({
      ...productInitialValues,
      name: ' ',
    })

    expect(result.success).toBe(false)
  })

  it('maps form values to local product record with numeric price and stock', () => {
    const result = mapProductFormToRecord(
      {
        name: 'Kopi Arabika',
        category: 'Minuman',
        type: 'Produk Fisik',
        price: '18000',
        stock: '24',
        status: 'Aktif',
      },
      'product-1',
    )

    expect(result).toMatchObject({
      id: 'product-1',
      name: 'Kopi Arabika',
      category: 'Minuman',
      type: 'Produk Fisik',
      price: 18000,
      stock: 24,
      status: 'Aktif',
      syncStatus: 'pending',
      version: 1,
    })
    expect(typeof result.updatedAt).toBe('string')
  })

  it('forces stock to zero for service products', () => {
    const result = mapProductFormToRecord(
      {
        name: 'Jasa Servis',
        category: 'Service',
        type: 'Jasa',
        price: '150000',
        stock: '99',
        status: 'Aktif',
      },
      'product-2',
    )

    expect(result.stock).toBe(0)
    expect(result.price).toBe(150000)
  })

  it('increments version from base record on edit', () => {
    const result = mapProductFormToRecord(
      {
        name: 'Kopi Arabika',
        category: 'Minuman',
        type: 'Produk Fisik',
        price: '20000',
        stock: '30',
        status: 'Aktif',
      },
      'product-1',
      {
        id: 'product-1',
        name: 'Kopi Arabika',
        category: 'Minuman',
        type: 'Produk Fisik',
        price: 18000,
        stock: 24,
        status: 'Aktif',
        syncStatus: 'synced',
        version: 3,
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    )

    expect(result.version).toBe(4)
    expect(result.syncStatus).toBe('pending')
  })
})
