import { describe, expect, it } from 'vitest'

import { formatCurrency } from './format-currency'

describe('formatCurrency', () => {
  it('formats number as Indonesian rupiah without decimals', () => {
    expect(formatCurrency(12500)).toBe('Rp 12.500')
  })

  it('rounds decimal value to nearest rupiah', () => {
    expect(formatCurrency(12500.75)).toBe('Rp 12.501')
  })
})
