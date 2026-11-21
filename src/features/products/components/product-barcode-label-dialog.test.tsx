import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductBarcodeLabelDialog } from './product-barcode-label-dialog'
import type { LocalProduct } from '@/services/local-db/schema'

vi.mock('jsbarcode', () => ({
  default: vi.fn(),
}))

vi.mock('@/shared/components/pdf/use-pdf-settings', () => ({
  usePdfSettings: () => ({
    companyName: 'Kotacom Store',
    companyPhone: '08123456789',
    pdfLanguage: 'id',
  }),
}))

const sampleProduct: LocalProduct = {
  id: 'prod-001',
  tenantId: 'tenant-1',
  name: 'Tinta Epson 003 Hitam',
  sku: 'INK-EPS-003-BK',
  barcode: '8991234567890',
  category: 'Tinta & Toner',
  type: 'Produk Fisik',
  price: 95000,
  costPrice: 75000,
  stock: 15,
  manageStock: true,
  status: 'Aktif',
  syncStatus: 'synced',
  version: 1,
  updatedAt: '2026-11-21T08:00:00.000Z',
}

describe('ProductBarcodeLabelDialog', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders barcode label dialog with product name, barcode, and price', () => {
    render(
      <ProductBarcodeLabelDialog
        open={true}
        onOpenChange={vi.fn()}
        product={sampleProduct}
      />,
    )

    expect(screen.getByText('Cetak Stiker Barcode Produk')).toBeDefined()
    expect(screen.getByText('Tinta Epson 003 Hitam')).toBeDefined()
    expect(screen.getByText('8991234567890')).toBeDefined()
    expect(screen.getByText('SKU: INK-EPS-003-BK')).toBeDefined()
    expect(screen.getByText('Kotacom Store')).toBeDefined()
  })
})
