import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { buildWarrantyTimelineNote } from '@/features/service-orders/lib/warranty'
import type { 
  LocalServiceOrder, 
  LocalPayment, 
  LocalStockMovement, 
  LocalInventory, 
  OutboxItem,
  PosPaymentMethodCode,
  ServiceOrderStatus,
} from '@/services/local-db/schema'

export type SocItem = {
  productId: string
  name: string
  qty: number
  price: number
  subtotal: number
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function serviceOrderCode() {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const rand = crypto.randomUUID().slice(0, 3).toUpperCase()
  return `SRV-${stamp}-${rand}`
}

export const socTransactionService = {
  async checkout(
    items: SocItem[], 
    totals: { total: number }, 
    paymentMethod: string, 
    paidAmount: number, 
    customerName: string, 
    customerId: string | null,
    serviceData: { description: string; notes: string; status: string; estimatedCompletion?: string; hasWarranty: boolean; warrantyValue?: number; warrantyUnit?: 'hari' | 'bulan' | 'tahun' }
  ) {
    if (!serviceData.description.trim()) throw new Error('Deskripsi pekerjaan wajib diisi')

    const tenantId = requireActiveTenantId()
    const nowIso = new Date().toISOString()
    const serviceOrderId = crypto.randomUUID()
    const paymentId = newId('pay')

    const rawPaid = Math.max(paidAmount, 0)
    const retainedAmount = Math.min(rawPaid, totals.total)
    
    const paymentStatus = paymentMethod === 'piutang' ? 'Pending' : 'Berhasil'

    const serviceOrder: LocalServiceOrder = {
      id: serviceOrderId,
      tenantId,
      code: serviceOrderCode(),
      customerId: customerId ?? undefined,
      customerName: customerName || 'Umum',
      description: serviceData.description,
      date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
      estimatedCompletion: serviceData.estimatedCompletion,
      cost: totals.total,
      paidTotal: retainedAmount,
      status: serviceData.status as ServiceOrderStatus,
      items: items.map(c => ({ ...c })),
      notes: serviceData.notes,
      timeline: [{
        id: crypto.randomUUID(),
        status: serviceData.status,
        date: nowIso,
        note: 'Service order dibuat',
        type: 'status',
      }],
      hasWarranty: serviceData.hasWarranty,
      warrantyValue: serviceData.hasWarranty ? serviceData.warrantyValue : undefined,
      warrantyUnit: serviceData.hasWarranty ? serviceData.warrantyUnit : undefined,
      warrantyStartDate: undefined,
      warrantyEndDate: undefined,
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    if (serviceData.hasWarranty && serviceData.warrantyValue && serviceData.warrantyUnit) {
      serviceOrder.timeline?.push({
        id: crypto.randomUUID(),
        type: 'warranty',
        status: 'Garansi',
        date: nowIso,
        note: buildWarrantyTimelineNote({
          value: serviceData.warrantyValue,
          unit: serviceData.warrantyUnit,
          mode: 'created',
        }),
      })
    }

    const outboxPayload: OutboxItem[] = [
      {
        id: newId('outbox'),
        entityType: 'service_order',
        entityId: serviceOrderId,
        mutationType: 'create',
        payload: serviceOrder,
        status: 'queued',
        attempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
    ]

    let payment: LocalPayment | null = null
    if (retainedAmount > 0) {
      payment = {
        id: paymentId,
        tenantId,
        ref: `PAY-SRV-${Date.now().toString().slice(-6)}`,
        serviceOrderId,
        source: 'SERVICE',
        method: paymentMethod as PosPaymentMethodCode,
        amount: retainedAmount,
        date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
        status: paymentStatus,
        syncStatus: 'pending',
        version: 1,
        updatedAt: nowIso,
      }
      outboxPayload.push({
        id: newId('outbox'),
        entityType: 'payment',
        entityId: paymentId,
        mutationType: 'create',
        payload: payment,
        status: 'queued',
        attempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    }

    const stockMovements: LocalStockMovement[] = items
      .filter(item => item.qty > 0)
      .map(item => ({
        id: newId('sm'),
        tenantId,
        productId: item.productId,
        productName: item.name,
        warehouseName: 'Gudang Toko',
        type: 'sale',
        qty: -item.qty,
        referenceType: 'sale',
        referenceId: serviceOrderId,
        syncStatus: 'pending',
        updatedAt: nowIso,
      }))
      
    if (stockMovements.length > 0) {
      stockMovements.forEach(m => {
        outboxPayload.push({
          id: newId('outbox'),
          entityType: 'stock_movement',
          entityId: m.id,
          mutationType: 'create',
          payload: m,
          status: 'queued',
          attempts: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      })
    }

    const warehouseName = 'Gudang Toko'
    const productIds = [...new Set(items.map((i) => i.productId))]
    const existingProducts = await localDb.products.bulkGet(productIds)
    const productMap = new Map(existingProducts.filter(Boolean).map((p) => [p!.id, p!]))

    const inventoryRows: LocalInventory[] = []
    const productUpdates: { id: string; stock: number; updatedAt: string; version: number; syncStatus: 'pending' }[] = []

    for (const item of items) {
      const existing = productMap.get(item.productId)
      if (!existing || existing.tenantId !== tenantId || existing.type !== 'Produk Fisik') continue

      const nextStock = Math.max(0, existing.stock - item.qty)
      productUpdates.push({ id: item.productId, stock: nextStock, updatedAt: nowIso, version: existing.version + 1, syncStatus: 'pending' })

      let status = 'Aman'
      if (nextStock <= 0) status = 'Habis'
      else if (nextStock <= 5) status = 'Stok Rendah'

      inventoryRows.push({
        id: `${tenantId}_${item.productId}_${warehouseName}`,
        tenantId,
        product: existing.name,
        warehouse: warehouseName,
        stockSystem: nextStock,
        stockSafe: 5,
        movement: `-${item.qty} (service)`,
        status,
      })
    }

    await localDb.transaction('rw', [localDb.serviceOrders, localDb.payments, localDb.stockMovements, localDb.products, localDb.inventory, localDb.outbox], async () => {
      await localDb.serviceOrders.put(serviceOrder)
      if (payment) await localDb.payments.put(payment)
      if (stockMovements.length > 0) await localDb.stockMovements.bulkPut(stockMovements)
      for (const upd of productUpdates) {
        await localDb.products.update(upd.id, upd)
      }
      if (inventoryRows.length > 0) await localDb.inventory.bulkPut(inventoryRows)
      if (outboxPayload.length > 0) await localDb.outbox.bulkPut(outboxPayload)
    })

    return { serviceOrderId, paymentId, code: serviceOrder.code, serviceOrder, payment }
  }
}
