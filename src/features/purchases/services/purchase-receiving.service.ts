import { requireActiveTenantId, resolveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { productRepository, stockMovementRepository, purchaseRepository, supplierRepository } from '@/services/local-db/repository'
import { recordPurchaseJournal } from '@/services/accounting/accounting-integration'
import { getJournalEntriesByReference } from '@/services/accounting/journal.service'
import type { LocalInventory, LocalProduct, LocalPurchase } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function syncSupplierPurchaseMetrics(supplierId?: string, tenantId: string = requireActiveTenantId()) {
  if (!supplierId) return

  const supplier = await localDb.suppliers.get(supplierId)
  if (!supplier || supplier.tenantId !== tenantId) return

  const purchases = await localDb.purchases.where('tenantId').equals(tenantId).toArray()
  const supplierPurchases = purchases.filter((purchase) => purchase.supplierId === supplierId && purchase.status !== 'Batal')
  const grossPayable = supplierPurchases
    .filter((purchase) => purchase.status === 'Diterima')
    .reduce((sum, purchase) => sum + purchase.grandTotal, 0)
  const totalPaid = supplierPurchases
    .filter((purchase) => purchase.status === 'Diterima')
    .reduce((sum, purchase) => sum + (purchase.paidTotal || 0), 0)
  const payable = Math.max(0, grossPayable - totalPaid)

  await supplierRepository.upsert({
    ...supplier,
    orders: supplierPurchases.length,
    payable,
    updatedAt: new Date().toISOString(),
    version: supplier.version + 1,
    syncStatus: 'pending',
  })
}

async function findOrCreateProduct(tenantId: string, name: string, unitPrice: number, productId?: string) {
  const products = await localDb.products.where('tenantId').equals(tenantId).toArray()
  if (productId) {
    const linked = products.find((product) => product.id === productId)
    if (linked) return linked
  }
  const existing = products.find((product) => product.name.toLowerCase() === name.toLowerCase())
  if (existing) return existing

  const now = new Date().toISOString()
  const product: LocalProduct = {
    id: createId('prd'),
    tenantId,
    name,
    category: 'Bahan Baku',
    type: 'Produk Fisik',
    price: unitPrice,
    costPrice: unitPrice,
    stock: 0,
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: now,
  }
  await productRepository.upsert(product)
  return product
}

export async function receivePurchaseOrder(purchase: LocalPurchase, warehouseName: string = 'Gudang Toko') {
  const tenantId = resolveTenantId(purchase.tenantId)
  const now = new Date().toISOString()

  let alreadyReceivedStock = false
  if (localDb.stockMovements?.where) {
    try {
      const existing = await localDb.stockMovements.where('referenceId').equals(purchase.id).toArray()
      if (existing.length > 0) {
        alreadyReceivedStock = true
      }
    } catch {
      // ignore
    }
  }

  // Include localDb.purchaseItems in transaction table list to avoid 'objectStore not found' error
  await localDb.transaction(
    'rw',
    [localDb.products, localDb.purchases, localDb.purchaseItems, localDb.stockMovements, localDb.inventory, localDb.outbox],
    async () => {
      if (!alreadyReceivedStock) {
        for (const item of purchase.items) {
          const product = await findOrCreateProduct(tenantId, item.name, item.unitPrice, item.productId)
          const nextStock = product.stock + item.qty

          await productRepository.upsert({
            ...product,
            stock: nextStock,
            costPrice: item.unitPrice,
            price: product.price > 0 ? product.price : item.unitPrice,
            updatedAt: now,
          })

          await stockMovementRepository.upsert({
            id: createId('sm'),
            tenantId,
            productId: product.id,
            productName: product.name,
            warehouseName,
            type: 'purchase',
            qty: item.qty,
            referenceType: 'purchase',
            referenceId: purchase.id,
            syncStatus: 'pending',
            updatedAt: now,
          })

          const inventoryId = `${tenantId}_${product.id}_${warehouseName}`
          let status = 'Aman'
          if (nextStock <= 0) status = 'Habis'
          else if (nextStock <= 5) status = 'Stok Rendah'

          const inventoryRow: LocalInventory = {
            id: inventoryId,
            tenantId,
            product: product.name,
            warehouse: warehouseName,
            stockSystem: nextStock,
            stockSafe: 5,
            movement: `+${item.qty} (PO ${purchase.code})`,
            status,
          }
          await localDb.inventory.put(inventoryRow)
        }
      }

      await purchaseRepository.upsert({
        ...purchase,
        status: 'Diterima',
        updatedAt: now,
      })
    },
  )

  await syncSupplierPurchaseMetrics(purchase.supplierId, tenantId)

  // Accounting journal entry (non-blocking)
  try {
    const existingJournals = await getJournalEntriesByReference(tenantId, 'purchase', purchase.id)
    if (existingJournals.length === 0 && purchase.grandTotal > 0) {
      await recordPurchaseJournal(
        tenantId,
        purchase.id,
        purchase.grandTotal,
        purchase.date || now,
      )
    }
  } catch (err) {
    console.warn('[Purchasing] recordPurchaseJournal failed (non-critical):', err)
  }

  return {
    ...purchase,
    status: 'Diterima' as const,
    version: purchase.version + 1,
    updatedAt: now,
  }
}

/**
 * Self-healing sync for any purchase orders marked 'Diterima' that never had
 * their stock movements or accounting journals recorded due to earlier bugs.
 */
export async function syncMissingPurchaseStockAndJournals(tenantId: string = requireActiveTenantId()) {
  try {
    const purchases = await localDb.purchases.where('tenantId').equals(tenantId).toArray()
    const receivedPurchases = purchases.filter((p) => p.status === 'Diterima')

    for (const purchase of receivedPurchases) {
      let movementsCount = 0
      if (localDb.stockMovements?.where) {
        const movements = await localDb.stockMovements.where('referenceId').equals(purchase.id).toArray()
        movementsCount = movements.length
      }

      if (movementsCount === 0 && purchase.items?.length > 0) {
        await receivePurchaseOrder(purchase)
      } else {
        // Ensure journal exists
        try {
          const existingJournals = await getJournalEntriesByReference(tenantId, 'purchase', purchase.id)
          if (existingJournals.length === 0 && purchase.grandTotal > 0) {
            await recordPurchaseJournal(tenantId, purchase.id, purchase.grandTotal, purchase.date || new Date().toISOString())
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('[Purchasing] syncMissingPurchaseStockAndJournals error:', err)
  }
}
