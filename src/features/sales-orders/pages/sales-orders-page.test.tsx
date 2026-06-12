import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { SalesOrdersPage } from '@/features/sales-orders/pages/sales-orders-page'
import type { LocalSalesOrder } from '@/services/local-db/schema'

const mockUseSalesOrders = vi.fn<() => LocalSalesOrder[]>()

vi.mock('@/features/sales-orders/hooks/use-sales-orders', () => ({
  useSalesOrders: () => mockUseSalesOrders(),
}))

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
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

vi.mock('@/features/sales-orders/components/sales-order-crud-actions', () => ({
  SalesOrderCrudActions: ({ order }: { order?: LocalSalesOrder }) => (
    <button type="button">{order ? `Aksi ${order.code}` : 'Buat Invoice'}</button>
  ),
}))

const orderRows: LocalSalesOrder[] = [
  {
    id: 'so-1',
    tenantId: 'tenant-1',
    code: 'INV-001',
    customerName: 'PT Maju',
    date: '2026-06-08T10:15:00.000Z',
    subtotal: 100000,
    discountTotal: 5000,
    taxTotal: 10000,
    grandTotal: 105000,
    paidTotal: 50000,
    status: 'Sebagian',
    items: [],
    syncStatus: 'pending',
    version: 1,
    updatedAt: '2026-06-08T00:00:00.000Z',
  },
  {
    id: 'so-2',
    tenantId: 'tenant-1',
    code: 'INV-002',
    customerName: 'CV Baru',
    date: '2026-06-12T15:13:44.424Z',
    subtotal: 200000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 200000,
    paidTotal: 200000,
    status: 'Lunas',
    items: [],
    syncStatus: 'pending',
    version: 1,
    updatedAt: '2026-06-12T00:00:00.000Z',
  },
]

describe('SalesOrdersPage', () => {
  beforeEach(() => {
    mockUseSalesOrders.mockReset()
    mockUseSalesOrders.mockReturnValue(orderRows)
  })

  afterEach(() => {
    cleanup()
  })

  it('shows table view by default on desktop and allows switch to card view', () => {
    render(
      <MemoryRouter>
        <SalesOrdersPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('columnheader', { name: 'Invoice' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Card View' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Card View' }))

    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Invoice' })).not.toBeInTheDocument()
  })

  it('shows newest invoice first and formats date for table and card views', () => {
    render(
      <MemoryRouter>
        <SalesOrdersPage />
      </MemoryRouter>
    )

    const invoiceLinks = screen.getAllByRole('link', { name: /INV-00[12]/ })
    expect(invoiceLinks[0]).toHaveTextContent('INV-002')
    expect(invoiceLinks[1]).toHaveTextContent('INV-001')

    expect(screen.getByText('12 Jun 2026, 15:13')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Card View' }))

    expect(screen.getByText('8 Jun 2026, 10:15')).toBeInTheDocument()
    expect(screen.getByText('12 Jun 2026, 15:13')).toBeInTheDocument()
  })
})
