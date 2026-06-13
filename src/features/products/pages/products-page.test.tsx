import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductsPage } from '@/features/products/pages/products-page'
import type { LocalProduct } from '@/services/local-db/schema'

const mockUseProducts = vi.fn<() => LocalProduct[]>()
let isDesktop = true

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'products.title': 'Produk',
        'products.description': 'Kelola produk',
        'products.empty': 'Belum ada produk',
        'products.add_description': 'Tambahkan produk baru',
        'products.export_success': 'Ekspor berhasil',
        'products.status_draft': 'Draft',
        'products.cost_price': 'HPP',
        'products.selling_price': 'Harga Jual',
        'common.search': 'Cari',
        'common.filter': 'Filter',
        'common.type': 'Tipe',
        'common.status': 'Status',
        'common.all': 'Semua',
        'common.goods': 'Barang',
        'common.service': 'Jasa',
        'common.active': 'Aktif',
        'common.archive': 'Arsip',
        'common.reset': 'Reset',
        'common.close': 'Tutup',
        'common.export': 'Ekspor',
        'common.import': 'Impor',
        'common.name': 'Nama',
        'common.category': 'Kategori',
        'common.cost_price': 'HPP',
        'common.sell_price': 'Harga Jual',
        'common.actions': 'Aksi',
        'common.list_view': 'List View',
        'common.card_view': 'Card View',
        'inventory.stock_per_warehouse': 'Sisa Stok',
      }

      return dict[key] ?? key
    },
  }),
}))

vi.mock('@/features/products/hooks/use-products', () => ({
  useProducts: () => mockUseProducts(),
}))

vi.mock('@/features/products/components/product-crud-actions', () => ({
  ProductCrudActions: ({ product }: { product?: LocalProduct }) => (
    <button type="button">{product ? `Aksi ${product.name}` : 'Tambah Produk'}</button>
  ),
}))

vi.mock('@/features/products/components/product-import-dialog', () => ({
  ProductImportDialog: () => null,
}))

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 768px)' ? isDesktop : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const productRows: LocalProduct[] = [
  {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Arabica 250gr',
    category: 'Kopi',
    type: 'Produk Fisik',
    price: 75000,
    costPrice: 50000,
    stock: 12,
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: '2026-06-12T00:00:00.000Z',
  },
]

describe('ProductsPage', () => {
  beforeEach(() => {
    isDesktop = true
    mockUseProducts.mockReset()
    mockUseProducts.mockReturnValue(productRows)
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps list and card toggle available on mobile', () => {
    isDesktop = false

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'List View' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Card View' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Nama' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'List View' }))

    expect(screen.getByRole('columnheader', { name: 'Nama' })).toBeInTheDocument()
  })
})
