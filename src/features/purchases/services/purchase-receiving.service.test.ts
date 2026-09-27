import { beforeEach, describe, expect, it, vi } from 'vitest'

import { receivePurchaseOrder, syncSupplierPurchaseMetrics, syncMissingPurchaseStockAndJournals } from '@/features/purchases/services/purchase-receiving.service'
import { localDb } from '@/services/local-db/client'
import * as repository from '@/services/local-db/repository'
import * as accounting from '@/services/accounting/accounting-integration'

vi.mock('@/features/auth/stores/auth-store', () => ({
  requireActiveTenantId: vi.fn(() => 'tenant-1'),
  resolveTenantId: vi.fn((tenantId?: string) => tenantId ?? 'tenant-1'),
}))

vi.mock('@/services/accounting/accounting-integration', () => ({
  recordPurchaseJournal: vi.fn(),
}))

vi.mock('@/services/accounting/journal.service', () => ({
  getJournalEntriesByReference: vi.fn(async () => []),
}))

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    transaction: vi.fn(),
    products: { where: vi.fn(), put: vi.fn(), update: vi.fn() },
    purchases: { where: vi.fn(), put: vi.fn() },
    purchaseItems: { where: vi.fn(() => ({ equals: vi.fn(() => ({ delete: vi.fn() })) })), bulkPut: vi.fn() },
    stockMovements: { put: vi.fn(), where: vi.fn(() => ({ equals: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })) },
    inventory: { put: vi.fn() },
    suppliers: { get: vi.fn(), put: vi.fn(), update: vi.fn() },
    outbox: { put: vi.fn() },
  },
}))

vi.mock('@/services/local-db/repository', () => ({
  productRepository: { upsert: vi.fn() },
  stockMovementRepository: { upsert: vi.fn() },
  purchaseRepository: { upsert: vi.fn() },
  supplierRepository: { upsert: vi.fn() },
}))

describe('purchaseReceivingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)
  })

  it('marks purchase as received, updates stock and costPrice, and records journal', async () => {
    vi.mocked(localDb.products.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [{
          id: 'p1', tenantId: 'tenant-1', name: 'Gula', category: 'Bahan', type: 'Produk Fisik', price: 15000, costPrice: 10000, stock: 5, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: '',
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
      paidTotal: 0,
      status: 'Draft' as const,
      items: [{ id: 'item-1', tenantId: 'tenant-1', purchaseId: 'po-1', productId: '', name: 'Gula', qty: 2, unitPrice: 12000, subtotal: 24000 }],
      syncStatus: 'pending' as const,
      version: 1,
      updatedAt: '',
    }

    await receivePurchaseOrder(purchase)

    expect(repository.productRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({
      stock: 7,
      costPrice: 12000,
      price: 15000, // preserves selling price
    }))
    expect(repository.stockMovementRepository.upsert).toHaveBeenCalled()
    expect(repository.purchaseRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'Diterima' }))
    expect(localDb.inventory.put).toHaveBeenCalled()
    expect(accounting.recordPurchaseJournal).toHaveBeenCalledWith('tenant-1', 'po-1', 24000, '2026-06-09')
  })

  it('receives purchase created directly as Diterima when stock movements do not exist yet', async () => {
    vi.mocked(localDb.products.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [{
          id: 'p1', tenantId: 'tenant-1', name: 'Kopi', category: 'Bahan', type: 'Produk Fisik', price: 20000, stock: 10, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: '',
        }]),
      })),
    } as never)

    const purchase = {
      id: 'po-2',
      tenantId: 'tenant-1',
      code: 'PO-002',
      supplierId: 'sup-1',
      supplierName: 'PT Supplier',
      date: '2026-06-09',
      subtotal: 50000,
      grandTotal: 50000,
      paidTotal: 0,
      status: 'Diterima' as const,
      items: [{ id: 'item-2', tenantId: 'tenant-1', purchaseId: 'po-2', productId: '', name: 'Kopi', qty: 5, unitPrice: 10000, subtotal: 50000 }],
      syncStatus: 'pending' as const,
      version: 1,
      updatedAt: '',
    }

    await receivePurchaseOrder(purchase)

    expect(repository.productRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({
      stock: 15,
      costPrice: 10000,
    }))
    expect(accounting.recordPurchaseJournal).toHaveBeenCalled()
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

    expect(repository.supplierRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'sup-1',
      orders: 2,
      payable: 50000,
    }))
  })

  it('heals missing stock and journals for received purchases', async () => {
    vi.mocked(localDb.purchases.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          {
            id: 'po-heal',
            tenantId: 'tenant-1',
            supplierId: 'sup-1',
            code: 'PO-HEAL',
            status: 'Diterima',
            grandTotal: 30000,
            date: '2026-06-09',
            items: [{ id: 'it-1', productId: 'p1', name: 'Gula', qty: 2, unitPrice: 15000, subtotal: 30000 }],
            syncStatus: 'synced',
            version: 1,
            updatedAt: '',
          },
        ]),
      })),
    } as never)

    vi.mocked(localDb.products.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [{
          id: 'p1', tenantId: 'tenant-1', name: 'Gula', category: 'Bahan', type: 'Produk Fisik', price: 15000, stock: 5, status: 'Aktif', syncStatus: 'synced', version: 1, updatedAt: '',
        }]),
      })),
    } as never)

    await syncMissingPurchaseStockAndJournals('tenant-1')

    expect(repository.stockMovementRepository.upsert).toHaveBeenCalled()
    expect(accounting.recordPurchaseJournal).toHaveBeenCalledWith('tenant-1', 'po-heal', 30000, '2026-06-09')
  })
})
