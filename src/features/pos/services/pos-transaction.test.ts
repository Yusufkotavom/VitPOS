import { describe, expect, it, vi, beforeEach } from 'vitest'
import { posTransactionService } from './pos-transaction.service'
import { localDb } from '@/services/local-db/client'
import type { LocalProduct } from '@/services/local-db/schema'

vi.mock('@/features/auth/stores/auth-store', () => ({
  requireActiveTenantId: vi.fn(() => 'tenant-1'),
}))

vi.mock('@/features/sales-orders/services/sales-order-finance.service', () => ({
  syncCustomerSalesMetrics: vi.fn(),
}))

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    transaction: vi.fn(),
    salesOrders: { put: vi.fn() },
    salesOrderItems: { put: vi.fn(), bulkPut: vi.fn() },
    payments: { put: vi.fn() },
    stockMovements: { put: vi.fn(), bulkPut: vi.fn() },
    products: { get: vi.fn(), bulkGet: vi.fn(), update: vi.fn() },
    inventory: { put: vi.fn(), bulkPut: vi.fn() },
    recipes: { where: vi.fn(() => ({ equals: vi.fn(() => ({ filter: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })) })) },
    outbox: { put: vi.fn(), bulkPut: vi.fn() }
  }
}))

describe('posTransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockCartItems = [
    { productId: 'p1', name: 'Product 1', qty: 2, price: 100, subtotal: 200 }
  ]
  const mockTotals = { subtotal: 200, discount: 0, total: 200, itemCount: 2, change: 0 }

  it('saveDraft saves order, items, and outbox in a transaction', async () => {
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)

    await posTransactionService.saveDraft(mockCartItems, mockTotals)

    expect(localDb.transaction).toHaveBeenCalled()
    expect(localDb.salesOrders.put).toHaveBeenCalled()
    expect(localDb.salesOrderItems.put).toHaveBeenCalled()
    expect(localDb.outbox.put).toHaveBeenCalled()
  })

  it('checkout saves order, payment, stock movements, and updates product stock in a transaction', async () => {
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)
    
     vi.mocked(localDb.products.bulkGet).mockResolvedValue([{
      id: 'p1', tenantId: 'tenant-1', name: 'Product 1', type: 'Produk Fisik', stock: 10, version: 1
     } as LocalProduct])

    await posTransactionService.checkout(mockCartItems, mockTotals, 'tunai', 200)

    expect(localDb.transaction).toHaveBeenCalled()
    expect(localDb.salesOrders.put).toHaveBeenCalled()
    expect(localDb.salesOrderItems.bulkPut).toHaveBeenCalled()
    expect(localDb.payments.put).toHaveBeenCalled()
    expect(localDb.stockMovements.bulkPut).toHaveBeenCalled()
    expect(localDb.products.update).toHaveBeenCalledWith('p1', expect.objectContaining({ stock: 8 }))
    expect(localDb.inventory.bulkPut).toHaveBeenCalled()
    expect(localDb.outbox.bulkPut).toHaveBeenCalled()
  })
})
