import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recordPurchasePayment, deletePurchasePayment, syncMissingPurchaseCashRecords } from '@/features/purchases/services/purchase-payment.service'
import { localDb } from '@/services/local-db/client'
import * as accounting from '@/services/accounting/accounting-integration'

vi.mock('@/features/auth/stores/auth-store', () => ({
  requireActiveTenantId: vi.fn(() => 'tenant-1'),
  resolveTenantId: vi.fn((tenantId?: string) => tenantId ?? 'tenant-1'),
}))

vi.mock('@/services/accounting/accounting-integration', () => ({
  recordPurchasePaymentJournal: vi.fn(),
}))

vi.mock('@/services/accounting/journal.service', () => ({
  getJournalEntriesByReference: vi.fn(async () => []),
}))

vi.mock('@/services/sync/outbox-service', () => ({
  enqueueOutboxItem: vi.fn(),
}))

vi.mock('@/features/purchases/services/purchase-receiving.service', () => ({
  syncSupplierPurchaseMetrics: vi.fn(),
}))

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    transaction: vi.fn(),
    purchases: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    payments: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), where: vi.fn() },
    cash: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), where: vi.fn() },
    cashCategories: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    paymentMethods: { where: vi.fn() },
    outbox: { put: vi.fn() },
  },
}))

describe('purchasePaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)
  })

  it('records purchase payment, updates purchase, creates cash transaction, and records journal', async () => {
    vi.mocked(localDb.purchases.get).mockResolvedValue({
      id: 'po-1',
      tenantId: 'tenant-1',
      code: 'PO-001',
      supplierId: 'sup-1',
      supplierName: 'PT Supplier',
      date: '2026-06-09',
      subtotal: 100000,
      grandTotal: 100000,
      paidTotal: 0,
      status: 'Diterima',
      items: [],
      syncStatus: 'synced',
      version: 1,
      updatedAt: '',
    })

    vi.mocked(localDb.cashCategories.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'cat-exp-1', tenantId: 'tenant-1', name: 'Pembelian Stok', type: 'Pengeluaran', status: 'Aktif' },
        ]),
      })),
    } as never)

    vi.mocked(localDb.paymentMethods.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'pm-1', tenantId: 'tenant-1', name: 'Kas Toko', type: 'tunai', status: 'Aktif' },
        ]),
      })),
    } as never)

    const result = await recordPurchasePayment('po-1', 100000, 'tunai')

    expect(result.purchase.paidTotal).toBe(100000)
    expect(localDb.payments.put).toHaveBeenCalledWith(expect.objectContaining({
      amount: 100000,
      method: 'tunai',
      purchaseId: 'po-1',
    }))
    expect(localDb.cash.put).toHaveBeenCalledWith(expect.objectContaining({
      expense: 100000,
      income: 0,
      category: 'cat-exp-1',
      account: 'Kas Toko',
    }))
    expect(accounting.recordPurchasePaymentJournal).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(String),
      100000,
      'tunai',
      expect.any(String),
    )
  })

  it('deletes purchase payment and removes linked cash record', async () => {
    vi.mocked(localDb.payments.get).mockResolvedValue({
      id: 'pay-1',
      tenantId: 'tenant-1',
      ref: 'PAY-PO-123456',
      purchaseId: 'po-1',
      source: 'Pembelian',
      method: 'tunai',
      amount: 50000,
      date: '2026-06-09',
      status: 'Berhasil',
      syncStatus: 'synced',
      version: 1,
      updatedAt: '',
    })

    vi.mocked(localDb.cash.where).mockReturnValue({
      equals: vi.fn(() => ({
        filter: vi.fn(() => ({
          toArray: vi.fn(async () => [
            { id: 'cash-1', tenantId: 'tenant-1', ref: 'PAY-PO-123456', expense: 50000 },
          ]),
        })),
      })),
    } as never)

    vi.mocked(localDb.payments.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => []),
      })),
    } as never)

    vi.mocked(localDb.purchases.get).mockResolvedValue({
      id: 'po-1',
      tenantId: 'tenant-1',
      code: 'PO-001',
      supplierName: 'PT Supplier',
      date: '2026-06-09',
      subtotal: 50000,
      grandTotal: 50000,
      paidTotal: 50000,
      status: 'Diterima',
      items: [],
      syncStatus: 'synced',
      version: 2,
      updatedAt: '',
    })

    await deletePurchasePayment('pay-1')

    expect(localDb.cash.delete).toHaveBeenCalledWith('cash-1')
    expect(localDb.payments.delete).toHaveBeenCalledWith('pay-1')
  })

  it('heals missing cash records for purchase payments', async () => {
    vi.mocked(localDb.payments.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => [
          { id: 'pay-1', tenantId: 'tenant-1', ref: 'PAY-PO-999', purchaseId: 'po-1', amount: 30000, method: 'transfer', status: 'Berhasil', date: '2026-06-09' },
        ]),
      })),
    } as never)

    vi.mocked(localDb.cash.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => []), // no cash recorded yet
      })),
    } as never)

    vi.mocked(localDb.cashCategories.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => []),
      })),
    } as never)

    vi.mocked(localDb.paymentMethods.where).mockReturnValue({
      equals: vi.fn(() => ({
        toArray: vi.fn(async () => []),
      })),
    } as never)

    await syncMissingPurchaseCashRecords('tenant-1')

    expect(localDb.cash.put).toHaveBeenCalledWith(expect.objectContaining({
      ref: 'PAY-PO-999',
      expense: 30000,
    }))
  })
})
