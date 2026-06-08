import { describe, it, expect } from 'vitest'
import { formatCurrency } from './format-currency'

describe('formatCurrency', () => {
  it('formats valid numbers correctly', () => {
    expect(formatCurrency(150000)).toBe('Rp 150.000')
    expect(formatCurrency(0)).toBe('Rp 0')
  })

  it('handles invalid inputs safely', () => {
    expect(formatCurrency(undefined)).toBe('Rp 0')
    expect(formatCurrency(null)).toBe('Rp 0')
    expect(formatCurrency(NaN)).toBe('Rp 0')
    expect(formatCurrency('150000')).toBe('Rp 150.000')
    expect(formatCurrency('invalid')).toBe('Rp 0')
  })
})
