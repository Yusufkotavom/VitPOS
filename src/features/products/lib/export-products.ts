import { exportToCsv } from '@/shared/utils/export-csv'
import type { LocalProduct } from '@/services/local-db/schema'

export function exportProducts(products: LocalProduct[], selectedIds?: string[]) {
  const dataToExport = selectedIds && selectedIds.length > 0
    ? products.filter(p => selectedIds.includes(p.id))
    : products

  exportToCsv('products.csv', [
    { header: 'ID', key: 'id' },
    { header: 'Nama Produk', key: 'name' },
    { header: 'Kategori', key: 'category' },
    { header: 'Jenis', key: 'type' },
    { header: 'HPP', key: 'costPrice' },
    { header: 'Harga Jual', key: 'price' },
    { header: 'Harga Grosir', key: 'wholesalePrice' },
    { header: 'Stok', key: 'stock' },
    { header: 'Kelola Stok', key: 'manageStock' },
    { header: 'SKU', key: 'sku' },
    { header: 'Barcode', key: 'barcode' },
    { header: 'Status', key: 'status' },
  ], dataToExport)
}
