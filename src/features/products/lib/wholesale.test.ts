import { describe, it, expect } from 'vitest'

import { getWholesalePrice } from './wholesale'
import type { WholesaleTier } from '@/services/local-db/schema'

describe('getWholesalePrice', () => {
  const tiers: WholesaleTier[] = [
    { minQty: 10, price: 9000 },
    { minQty: 50, price: 8000 },
  ]

  it('returns regular price when no tiers defined', () => {
    expect(getWholesalePrice(10000, undefined, 99)).toBe(10000)
  })

  it('returns regular price when qty below any tier', () => {
    expect(getWholesalePrice(10000, tiers, 1)).toBe(10000)
    expect(getWholesalePrice(10000, tiers, 9)).toBe(10000)
  })

  it('returns tier price when qty matches a tier', () => {
    expect(getWholesalePrice(10000, tiers, 10)).toBe(9000)
    expect(getWholesalePrice(10000, tiers, 25)).toBe(9000)
  })

  it('returns highest applicable tier price', () => {
    expect(getWholesalePrice(10000, tiers, 50)).toBe(8000)
    expect(getWholesalePrice(10000, tiers, 100)).toBe(8000)
  })

  it('handles unsorted tiers', () => {
    const unsorted: WholesaleTier[] = [
      { minQty: 50, price: 8000 },
      { minQty: 10, price: 9000 },
      { minQty: 100, price: 7000 },
    ]
    expect(getWholesalePrice(10000, unsorted, 75)).toBe(8000)
    expect(getWholesalePrice(10000, unsorted, 150)).toBe(7000)
  })

  it('handles empty tiers array', () => {
    expect(getWholesalePrice(10000, [], 99)).toBe(10000)
  })
})
