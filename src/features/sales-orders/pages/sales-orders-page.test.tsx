import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { SalesOrdersPage } from '@/features/sales-orders/pages/sales-orders-page'
import type { LocalSalesOrder } from '@/services/local-db/schema'

const mockUseSalesOrders = vi.fn<() => LocalSalesOrder[]>()
const mockUseIsMobile = vi.fn<() => boolean>()

vi.mock('@/features/sales-orders/hooks/use-sales-orders', () => ({
  useSalesOrders: () => mockUseSalesOrders(),
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

vi.mock('@/features/sales-orders/components/sales-order-crud-actions', () => ({
  SalesOrderCrudActions: ({ order }: { order?: LocalSalesOrder }) => (
    <button type="button">{order ? `Aksi ${order.code}` : 'Buat Invoice'}</button>
  ),
}))

const orderRows: LocalSalesOrder[] = [
  {
    id: 'so-1',
    code: 'INV-001',
    customerName: 'PT Maju',
    date: '2026-06-08',
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
]

describe('SalesOrdersPage', () => {
  beforeEach(() => {
    mockUseSalesOrders.mockReset()
    mockUseIsMobile.mockReset()
    mockUseSalesOrders.mockReturnValue(orderRows)
    mockUseIsMobile.mockReturnValue(false)
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
    expect(screen.getByRole('button', { name: 'Card' })).toBeInTheDocument()
    expect(screen.queryByText('Pembayaran')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Card' }))

    expect(screen.getByText('Pembayaran')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Invoice' })).not.toBeInTheDocument()
  })

  it('shows card layout on mobile without desktop view toggle', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(
      <MemoryRouter>
        <SalesOrdersPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Pembayaran')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'List' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Invoice' })).not.toBeInTheDocument()
  })
})
