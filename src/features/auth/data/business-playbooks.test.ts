import { describe, expect, it } from 'vitest'

import {
  BUSINESS_PLAYBOOKS,
  DEFAULT_BUSINESS_MODE,
  DEFAULT_VERTICAL,
} from '@/features/auth/data/business-playbooks'

describe('business playbooks', () => {
  it('defines atk & printing vertical with all three modes', () => {
    expect(DEFAULT_VERTICAL).toBe('atk_printing')
    expect(DEFAULT_BUSINESS_MODE).toBe('atk_printing_combo')

    const playbook = BUSINESS_PLAYBOOKS.atk_printing
    expect(playbook.label).toBe('ATK & Printing')
    expect(playbook.modes.map((mode) => mode.id)).toEqual([
      'atk_only',
      'printing_only',
      'atk_printing_combo',
    ])
  })

  it('provides realistic default categories, products, and payment methods', () => {
    const combo = BUSINESS_PLAYBOOKS.atk_printing.modes.find(
      (mode) => mode.id === 'atk_printing_combo',
    )

    expect(combo?.categories).toContain('Kertas')
    expect(combo?.categories).toContain('Jasa Dokumen')
    expect(combo?.products.some((item) => item.name === 'Kertas A4 70gsm')).toBe(true)
    expect(combo?.products.some((item) => item.name === 'Print warna per lembar')).toBe(true)
    expect(combo?.paymentMethods.map((item) => item.name)).toEqual([
      'Tunai',
      'QRIS',
      'Transfer',
      'Piutang',
    ])
  })

  it('defines general business vertical with minimal running starter data', () => {
    const general = BUSINESS_PLAYBOOKS.general
    expect(general).toBeDefined()
    expect(general.label).toBe('Usaha Umum')
    expect(general.modes.map((mode) => mode.id)).toEqual(['general_standard'])

    const standard = general.modes[0]
    expect(standard.label).toBe('Standar Toko')
    expect(standard.categories).toEqual(['Umum'])
    expect(standard.products).toHaveLength(1)
    expect(standard.products[0]).toEqual({
      name: 'Produk Contoh',
      category: 'Umum',
      price: 10000,
      cost: 7000,
      type: 'Produk Fisik',
      unit: 'pcs',
      stock: 10,
      minStock: 2,
      tags: ['umum', 'stok'],
    })
    expect(standard.paymentMethods.map((item) => item.name)).toEqual([
      'Tunai',
      'QRIS',
      'Transfer',
      'Piutang',
    ])
    expect(standard.cashCategories.map((item) => item.name)).toEqual([
      'Penjualan',
      'Pembelian Stok',
      'Operasional',
    ])
  })
})
