export interface SearchableProduct {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
}

/**
 * Checks if a product matches a search query for POS filtering.
 * Exact barcode match takes precedence. Name and SKU match partially.
 */
export function matchesProductSearch(product: SearchableProduct, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  
  if (!normalizedQuery) {
    return true;
  }

  // Exact barcode match (must be exact to prevent scanning errors)
  if (product.barcode && product.barcode.toLowerCase() === normalizedQuery) {
    return true;
  }

  // Partial name match
  if (product.name && product.name.toLowerCase().includes(normalizedQuery)) {
    return true;
  }

  // Partial SKU match
  if (product.sku && product.sku.toLowerCase().includes(normalizedQuery)) {
    return true;
  }

  return false;
}
