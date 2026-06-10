import type { WholesaleTier } from '@/services/local-db/schema'

export function getWholesalePrice(regularPrice: number, tiers: WholesaleTier[] | undefined, qty: number): number {
  if (!tiers || tiers.length === 0) {
    return regularPrice
  }

  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty)

  for (const tier of sorted) {
    if (qty >= tier.minQty) {
      return tier.price
    }
  }

  return regularPrice
}
