import { localDb } from '@/services/local-db/client'
import { productRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { recordProductionJournal } from '@/services/accounting/accounting-integration'
import type { LocalProduct, LocalProductionBatch, LocalStockMovement, OutboxItem } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function produceFromRecipe(
  recipeId: string,
  batchQty: number,
  warehouseName: string = 'Gudang Toko',
  tenantId: string = requireActiveTenantId(),
) {
  const recipe = await localDb.recipes.get(recipeId)
  if (!recipe || recipe.tenantId !== tenantId) {
    throw new Error('Resep tidak ditemukan')
  }
  if (recipe.status !== 'Aktif') {
    throw new Error('Resep tidak aktif')
  }
  if (batchQty <= 0) {
    throw new Error('Jumlah produksi harus lebih dari 0')
  }

  const nowIso = new Date().toISOString()
  const batchId = createId('pb')
  const producedQty = batchQty * recipe.batchYield

  const stockMovements: LocalStockMovement[] = []
  const outboxItems: OutboxItem[] = []
  const productUpdates: LocalProduct[] = []

  const products = await localDb.products.where('tenantId').equals(tenantId).toArray()
  const productMap = new Map(products.map((p) => [p.id, p]))

  const producedProduct = productMap.get(recipe.productId)
  if (!producedProduct) {
    throw new Error(`Produk "${recipe.productName}" tidak ditemukan`)
  }

  for (const item of recipe.items) {
    const ingredient = productMap.get(item.productId)
    if (!ingredient) {
      throw new Error(`Bahan "${item.productName}" tidak ditemukan di katalog`)
    }

    const consumeQty = item.qty * batchQty

    stockMovements.push({
      id: createId('sm'),
      tenantId,
      productId: item.productId,
      productName: item.productName,
      warehouseName,
      type: 'production',
      qty: -consumeQty,
      referenceType: 'production_batch',
      referenceId: batchId,
      syncStatus: 'pending',
      updatedAt: nowIso,
    })

    const nextStock = Math.max(0, ingredient.stock - consumeQty)
    productUpdates.push({ ...ingredient, stock: nextStock, updatedAt: nowIso, version: ingredient.version + 1, syncStatus: 'pending' })
  }

  stockMovements.push({
    id: createId('sm'),
    tenantId,
    productId: recipe.productId,
    productName: recipe.productName,
    warehouseName,
    type: 'production',
    qty: producedQty,
    referenceType: 'production_batch',
    referenceId: batchId,
    syncStatus: 'pending',
    updatedAt: nowIso,
  })

  const nextStockProduced = (producedProduct.stock || 0) + producedQty
  productUpdates.push({ ...producedProduct, stock: nextStockProduced, updatedAt: nowIso, version: producedProduct.version + 1, syncStatus: 'pending' })

  const batch: LocalProductionBatch = {
    id: batchId,
    tenantId,
    recipeId: recipe.id,
    recipeName: recipe.name,
    productId: recipe.productId,
    productName: recipe.productName,
    batchQty,
    date: new Date().toISOString().slice(0, 10),
    syncStatus: 'pending',
    version: 1,
    updatedAt: nowIso,
  }

  for (const movement of stockMovements) {
    outboxItems.push({
      id: createId('outbox'),
      tenantId,
      entityType: 'stock_movement',
      entityId: movement.id,
      mutationType: 'create',
      payload: movement,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
  }

  outboxItems.push({
    id: createId('outbox'),
    tenantId,
    entityType: 'production_batch',
    entityId: batch.id,
    mutationType: 'create',
    payload: batch,
    status: 'queued',
    attempts: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await localDb.transaction('rw', [localDb.productionBatches, localDb.stockMovements, localDb.products, localDb.outbox], async () => {
    await localDb.productionBatches.put(batch)
    await localDb.stockMovements.bulkPut(stockMovements)
    for (const product of productUpdates) {
      await productRepository.upsert(product)
    }
    await localDb.outbox.bulkPut(outboxItems)
  })

  // Accounting journal entry (non-blocking)
  try {
    const totalCost = recipe.items.reduce((sum, item) => {
      const ingredient = productMap.get(item.productId)
      const consumeQty = item.qty * batchQty
      const unitCost = ingredient?.costPrice ?? ingredient?.price ?? 0
      return sum + consumeQty * unitCost
    }, 0)
    await recordProductionJournal(
      tenantId,
      batchId,
      totalCost,
      new Date().toISOString(),
    )
  } catch (err) {
    console.warn('[Production] recordProductionJournal failed (non-critical):', err)
  }

  return { batch, stockMovements, productUpdates }
}
