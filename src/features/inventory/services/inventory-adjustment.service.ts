import { localDb } from '@/services/local-db/client'
import { productRepository, stockMovementRepository } from '@/services/local-db/repository'
import { recordStockAdjustmentJournal } from '@/services/accounting/accounting-integration'
import type { LocalProduct, LocalStockMovement, LocalInventory } from '@/services/local-db/schema'

export const inventoryAdjustmentService = {
  async adjustStock(product: LocalProduct, qty: number, type: LocalStockMovement['type'], warehouseName: string, notes?: string) {
    const movementId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    const movement: LocalStockMovement = {
      id: movementId,
      tenantId: product.tenantId,
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
    
    const inventoryId = `${product.tenantId}_${product.id}_${warehouseName.trim()}`
    
    // Status logic: if nextStock <= 0: Habis, if nextStock <= 5: Stok Rendah, else Aman
    let status = 'Aman'
    if (nextStock <= 0) status = 'Habis'
    else if (nextStock <= 5) status = 'Stok Rendah'

    const inventory: LocalInventory = {
      id: inventoryId,
      tenantId: product.tenantId,
      product: product.name,
      warehouse: warehouseName.trim(),
      stockSystem: nextStock,
      stockSafe: 5,
      movement: `${qty >= 0 ? '+' : ''}${qty} (${type})`,
      status,
    }

    await localDb.transaction('rw', [localDb.stockMovements, localDb.products, localDb.outbox, localDb.inventory], async () => {
      await localDb.stockMovements.put(movement)
      await localDb.inventory.put(inventory)
      await productRepository.upsert({ 
        ...product, 
        stock: nextStock, 
        updatedAt: nowIso, 
        syncStatus: 'pending', 
        version: product.version + 1 
      })
      await stockMovementRepository.upsert(movement)
    })

    // Accounting journal entry (non-blocking)
    try {
      await recordStockAdjustmentJournal(
        product.tenantId,
        product,
        qty,
        movementId,
        nowIso,
      )
    } catch (err) {
      console.warn('[Inventory] recordStockAdjustmentJournal failed (non-critical):', err)
    }
    
    return nextStock
  }
}
