import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceWarrantyLookupDialog } from './service-warranty-lookup-dialog'
import type { LocalServiceOrder } from '@/services/local-db/schema'

const mockOrders: LocalServiceOrder[] = [
  {
    id: 'ord-1',
    tenantId: 'tenant-1',
    code: 'SRV-0001',
    date: '2026-11-20T08:00:00.000Z',
    customerName: 'Siti Rahma',
    deviceBrand: 'Epson',
    deviceModel: 'L3110',
    complaint: 'Hasil cetak garis-garis',
    description: 'Hasil cetak garis-garis',
    cost: 150000,
    paidTotal: 150000,
    status: 'Selesai',
    hasWarranty: true,
    warrantyValue: 30,
    warrantyUnit: 'hari',
    warrantyStartDate: '2026-11-20T08:00:00.000Z',
    warrantyEndDate: '2026-12-20T08:00:00.000Z',
    syncStatus: 'synced',
    version: 1,
    updatedAt: '2026-11-20T08:00:00.000Z',
  },
  {
    id: 'ord-2',
    tenantId: 'tenant-1',
    code: 'SRV-0002',
    date: '2026-10-01T08:00:00.000Z',
    customerName: 'Budi Santoso',
    deviceBrand: 'Lenovo',
    deviceModel: 'Ideapad',
    complaint: 'Engsel patah',
    description: 'Engsel patah',
    cost: 200000,
    paidTotal: 200000,
    status: 'Selesai',
    hasWarranty: true,
    warrantyValue: 7,
    warrantyUnit: 'hari',
    warrantyStartDate: '2026-10-01T08:00:00.000Z',
    warrantyEndDate: '2026-10-08T08:00:00.000Z',
    syncStatus: 'synced',
    version: 1,
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
]

vi.mock('@/features/service-orders/hooks/use-service-orders', () => ({
  useServiceOrders: () => mockOrders,
}))

describe('ServiceWarrantyLookupDialog', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders search input and finds warranty order by code', () => {
    render(
      <MemoryRouter>
        <ServiceWarrantyLookupDialog open={true} onOpenChange={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Cek Garansi Servis Cepat')).toBeDefined()

    const searchInput = screen.getByPlaceholderText(
      /Scan barcode nota \/ ketik SRV-0001/i,
    )
    fireEvent.change(searchInput, { target: { value: 'SRV-0001' } })

    expect(screen.getByText('SRV-0001')).toBeDefined()
    expect(screen.getByText('Siti Rahma')).toBeDefined()
    expect(screen.getByText(/Garansi Aktif/i)).toBeDefined()
  })

  it('detects expired warranty for older orders', () => {
    render(
      <MemoryRouter>
        <ServiceWarrantyLookupDialog open={true} onOpenChange={vi.fn()} />
      </MemoryRouter>,
    )

    const searchInput = screen.getByPlaceholderText(
      /Scan barcode nota \/ ketik SRV-0001/i,
    )
    fireEvent.change(searchInput, { target: { value: 'SRV-0002' } })

    expect(screen.getByText('SRV-0002')).toBeDefined()
    expect(screen.getByText('Budi Santoso')).toBeDefined()
    expect(screen.getByText(/Garansi Habis/i)).toBeDefined()
  })
})
