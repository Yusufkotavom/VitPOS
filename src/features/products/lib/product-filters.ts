import type { LocalProduct } from '@/services/local-db/schema'
import { matchesProductSearch } from '@/features/pos/lib/product-search'

export function filterProducts(products: LocalProduct[], query: string): LocalProduct[] {
  if (!query) return products
  return products.filter(product => matchesProductSearch(product, query))
}
