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
})
