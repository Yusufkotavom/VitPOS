import { requireActiveTenantId, resolveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import type { LocalInventory, LocalProduct, LocalPurchase, LocalStockMovement } from '@/services/local-db/schema'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function syncSupplierPurchaseMetrics(supplierId?: string, tenantId: string = requireActiveTenantId()) {
  if (!supplierId) return

  const supplier = await localDb.suppliers.get(supplierId)
  if (!supplier || supplier.tenantId !== tenantId) return

  const purchases = await localDb.purchases.where('tenantId').equals(tenantId).toArray()
  const supplierPurchases = purchases.filter((purchase) => purchase.supplierId === supplierId && purchase.status !== 'Batal')
  const payable = supplierPurchases
    .filter((purchase) => purchase.status === 'Diterima')
    .reduce((sum, purchase) => sum + purchase.grandTotal, 0)

  await localDb.suppliers.update(supplierId, {
    orders: supplierPurchases.length,
    payable,
    updatedAt: new Date().toISOString(),
    version: supplier.version + 1,
    syncStatus: 'pending',
  })
}

async function findOrCreateProduct(tenantId: string, name: string, unitPrice: number) {
  const products = await localDb.products.where('tenantId').equals(tenantId).toArray()
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
    stock: 0,
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: now,
  }
  await localDb.products.put(product)
  return product
}

export async function receivePurchaseOrder(purchase: LocalPurchase, warehouseName: string = 'Gudang Toko') {
  const tenantId = resolveTenantId(purchase.tenantId)
  const now = new Date().toISOString()

  if (purchase.status === 'Diterima') {
    return purchase
  }

  await localDb.transaction('rw', [localDb.products, localDb.purchases, localDb.stockMovements, localDb.inventory], async () => {
    for (const item of purchase.items) {
      const product = await findOrCreateProduct(tenantId, item.name, item.unitPrice)
      const nextStock = product.stock + item.qty

      await localDb.products.update(product.id, {
        stock: nextStock,
        price: item.unitPrice,
        updatedAt: now,
        version: product.version + 1,
        syncStatus: 'pending',
      })

      const movement: LocalStockMovement = {
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
      }
      await localDb.stockMovements.put(movement)

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

    await localDb.purchases.put({
      ...purchase,
      items: purchase.items,
      status: 'Diterima',
      syncStatus: 'pending',
      version: purchase.version + 1,
      updatedAt: now,
    })
  })

  await syncSupplierPurchaseMetrics(purchase.supplierId, tenantId)

  return {
    ...purchase,
    status: 'Diterima' as const,
    version: purchase.version + 1,
    updatedAt: now,
  }
}
