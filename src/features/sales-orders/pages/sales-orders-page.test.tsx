import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { SalesOrdersPage } from '@/features/sales-orders/pages/sales-orders-page'
import type { LocalSalesOrder } from '@/services/local-db/schema'

const mockUseSalesOrders = vi.fn<() => LocalSalesOrder[]>()

vi.mock('@/features/sales-orders/hooks/use-sales-orders', () => ({
  useSalesOrders: () => mockUseSalesOrders(),
}))

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

    // Now uses the mobile responsive inline render, not separate explicit view.
    // So the data table headers shouldn't be there on mobile view if we toggled the *whole* component state?
    // Wait, the new code sets `view` to 'card', which mounts card explicitly instead of DataTable.
    // Let's look for standard text inside our card component render
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Invoice' })).not.toBeInTheDocument()
  })
})
