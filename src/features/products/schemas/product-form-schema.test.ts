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

  it('maps form values to local product record', () => {
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

    expect(result).toEqual({
      id: 'product-1',
      name: 'Kopi Arabika',
      category: 'Minuman',
      type: 'Produk Fisik',
      price: 'Rp 18.000',
      stock: '24 pcs',
      status: 'Aktif',
    })
  })
})
