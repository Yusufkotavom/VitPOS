import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteSalesOrderPayment, recordSalesOrderPayment, syncCustomerSalesMetrics, syncSalesOrderPaymentSummary } from '@/features/sales-orders/services/sales-order-finance.service'
import { localDb } from '@/services/local-db/client'

vi.mock('@/features/auth/stores/auth-store', () => ({
  requireActiveTenantId: vi.fn(() => 'tenant-1'),
}))

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    transaction: vi.fn(),
    salesOrders: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    serviceOrders: { get: vi.fn(), put: vi.fn(), where: vi.fn(() => ({ equals: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })) },
    payments: { get: vi.fn(), put: vi.fn(), where: vi.fn(), delete: vi.fn() },
    outbox: { put: vi.fn() },
    customers: { get: vi.fn(), put: vi.fn(), update: vi.fn() },
  },
}))

describe('salesOrderFinanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)
  })

  it('records payment and updates invoice paidTotal', async () => {
    vi.mocked(localDb.salesOrders.get).mockResolvedValue({
      id: 'so-1',
      tenantId: 'tenant-1',
      code: 'INV-001',
      customerId: 'cust-1',
      customerName: 'Baim',
      date: '2026-06-09',
      subtotal: 100000,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 100000,
      paidTotal: 25000,
      status: 'Sebagian',
      items: [],
      syncStatus: 'pending',
      version: 1,
      updatedAt: '2026-06-09T00:00:00.000Z',
    })
    vi.mocked(localDb.customers.get).mockResolvedValue({
      id: 'cust-1',
      tenantId: 'tenant-1',
      name: 'Baim',
      phone: '08123',
      city: 'Bandung',
      receivable: 75000,
      orders: 1,
      status: 'Piutang',
      syncStatus: 'pending',
      version: 1,
      updatedAt: '2026-06-09T00:00:00.000Z',
    })
    vi.mocked(localDb.salesOrders.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          {
            id: 'so-1',
            tenantId: 'tenant-1',
            customerId: 'cust-1',
            customerName: 'Baim',
            code: 'INV-001',
            date: '2026-06-09',
            subtotal: 100000,
            discountTotal: 0,
            taxTotal: 0,
            grandTotal: 100000,
            paidTotal: 100000,
            status: 'Lunas',
            items: [],
            syncStatus: 'pending',
            version: 2,
            updatedAt: '2026-06-09T00:00:00.000Z',
          },
        ]),
      })),
    } as never)

    const result = await recordSalesOrderPayment('so-1', 75000, 'tunai')

    expect(result.order.paidTotal).toBe(100000)
    expect(result.order.status).toBe('Lunas')
    expect(localDb.payments.put).toHaveBeenCalled()
    expect(localDb.salesOrders.put).toHaveBeenCalledWith(expect.objectContaining({ paidTotal: 100000, status: 'Lunas' }))
    expect(localDb.customers.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'cust-1', receivable: 0, orders: 1 }))
  })

  it('recalculates customer receivable from active tenant orders', async () => {
    vi.mocked(localDb.customers.get).mockResolvedValue({
      id: 'cust-1',
      tenantId: 'tenant-1',
      name: 'Baim',
      phone: '08123',
      city: 'Bandung',
      receivable: 0,
      orders: 0,
      status: 'Piutang',
      syncStatus: 'pending',
      version: 3,
      updatedAt: '2026-06-09T00:00:00.000Z',
    })
    vi.mocked(localDb.salesOrders.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'so-1', tenantId: 'tenant-1', customerId: 'cust-1', customerName: 'Baim', code: 'INV-1', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 100000, paidTotal: 20000, status: 'Sebagian', items: [], syncStatus: 'pending', version: 1, updatedAt: '' },
          { id: 'so-2', tenantId: 'tenant-1', customerId: 'cust-1', customerName: 'Baim', code: 'INV-2', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 50000, paidTotal: 50000, status: 'Lunas', items: [], syncStatus: 'pending', version: 1, updatedAt: '' },
          { id: 'so-3', tenantId: 'tenant-1', customerId: 'cust-x', customerName: 'Other', code: 'INV-3', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 50000, paidTotal: 0, status: 'Belum Bayar', items: [], syncStatus: 'pending', version: 1, updatedAt: '' },
        ]),
      })),
    } as never)

    await syncCustomerSalesMetrics('cust-1')

    expect(localDb.customers.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'cust-1', receivable: 80000, orders: 2 }))
  })

  it('syncs invoice paidTotal from linked payment rows', async () => {
    vi.mocked(localDb.salesOrders.get).mockResolvedValue({
      id: 'so-1', tenantId: 'tenant-1', customerId: 'cust-1', customerName: 'Baim', code: 'INV-001', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 100000, paidTotal: 0, status: 'Belum Bayar', items: [], syncStatus: 'pending', version: 1, updatedAt: '',
    })
    vi.mocked(localDb.payments.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'pay-1', tenantId: 'tenant-1', salesOrderId: 'so-1', ref: 'PAY-1', source: 'Invoice', method: 'tunai', amount: 25000, date: '', status: 'Berhasil', syncStatus: 'pending', version: 1, updatedAt: '' },
          { id: 'pay-2', tenantId: 'tenant-1', salesOrderId: 'so-1', ref: 'PAY-2', source: 'Invoice', method: 'transfer', amount: 50000, date: '', status: 'Berhasil', syncStatus: 'pending', version: 1, updatedAt: '' },
        ]),
      })),
    } as never)
    vi.mocked(localDb.customers.get).mockResolvedValue({
      id: 'cust-1', tenantId: 'tenant-1', name: 'Baim', phone: '08123', city: 'Bandung', receivable: 0, orders: 0, status: 'Piutang', syncStatus: 'pending', version: 1, updatedAt: '',
    })
    vi.mocked(localDb.salesOrders.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'so-1', tenantId: 'tenant-1', customerId: 'cust-1', customerName: 'Baim', code: 'INV-001', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 100000, paidTotal: 75000, status: 'Sebagian', items: [], syncStatus: 'pending', version: 2, updatedAt: '' },
        ]),
      })),
    } as never)

    const nextOrder = await syncSalesOrderPaymentSummary('so-1')

    expect(nextOrder?.paidTotal).toBe(75000)
    expect(nextOrder?.status).toBe('Sebagian')
    expect(localDb.salesOrders.put).toHaveBeenCalledWith(expect.objectContaining({ paidTotal: 75000 }))
  })

  it('deletes payment and resyncs invoice summary', async () => {
    vi.mocked(localDb.payments.get).mockResolvedValue({
      id: 'pay-1', tenantId: 'tenant-1', salesOrderId: 'so-1', ref: 'PAY-1', source: 'Invoice', method: 'tunai', amount: 25000, date: '', status: 'Berhasil', syncStatus: 'pending', version: 1, updatedAt: '',
    })
    vi.mocked(localDb.salesOrders.get).mockResolvedValue({
      id: 'so-1', tenantId: 'tenant-1', customerId: 'cust-1', customerName: 'Baim', code: 'INV-001', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 100000, paidTotal: 25000, status: 'Sebagian', items: [], syncStatus: 'pending', version: 1, updatedAt: '',
    })
    vi.mocked(localDb.payments.where).mockReturnValue({
      equals: vi.fn(() => ({ toArray: vi.fn(async () => []) })),
    } as never)
    vi.mocked(localDb.customers.get).mockResolvedValue({
      id: 'cust-1', tenantId: 'tenant-1', name: 'Baim', phone: '08123', city: 'Bandung', receivable: 0, orders: 0, status: 'Piutang', syncStatus: 'pending', version: 1, updatedAt: '',
    })
    vi.mocked(localDb.salesOrders.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'so-1', tenantId: 'tenant-1', customerId: 'cust-1', customerName: 'Baim', code: 'INV-001', date: '', subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 100000, paidTotal: 0, status: 'Belum Bayar', items: [], syncStatus: 'pending', version: 2, updatedAt: '' },
        ]),
      })),
    } as never)

    await deleteSalesOrderPayment('pay-1')

    expect(localDb.payments.delete).toHaveBeenCalledWith('pay-1')
    expect(localDb.salesOrders.put).toHaveBeenCalledWith(expect.objectContaining({ paidTotal: 0 }))
  })
})
