import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { syncCustomerSalesMetrics } from '@/features/sales-orders/services/sales-order-finance.service'
import type { LocalPayment, LocalSalesOrder, LocalSalesOrderItem, LocalStockMovement, OutboxItem, PosPaymentMethodCode, LocalInventory } from '@/services/local-db/schema'
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

function todayLabel() {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
}

function orderCode() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const rand = crypto.randomUUID().slice(0, 3).toUpperCase()
  return `INV-${stamp}-${rand}`
}

function isPaidStatus(total: number, paid: number): LocalSalesOrder['status'] {
  if (paid >= total && total > 0) return 'Lunas'
  if (paid > 0) return 'Sebagian'
  return 'Belum Bayar'
}

export const posTransactionService = {
  async saveDraft(cartItems: CartItem[], totals: PosTotals, discountTotal: number = 0, customerName?: string | null, customerId?: string | null) {
    if (cartItems.length === 0) return

    const tenantId = requireActiveTenantId()
    const draftId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    const draftItems: LocalSalesOrderItem[] = cartItems.map((cartItem) => ({
      id: newId('soi'),
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
      date: todayLabel(),
      subtotal: totals.subtotal,
      discountTotal: discountTotal,
      taxTotal: 0,
      grandTotal: totals.total,
      paidTotal: 0,
      status: 'Draft',
      items: draftItems,
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const outboxItem: OutboxItem = {
      id: newId('outbox'),
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

  async checkout(cartItems: CartItem[], totals: PosTotals, paymentMethod: PosPaymentMethod, paidAmount: number, discountTotal: number = 0, customerName?: string | null, customerId?: string | null) {
    if (cartItems.length === 0) return

    const tenantId = requireActiveTenantId()
    const nowIso = new Date().toISOString()
    const salesOrderId = crypto.randomUUID()
    const paymentId = newId('pay')

    const items: LocalSalesOrderItem[] = cartItems.map((cartItem) => ({
      id: newId('soi'),
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
      code: orderCode(),
      customerId: customerId ?? undefined,
      customerName: customerName || 'Umum',
      date: todayLabel(),
      subtotal: totals.subtotal,
      discountTotal: discountTotal,
      taxTotal: 0,
      grandTotal: totals.total,
      paidTotal: retainedAmount,
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
      method: paymentMethod as PosPaymentMethodCode,
      amount: retainedAmount,
      date: todayLabel(),
      status: paymentMethod === 'piutang' ? 'Pending' : 'Berhasil',
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const stockMovements: LocalStockMovement[] = cartItems
      .filter((cartItem) => cartItem.qty > 0)
      .map((cartItem) => ({
        id: newId('sm'),
        tenantId,
        productId: cartItem.productId,
        productName: cartItem.name,
        warehouseName: 'Gudang Toko',
        type: 'sale',
        qty: -cartItem.qty,
        referenceType: 'sale',
        referenceId: salesOrderId,
        syncStatus: 'pending',
        updatedAt: nowIso,
      }))

    const outboxPayload: OutboxItem[] = [
      {
        id: newId('outbox'),
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

    const warehouseName = 'Gudang Toko'
    const productIds = [...new Set(cartItems.map((i) => i.productId))]
    const existingProducts = await localDb.products.bulkGet(productIds)
    const productMap = new Map(existingProducts.filter(Boolean).map((p) => [p!.id, p!]))

    const inventoryRows: LocalInventory[] = []
    const productUpdates: { id: string; stock: number; updatedAt: string; version: number; syncStatus: 'pending' }[] = []

    for (const cartItem of cartItems) {
      const existing = productMap.get(cartItem.productId)
      if (!existing || existing.tenantId !== tenantId || existing.type !== 'Produk Fisik') continue

      const nextStock = Math.max(0, existing.stock - cartItem.qty)
      productUpdates.push({ id: cartItem.productId, stock: nextStock, updatedAt: nowIso, version: existing.version + 1, syncStatus: 'pending' })

      let status = 'Aman'
      if (nextStock <= 0) status = 'Habis'
      else if (nextStock <= 5) status = 'Stok Rendah'

      inventoryRows.push({
        id: `${tenantId}_${cartItem.productId}_${warehouseName}`,
        tenantId,
        product: existing.name,
        warehouse: warehouseName,
        stockSystem: nextStock,
        stockSafe: 5,
        movement: `-${cartItem.qty} (sale)`,
        status,
      })
    }

    await localDb.transaction('rw', [localDb.salesOrders, localDb.salesOrderItems, localDb.payments, localDb.stockMovements, localDb.products, localDb.inventory, localDb.outbox], async () => {
      await localDb.salesOrders.put(salesOrder)
      if (items.length > 0) await localDb.salesOrderItems.bulkPut(items)
      await localDb.payments.put(payment)
      if (stockMovements.length > 0) await localDb.stockMovements.bulkPut(stockMovements)
      for (const upd of productUpdates) {
        await localDb.products.update(upd.id, upd)
      }
      if (inventoryRows.length > 0) await localDb.inventory.bulkPut(inventoryRows)
      if (outboxPayload.length > 0) await localDb.outbox.bulkPut(outboxPayload)
    })

    await syncCustomerSalesMetrics(customerId ?? undefined, tenantId)

    return { salesOrderId, paymentId, code: salesOrder.code }
  }
}
