import { afterEach, describe, expect, it } from 'vitest'

import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import type { PosProduct } from '@/features/pos/types/pos.types'

const product: PosProduct = {
  id: 'produk-1',
  sku: 'SKU-001',
  name: 'Kopi Susu',
  category: 'Minuman',
  price: 18000,
  stock: 20,
  unit: 'gelas',
  isFavorite: false,
}

afterEach(() => {
  usePosStore.setState({
    searchQuery: '',
    selectedCategory: 'Semua',
    cartItems: [],
    paymentMethod: 'tunai',
    discount: 0,
    paidAmount: 0,
  })
})

describe('usePosStore', () => {
  it('merges duplicate addItem into single cart row with updated qty', () => {
    const { addItem } = usePosStore.getState()

    addItem(product)
    addItem(product)

    expect(usePosStore.getState().cartItems).toEqual([
      {
        productId: 'produk-1',
        name: 'Kopi Susu',
        price: 18000,
        qty: 2,
        subtotal: 36000,
      },
    ])
  })

  it('removes item when qty decreased to zero', () => {
    const { addItem, decreaseQty } = usePosStore.getState()

    addItem(product)
    decreaseQty(product.id)

    expect(usePosStore.getState().cartItems).toEqual([])
  })

  it('calculates totals with discount floor and change', () => {
    const { addItem, setDiscount, setPaidAmount } = usePosStore.getState()

    addItem(product)
    addItem(product)
    setDiscount(5000)
    setPaidAmount(40000)

    expect(selectPosTotals(usePosStore.getState())).toEqual({
      subtotal: 36000,
      total: 31000,
      change: 9000,
      itemCount: 2,
    })
  })
})
