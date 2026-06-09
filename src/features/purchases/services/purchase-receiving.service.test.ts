import { beforeEach, describe, expect, it, vi } from 'vitest'

import { receivePurchaseOrder, syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'
import { localDb } from '@/services/local-db/client'

vi.mock('@/features/auth/stores/auth-store', () => ({
  requireActiveTenantId: vi.fn(() => 'tenant-1'),
  resolveTenantId: vi.fn((tenantId?: string) => tenantId ?? 'tenant-1'),
}))

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    transaction: vi.fn(),
    products: { where: vi.fn(), put: vi.fn(), update: vi.fn() },
    purchases: { where: vi.fn(), put: vi.fn() },
    stockMovements: { put: vi.fn() },
    inventory: { put: vi.fn() },
    suppliers: { get: vi.fn(), update: vi.fn() },
  },
}))

describe('purchaseReceivingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)
  })

  it('marks purchase as received and creates stock updates', async () => {
    vi.mocked(localDb.products.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [{
          id: 'p1', tenantId: 'tenant-1', name: 'Gula', category: 'Bahan', type: 'Produk Fisik', price: 12000, stock: 5, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: '',
        }]),
      })),
    } as never)

    const purchase = {
      id: 'po-1',
      tenantId: 'tenant-1',
      code: 'PO-001',
      supplierId: 'sup-1',
      supplierName: 'PT Supplier',
      date: '2026-06-09',
      subtotal: 24000,
      grandTotal: 24000,
      status: 'Draft' as const,
      items: [{ id: 'item-1', tenantId: 'tenant-1', purchaseId: 'po-1', productId: '', name: 'Gula', qty: 2, unitPrice: 12000, subtotal: 24000 }],
      syncStatus: 'pending' as const,
      version: 1,
      updatedAt: '',
    }

    await receivePurchaseOrder(purchase)

    expect(localDb.products.update).toHaveBeenCalledWith('p1', expect.objectContaining({ stock: 7 }))
    expect(localDb.stockMovements.put).toHaveBeenCalled()
    expect(localDb.inventory.put).toHaveBeenCalled()
    expect(localDb.purchases.put).toHaveBeenCalledWith(expect.objectContaining({ status: 'Diterima' }))
  })

  it('recalculates supplier metrics from received purchases', async () => {
    vi.mocked(localDb.suppliers.get).mockResolvedValue({
      id: 'sup-1', tenantId: 'tenant-1', name: 'PT Supplier', phone: '08123', city: 'Bandung', payable: 0, orders: 0, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: '',
    })
    vi.mocked(localDb.purchases.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'po-1', tenantId: 'tenant-1', supplierId: 'sup-1', supplierName: 'PT Supplier', code: 'PO-1', date: '', subtotal: 0, grandTotal: 50000, status: 'Diterima', items: [], syncStatus: 'pending', version: 1, updatedAt: '' },
          { id: 'po-2', tenantId: 'tenant-1', supplierId: 'sup-1', supplierName: 'PT Supplier', code: 'PO-2', date: '', subtotal: 0, grandTotal: 25000, status: 'Draft', items: [], syncStatus: 'pending', version: 1, updatedAt: '' },
        ]),
      })),
    } as never)

    await syncSupplierPurchaseMetrics('sup-1')

    expect(localDb.suppliers.update).toHaveBeenCalledWith('sup-1', expect.objectContaining({ orders: 2, payable: 50000 }))
  })
})
