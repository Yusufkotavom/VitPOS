import { localDb } from '@/services/local-db/client'
import { productRepository, stockMovementRepository } from '@/services/local-db/repository'
import type { LocalProduct, LocalStockMovement } from '@/services/local-db/schema'

export const inventoryAdjustmentService = {
  async adjustStock(product: LocalProduct, qty: number, type: LocalStockMovement['type'], warehouseName: string, notes?: string) {
    const movementId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    const movement: LocalStockMovement = {
      id: movementId,
      productId: product.id,
      productName: product.name,
      warehouseName: warehouseName.trim(),
      type,
      qty,
      notes: notes?.trim() || undefined,
      syncStatus: 'pending',
      updatedAt: nowIso,
    }

    const nextStock = Math.max(0, product.stock + qty)

    await localDb.transaction('rw', [localDb.stockMovements, localDb.products, localDb.outbox], async () => {
      await localDb.stockMovements.put(movement)
      await productRepository.upsert({ 
        ...product, 
        stock: nextStock, 
        updatedAt: nowIso, 
        syncStatus: 'pending', 
        version: product.version + 1 
      })
      await stockMovementRepository.upsert(movement)
    })
    
    return nextStock
  }
}