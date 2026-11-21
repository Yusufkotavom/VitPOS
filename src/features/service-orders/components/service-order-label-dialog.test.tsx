import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceOrderLabelDialog } from './service-order-label-dialog'
import type { LocalServiceOrder } from '@/services/local-db/schema'

vi.mock('jsbarcode', () => ({
  default: vi.fn(),
}))

vi.mock('@/shared/components/pdf/use-pdf-settings', () => ({
  usePdfSettings: () => ({
    companyName: 'Toko Servis Komputer',
    companyPhone: '08123456789',
    pdfLanguage: 'id',
  }),
}))

const sampleOrder: LocalServiceOrder = {
  id: 'order-101',
  tenantId: 'tenant-1',
  code: 'SRV-00101',
  date: '2026-11-21T08:00:00.000Z',
  customerId: 'cust-1',
  customerName: 'Ahmad Dahlan',
  deviceBrand: 'Asus',
  deviceModel: 'TUF Gaming',
  complaint: 'Keyboard tidak berfungsi',
  description: 'Keyboard tidak berfungsi',
  cost: 350000,
  paidTotal: 0,
  status: 'Diterima',
  syncStatus: 'synced',
  version: 1,
  updatedAt: '2026-11-21T08:00:00.000Z',
}

describe('ServiceOrderLabelDialog', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders label dialog with correct order code and store name', () => {
    render(
      <ServiceOrderLabelDialog
        open={true}
        onOpenChange={vi.fn()}
        order={sampleOrder}
        customerPhone="081999888777"
      />,
    )

    expect(screen.getByText('Cetak Stiker Label Unit Servis')).toBeDefined()
    expect(screen.getByText('SRV-00101')).toBeDefined()
    expect(screen.getByText('Ahmad Dahlan')).toBeDefined()
    expect(screen.getByText('081999888777')).toBeDefined()
    expect(screen.getByText('Toko Servis Komputer')).toBeDefined()
  })
})
