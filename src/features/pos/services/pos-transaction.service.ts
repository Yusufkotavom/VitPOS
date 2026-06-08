import { localDb } from '@/services/local-db/client'
import type { LocalPayment, LocalSalesOrder, LocalSalesOrderItem, LocalStockMovement, OutboxItem, PosPaymentMethodCode } from '@/services/local-db/schema'
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

function isCashLike(method: PosPaymentMethod): boolean {
  return method === 'tunai' || method === 'qris' || method === 'kartu' || method === 'transfer' || method === 'e-wallet'
}

export const posTransactionService = {
  async saveDraft(cartItems: CartItem[], totals: PosTotals, discountTotal: number = 0) {
    if (cartItems.length === 0) return

    const draftId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    const draftItems: LocalSalesOrderItem[] = cartItems.map((cartItem) => ({
      id: newId('soi'),
      salesOrderId: draftId,
      productId: cartItem.productId,
      name: cartItem.name,
      qty: cartItem.qty,
      unitPrice: cartItem.price,
      subtotal: cartItem.subtotal,
    }))

    const draftOrder: LocalSalesOrder = {
      id: draftId,
      code: `DRF-${Date.now()}`,
      customerName: 'Draft',
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

  async checkout(cartItems: CartItem[], totals: PosTotals, paymentMethod: PosPaymentMethod, paidAmount: number, discountTotal: number = 0) {
    if (cartItems.length === 0) return

    const nowIso = new Date().toISOString()
    const salesOrderId = crypto.randomUUID()
    const paymentId = newId('pay')

    const items: LocalSalesOrderItem[] = cartItems.map((cartItem) => ({
      id: newId('soi'),
      salesOrderId,
      productId: cartItem.productId,
      name: cartItem.name,
      qty: cartItem.qty,
      unitPrice: cartItem.price,
      subtotal: cartItem.subtotal,
    }))

    const actualPaid = isCashLike(paymentMethod) ? totals.total : paidAmount

    const salesOrder: LocalSalesOrder = {
      id: salesOrderId,
      code: orderCode(),
      customerName: 'Umum',
      date: todayLabel(),
      subtotal: totals.subtotal,
      discountTotal: discountTotal,
      taxTotal: 0,
      grandTotal: totals.total,
      paidTotal: actualPaid,
      status: isPaidStatus(totals.total, actualPaid),
      items,
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const payment: LocalPayment = {
      id: paymentId,
      ref: `PAY-${Date.now().toString().slice(-6)}`,
      salesOrderId,
      source: 'POS',
      method: paymentMethod as PosPaymentMethodCode,
      amount: actualPaid,
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

    await localDb.transaction('rw', [localDb.salesOrders, localDb.salesOrderItems, localDb.payments, localDb.stockMovements, localDb.products, localDb.outbox], async () => {
      await localDb.salesOrders.put(salesOrder)
      for (const item of items) {
        await localDb.salesOrderItems.put(item)
      }
      await localDb.payments.put(payment)
      for (const movement of stockMovements) {
        await localDb.stockMovements.put(movement)
      }
      for (const cartItem of cartItems) {
        const existing = await localDb.products.get(cartItem.productId)
        if (existing && existing.type === 'Produk Fisik') {
          const nextStock = Math.max(0, existing.stock - cartItem.qty)
          await localDb.products.update(cartItem.productId, {
            stock: nextStock,
            updatedAt: nowIso,
            version: existing.version + 1,
            syncStatus: 'pending',
          })
        }
      }
      for (const outboxItem of outboxPayload) {
        await localDb.outbox.put(outboxItem)
      }
    })
  }
}
