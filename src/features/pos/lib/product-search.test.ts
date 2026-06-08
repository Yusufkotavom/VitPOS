import { describe, it, expect } from 'vitest';
import { matchesProductSearch } from './product-search';

describe('matchesProductSearch', () => {
  const product = {
    id: 'p1',
    name: 'Indomie Goreng',
    sku: 'IND-001',
    barcode: '8991234567890'
  };

  it('matches exact barcode', () => {
    expect(matchesProductSearch(product, '8991234567890')).toBe(true);
  });

  it('fails partial barcode match', () => {
    // Barcode matching must be exact to prevent scanning errors
    expect(matchesProductSearch(product, '899123')).toBe(false);
  });

  it('matches partial name case-insensitive', () => {
    expect(matchesProductSearch(product, 'indo')).toBe(true);
    expect(matchesProductSearch(product, 'GORENG')).toBe(true);
  });

  it('matches partial sku case-insensitive', () => {
    expect(matchesProductSearch(product, 'ind-')).toBe(true);
    expect(matchesProductSearch(product, '001')).toBe(true);
  });

  it('fails when no match', () => {
    expect(matchesProductSearch(product, 'sedaap')).toBe(false);
  });

  it('matches everything when query is empty', () => {
    expect(matchesProductSearch(product, '')).toBe(true);
    expect(matchesProductSearch(product, '   ')).toBe(true);
  });

  it('handles missing product fields', () => {
    const minProduct = { id: 'p2', name: 'Kopi', category: '', type: 'Produk Fisik' as const, price: 0, stock: 0, status: 'Aktif' as const, syncStatus: 'pending' as const, version: 1, updatedAt: '' };
    expect(matchesProductSearch(minProduct, 'kopi')).toBe(true);
    expect(matchesProductSearch(minProduct, '123')).toBe(false);
  });
});
