import { describe, expect, it } from 'vitest'

import { mapProductFormToRecord, mapProductRecordToFormValues, productFormSchema, productInitialValues } from '@/features/products/schemas/product-form-schema'

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
        ...productInitialValues,
        name: 'Kopi Arabika',
        category: 'Minuman',
        type: 'Produk Fisik',
        price: '18000',
        stock: '24',
        manageStock: true,
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
        ...productInitialValues,
        name: 'Jasa Servis',
        category: 'Service',
        type: 'Jasa',
        price: '150000',
        stock: '99',
        manageStock: true,
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
        ...productInitialValues,
        name: 'Kopi Arabika',
        category: 'Minuman',
        type: 'Produk Fisik',
        price: '20000',
        stock: '30',
        manageStock: true,
        status: 'Aktif',
      },
      'product-1',
      {
        id: 'product-1',
        tenantId: 'tenant-1',
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

  it('maps wholesale tiers when enabled', () => {
    const result = mapProductFormToRecord(
      {
        ...productInitialValues,
        name: 'Pulpen',
        category: 'ATK',
        type: 'Produk Fisik',
        price: '15000',
        costPrice: '10000',
        hasWholesalePricing: true,
        wholesaleTiers: [
          { minQty: '10', price: '14000' },
          { minQty: '50', price: '13000' },
        ],
        status: 'Aktif',
      },
      'product-1',
    )

    expect(result.wholesaleTiers).toEqual([
      { minQty: 10, price: 14000 },
      { minQty: 50, price: 13000 },
    ])
    expect(result.wholesalePrice).toBeUndefined()
  })

  it('requires at least one tier when wholesale pricing is enabled', () => {
    const result = productFormSchema.safeParse({
      ...productInitialValues,
      name: 'Pulpen',
      category: 'ATK',
      price: '15000',
      hasWholesalePricing: true,
      wholesaleTiers: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-ascending wholesale qty tiers', () => {
    const result = productFormSchema.safeParse({
      ...productInitialValues,
      name: 'Pulpen',
      category: 'ATK',
      price: '15000',
      hasWholesalePricing: true,
      wholesaleTiers: [
        { minQty: '10', price: '14000' },
        { minQty: '5', price: '13000' },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('does not auto-convert legacy wholesalePrice to tiers', () => {
    const values = mapProductRecordToFormValues({
      id: 'product-1',
      tenantId: 'tenant-1',
      name: 'Pulpen',
      category: 'ATK',
      type: 'Produk Fisik',
      price: 15000,
      costPrice: 10000,
      wholesalePrice: 14000,
      stock: 5,
      manageStock: true,
      status: 'Aktif',
      syncStatus: 'pending',
      version: 1,
      updatedAt: '2026-06-09T00:00:00.000Z',
    })

    expect(values.hasWholesalePricing).toBe(false)
    expect(values.wholesaleTiers).toEqual([])
  })
})
