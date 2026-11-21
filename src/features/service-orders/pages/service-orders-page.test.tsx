import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/lib/i18n'
import { ServiceOrdersPage } from '@/features/service-orders/pages/service-orders-page'
import type { LocalServiceOrder } from '@/services/local-db/schema'

const mockServiceOrders: LocalServiceOrder[] = [
  {
    id: 'so-1',
    tenantId: 'tenant-1',
    code: 'SRV-0007',
    customerName: 'Pelanggan Umum',
    description: 'Xxxx',
    date: '2026-11-21',
    cost: 22000,
    paidTotal: 22000,
    status: 'Selesai',
    hasWarranty: false, // lost on sync pull
    warrantyValue: 30,
    warrantyUnit: 'hari',
    timeline: [
      { id: 't-1', status: 'Diterima', date: '2026-11-21T00:00:00.000Z', note: 'Order dibuat' },
      { id: 't-2', status: 'Selesai', date: '2026-11-21T01:00:00.000Z', note: 'Garansi diatur 30 hari', type: 'warranty' },
    ],
    syncStatus: 'synced',
    version: 1,
    updatedAt: '2026-11-21T01:00:00.000Z',
  },
  {
    id: 'so-2',
    tenantId: 'tenant-1',
    code: 'SRV-0008',
    customerName: 'Pelanggan Lain',
    description: 'Yyyy',
    date: '2026-11-21',
    cost: 50000,
    paidTotal: 50000,
    status: 'Selesai',
    hasWarranty: false,
    syncStatus: 'synced',
    version: 1,
    updatedAt: '2026-11-21T01:00:00.000Z',
  },
]

vi.mock('@/features/service-orders/hooks/use-service-orders', () => ({
  useServiceOrders: () => mockServiceOrders,
}))

vi.mock('@/features/service-orders/hooks/use-service-vertical', () => ({
  useServiceVertical: () => ({
    statusFlow: ['Diterima', 'Diagnosa', 'Dikerjakan', 'Selesai', 'Diambil'],
  }),
}))

describe('ServiceOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table and resolves warranty correctly as Aktif for order with warranty', async () => {
    render(
      <MemoryRouter>
        <ServiceOrdersPage />
      </MemoryRouter>,
    )

    // Switch to list view
    const listBtn = screen.getByLabelText(/List View/i)
    fireEvent.click(listBtn)

    // Expect SRV-0007 (which recovered warranty from timeline) to show "Aktif"
    expect(screen.getByText('SRV-0007')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()

    // Expect SRV-0008 (which has no warranty) to show "Tanpa Garansi"
    expect(screen.getByText('SRV-0008')).toBeInTheDocument()
    expect(screen.getByText('Tanpa Garansi')).toBeInTheDocument()
  })
})
