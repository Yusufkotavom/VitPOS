import { describe, expect, it } from 'vitest'

import { buildQuickCashOptions, getPaymentMethodDisplay } from '@/features/pos/lib/payment-method-display'
import { usePosStore } from '@/features/pos/stores/pos-store'
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

describe('POS payment UX helpers', () => {
  it('offers exact cash first, then rounded-up amounts', () => {
    const options = buildQuickCashOptions(37000)

    expect(options[0]).toBe(37000)
    expect(options.every((amount) => amount >= 37000)).toBe(true)
    expect(new Set(options).size).toBe(options.length)
    expect(options.length).toBeLessThanOrEqual(4)
  })

  it('returns no quick cash options for an empty total', () => {
    expect(buildQuickCashOptions(0)).toEqual([])
  })

  it('maps payment methods to distinct icons', () => {
    const cash = getPaymentMethodDisplay('tunai', 'Tunai')
    const qris = getPaymentMethodDisplay('qris', 'QRIS')
    const piutang = getPaymentMethodDisplay('piutang', 'Piutang')

    expect(cash.icon).not.toBe(qris.icon)
    expect(piutang.icon).not.toBe(cash.icon)
  })

  it('resolves the display from the method name when the id is unknown', () => {
    const display = getPaymentMethodDisplay('pm-123', 'Transfer Bank BCA')
    expect(display.tone).toBe('text-blue-600')
  })
})

describe('POS split payment state', () => {
  it('allows a transaction to cover the total across several methods', () => {
    const { addItem, setSplitPayment, addPaymentSplit, updatePaymentSplit } = usePosStore.getState()

    addItem(product)
    addItem(product)
    setSplitPayment(true)
    addPaymentSplit('tunai')
    addPaymentSplit('qris')
    updatePaymentSplit(0, { amount: 20000 })
    updatePaymentSplit(1, { amount: 16000 })

    const state = usePosStore.getState()
    const allocated = state.paymentSplits.reduce((sum, split) => sum + split.amount, 0)

    expect(state.isSplitPayment).toBe(true)
    expect(allocated).toBe(36000)

    usePosStore.getState().clearCart()
  })

  it('resets split state together with the cart', () => {
    const { setSplitPayment, addPaymentSplit } = usePosStore.getState()

    setSplitPayment(true)
    addPaymentSplit('tunai')
    usePosStore.getState().clearCart()

    expect(usePosStore.getState().isSplitPayment).toBe(false)
    expect(usePosStore.getState().paymentSplits).toEqual([])
  })
})
