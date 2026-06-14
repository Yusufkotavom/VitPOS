import { localDb } from '@/services/local-db/client'
import { productRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { syncCustomerSalesMetrics } from '@/features/sales-orders/services/sales-order-finance.service'
import type { LocalPayment, LocalProduct, LocalSalesOrder, LocalSalesOrderItem, LocalStockMovement, OutboxItem, PosPaymentMethodCode, LocalInventory } from '@/services/local-db/schema'
import type { PosPaymentMethod } from '@/features/pos/types/pos.types'

interface CartItem {
  productId: string
  name: string
  qty: number
  price: number
  subtotal: number
}

interface PosTotals {
  subtotal: number
  total: number
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

async function orderCode(): Promise<string> {
  const all = await localDb.salesOrders.toArray()
  const max = all.reduce((highest, o) => {
    const m = o.code.match(/^INV-(\d+)$/)
    return m ? Math.max(highest, parseInt(m[1], 10)) : highest
  }, 0)
  return `INV-${String(max + 1).padStart(4, '0')}`
}

function isPaidStatus(total: number, paid: number): LocalSalesOrder['status'] {
  if (paid >= total && total > 0) return 'Lunas'
  if (paid > 0) return 'Sebagian'
  return 'Belum Bayar'
}

export const posTransactionService = {
  async saveDraft(cartItems: CartItem[], totals: PosTotals, discountTotal: number = 0, customerName?: string | null, customerId?: string | null, shiftId?: string | null, notes?: string) {
    if (cartItems.length === 0) return

    const tenantId = requireActiveTenantId()
    const draftId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

      const draftItems: LocalSalesOrderItem[] = cartItems.map((cartItem) => ({
      id: crypto.randomUUID(),
      tenantId,
      salesOrderId: draftId,
      productId: cartItem.productId,
      name: cartItem.name,
      qty: cartItem.qty,
      unitPrice: cartItem.price,
      subtotal: cartItem.subtotal,
    }))

    const draftOrder: LocalSalesOrder = {
      id: draftId,
      tenantId,
      code: `DRF-${Date.now()}`,
      customerId: customerId ?? undefined,
      customerName: customerName || 'Umum',
      shiftId: shiftId ?? undefined,
      date: nowIso,
      subtotal: totals.subtotal,
      discountTotal: discountTotal,
      taxTotal: 0,
      grandTotal: totals.total,
      paidTotal: 0,
      notes: notes?.trim() || undefined,
      status: 'Draft',
      items: draftItems,
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const outboxItem: OutboxItem = {
      id: newId('outbox'),
      tenantId,
      entityType: 'sale',
      entityId: draftId,
      mutationType: 'create',
      payload: draftOrder,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    await localDb.transaction('rw', localDb.salesOrders, localDb.salesOrderItems, localDb.outbox, async () => {
      await localDb.salesOrders.put(draftOrder)
      for (const item of draftItems) await localDb.salesOrderItems.put(item)
      await localDb.outbox.put(outboxItem)
    })
  },

  async checkout(cartItems: CartItem[], totals: PosTotals, paymentMethod: PosPaymentMethod, paidAmount: number, discountTotal: number = 0, customerName?: string | null, customerId?: string | null, shiftId?: string | null, notes?: string) {
    if (cartItems.length === 0) return

    const tenantId = requireActiveTenantId()
    const nowIso = new Date().toISOString()
    const salesOrderId = crypto.randomUUID()
    const paymentId = crypto.randomUUID()

    const items: LocalSalesOrderItem[] = cartItems.map((cartItem) => ({
      id: crypto.randomUUID(),
      tenantId,
      salesOrderId,
      productId: cartItem.productId,
      name: cartItem.name,
      qty: cartItem.qty,
      unitPrice: cartItem.price,
      subtotal: cartItem.subtotal,
    }))

    const rawPaid = Math.max(paidAmount, 0)
    const retainedAmount = Math.min(rawPaid, totals.total)

    const salesOrder: LocalSalesOrder = {
      id: salesOrderId,
      tenantId,
      code: await orderCode(),
      customerId: customerId ?? undefined,
      customerName: customerName || 'Umum',
      shiftId: shiftId ?? undefined,
      date: nowIso,
      subtotal: totals.subtotal,
      discountTotal: discountTotal,
      taxTotal: 0,
      grandTotal: totals.total,
      paidTotal: retainedAmount,
      notes: notes?.trim() || undefined,
      status: isPaidStatus(totals.total, retainedAmount),
      items,
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const payment: LocalPayment = {
      id: paymentId,
      tenantId,
      ref: `PAY-${Date.now().toString().slice(-6)}`,
      salesOrderId,
      source: 'POS',
      shiftId: shiftId ?? undefined,
      method: paymentMethod as PosPaymentMethodCode,
      amount: retainedAmount,
      date: nowIso,
      status: paymentMethod === 'piutang' ? 'Pending' : 'Berhasil',
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const warehouseName = 'Gudang Toko'
    const allCartProductIds = [...new Set(cartItems.map((i) => i.productId))]
    const cartProducts = await localDb.products.bulkGet(allCartProductIds)
    const cartProductMap = new Map(cartProducts.filter(Boolean).map((p) => [p!.id, p!]))

    for (const cartItem of cartItems) {
      const existing = cartProductMap.get(cartItem.productId)
      if (!existing) continue
      if (existing.manageStock === false || existing.type !== 'Produk Fisik') continue
      if (existing.stock < cartItem.qty) {
        throw new Error(`Stok ${existing.name} tidak mencukupi. Tersedia: ${existing.stock}, diminta: ${cartItem.qty}`)
      }
    }

    const recipes = await localDb.recipes
      .where('tenantId').equals(tenantId)
      .filter((r) => r.status === 'Aktif')
      .toArray()
    const recipeMap = new Map(recipes.map((r) => [r.productId, r]))

    const stockMovements: LocalStockMovement[] = []
    for (const cartItem of cartItems) {
      if (cartItem.qty <= 0) continue

      const product = cartProductMap.get(cartItem.productId)
      const isManaged = product && product.manageStock !== false && product.type === 'Produk Fisik'

      if (isManaged) {
        stockMovements.push({
          id: crypto.randomUUID(),
          tenantId,
          productId: cartItem.productId,
          productName: cartItem.name,
          warehouseName,
          type: 'sale',
          qty: -cartItem.qty,
          referenceType: 'sale',
          referenceId: salesOrderId,
          syncStatus: 'pending',
          updatedAt: nowIso,
        })
      }

      const recipe = recipeMap.get(cartItem.productId)
      if (recipe) {
        for (const ri of recipe.items) {
          const consumeQty = (ri.qty / recipe.batchYield) * cartItem.qty
          stockMovements.push({
            id: crypto.randomUUID(),
            tenantId,
            productId: ri.productId,
            productName: ri.productName,
            warehouseName,
            type: 'production',
            qty: -consumeQty,
            referenceType: 'sale',
            referenceId: salesOrderId,
            syncStatus: 'pending',
            updatedAt: nowIso,
          })
        }
      }
    }

    const outboxPayload: OutboxItem[] = [
      {
        id: newId('outbox'),
        tenantId,
        entityType: 'sale',
        entityId: salesOrderId,
        mutationType: 'create',
        payload: salesOrder,
        status: 'queued',
        attempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: newId('outbox'),
        tenantId,
        entityType: 'payment',
        entityId: paymentId,
        mutationType: 'create',
        payload: payment,
        status: 'queued',
        attempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      ...stockMovements.map<OutboxItem>((movement) => ({
        id: newId('outbox'),
        tenantId,
        entityType: 'stock_movement',
        entityId: movement.id,
        mutationType: 'create',
        payload: movement,
        status: 'queued',
        attempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      })),
    ]

    const allProductIds = [...new Set([
      ...cartItems.map((i) => i.productId),
      ...stockMovements.filter((sm) => sm.type === 'production').map((sm) => sm.productId),
    ])]
    const existingProducts = await localDb.products.bulkGet(allProductIds)
    const productMap = new Map(existingProducts.filter(Boolean).map((p) => [p!.id, p!]))

    const inventoryRows: LocalInventory[] = []
    const productUpdates: LocalProduct[] = []

    for (const sm of stockMovements) {
      const existing = productMap.get(sm.productId)
      if (!existing || existing.tenantId !== tenantId || existing.type !== 'Produk Fisik') continue
      if (existing.manageStock === false) continue

      const nextStock = Math.max(0, existing.stock + sm.qty)
      productUpdates.push({ ...existing, stock: nextStock, updatedAt: nowIso, version: existing.version + 1, syncStatus: 'pending' })

      let status = 'Aman'
      if (nextStock <= 0) status = 'Habis'
      else if (nextStock <= 5) status = 'Stok Rendah'

      const label = sm.type === 'production' ? `produksi` : 'sale'
      inventoryRows.push({
        id: `${tenantId}_${sm.productId}_${warehouseName}`,
        tenantId,
        product: existing.name,
        warehouse: warehouseName,
        stockSystem: nextStock,
        stockSafe: 5,
        movement: `${sm.qty > 0 ? '+' : ''}${sm.qty} (${label})`,
        status,
      })
    }

    try {
      await localDb.transaction('rw', [localDb.salesOrders, localDb.salesOrderItems, localDb.payments, localDb.stockMovements, localDb.products, localDb.inventory, localDb.outbox], async () => {
        await localDb.salesOrders.put(salesOrder)
        if (items.length > 0) await localDb.salesOrderItems.bulkPut(items)
        await localDb.payments.put(payment)
        if (stockMovements.length > 0) await localDb.stockMovements.bulkPut(stockMovements)
        for (const product of productUpdates) {
          await productRepository.upsert(product)
        }
        if (inventoryRows.length > 0) await localDb.inventory.bulkPut(inventoryRows)
        if (outboxPayload.length > 0) await localDb.outbox.bulkPut(outboxPayload)
      })
    } catch (err) {
      console.error('[POS] Transaction failed:', err)
      throw err
    }

    try {
      await syncCustomerSalesMetrics(customerId ?? undefined, tenantId)
    } catch (err) {
      console.error('[POS] syncCustomerSalesMetrics failed (non-critical):', err)
    }

    return { salesOrderId, paymentId, code: salesOrder.code }
  }
}
