import { describe, expect, it, vi, beforeEach } from 'vitest'
import { inventoryAdjustmentService } from './inventory-adjustment.service'
import { localDb } from '@/services/local-db/client'
import { productRepository, stockMovementRepository } from '@/services/local-db/repository'
import type { LocalProduct } from '@/services/local-db/schema'

vi.mock('@/services/local-db/client', () => ({
  localDb: {
    transaction: vi.fn(),
    stockMovements: { put: vi.fn() },
    products: { get: vi.fn(), update: vi.fn() },
    inventory: { put: vi.fn() },
    outbox: { put: vi.fn() }
  }
}))

vi.mock('@/services/local-db/repository', () => ({
  productRepository: { upsert: vi.fn() },
  stockMovementRepository: { upsert: vi.fn() }
}))

describe('inventoryAdjustmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adjustStock creates movement and updates product stock in transaction', async () => {
    vi.mocked(localDb.transaction).mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<unknown>
      return callback()
    }) as typeof localDb.transaction)

    const product: LocalProduct = { 
      id: 'p1', 
      tenantId: 'tenant-1',
      name: 'Product 1', 
      stock: 10, 
      version: 1,
      sku: 'SKU1',
      type: 'Produk Fisik',
      category: 'Category 1',
      price: 100,
      status: 'Aktif',
      syncStatus: 'synced',
      updatedAt: new Date().toISOString()
    }

    await inventoryAdjustmentService.adjustStock(product, 5, 'adjustment', 'Gudang Utama', 'Found more')

    expect(localDb.transaction).toHaveBeenCalled()
    expect(localDb.stockMovements.put).toHaveBeenCalled()
    expect(localDb.inventory.put).toHaveBeenCalled()
    expect(productRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ stock: 15 }))
    expect(stockMovementRepository.upsert).toHaveBeenCalled()
  })
})
