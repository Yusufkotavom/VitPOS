import { localDb } from '@/services/local-db/client'
import { productRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { todayISO } from '@/lib/date'
import { addWarrantyDuration, buildWarrantyTimelineNote } from '@/features/service-orders/lib/warranty'
import { syncCustomerSalesMetrics } from '@/features/sales-orders/services/sales-order-finance.service'
import type { 
  LocalServiceOrder, 
  LocalPayment, 
  LocalProduct,
  LocalStockMovement, 
  LocalInventory, 
  OutboxItem,
  PosPaymentMethodCode,
  WarrantyUnit,
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

async function serviceOrderCode(): Promise<string> {
  const all = await localDb.serviceOrders.toArray()
  const max = all.reduce((highest, o) => {
    const m = o.code.match(/^SRV-(\d+)$/)
    return m ? Math.max(highest, parseInt(m[1], 10)) : highest
  }, 0)
  return `SRV-${String(max + 1).padStart(4, '0')}`
}

export const socTransactionService = {
  async checkout(
    items: SocItem[], 
    totals: { total: number }, 
    paymentMethod: string, 
    paidAmount: number, 
    customerName: string, 
    customerId: string | null,
    serviceData: { description: string; notes: string; estimatedCompletion?: string; hasWarranty?: boolean; warrantyValue?: number; warrantyUnit?: WarrantyUnit }
  ) {
    if (!serviceData.description.trim()) throw new Error('Deskripsi pekerjaan wajib diisi')

    const tenantId = requireActiveTenantId()
    const nowIso = new Date().toISOString()
    const serviceOrderId = crypto.randomUUID()
    const paymentId = newId('pay')

    const rawPaid = Math.max(paidAmount, 0)
    const retainedAmount = Math.min(rawPaid, totals.total)
    
    const paymentStatus = paymentMethod === 'piutang' ? 'Pending' : 'Berhasil'

    const warrantyEndDate = serviceData.hasWarranty && serviceData.warrantyValue && serviceData.warrantyUnit
      ? addWarrantyDuration(nowIso, serviceData.warrantyValue, serviceData.warrantyUnit)
      : undefined

    const timelineEvents: LocalServiceOrder['timeline'] = [{
      id: crypto.randomUUID(),
      status: 'Diterima',
      date: nowIso,
      note: 'Service order dibuat',
    }]

    if (serviceData.hasWarranty && serviceData.warrantyValue && serviceData.warrantyUnit) {
      timelineEvents.push({
        id: crypto.randomUUID(),
        status: 'Diterima',
        date: nowIso,
        note: buildWarrantyTimelineNote({ value: serviceData.warrantyValue, unit: serviceData.warrantyUnit, mode: 'created', endDate: warrantyEndDate }),
        type: 'warranty',
      })
    }

    const serviceOrder: LocalServiceOrder = {
      id: serviceOrderId,
      tenantId,
      code: await serviceOrderCode(),
      customerId: customerId ?? undefined,
      customerName: customerName || 'Umum',
      description: serviceData.description,
        date: todayISO(),
      estimatedCompletion: serviceData.estimatedCompletion,
      cost: totals.total,
      paidTotal: retainedAmount,
      status: 'Diterima',
      items: items.map(c => ({ ...c })),
      notes: serviceData.notes,
      hasWarranty: serviceData.hasWarranty,
      warrantyValue: serviceData.warrantyValue,
      warrantyUnit: serviceData.warrantyUnit,
      warrantyStartDate: serviceData.hasWarranty ? nowIso : undefined,
      warrantyEndDate,
      timeline: timelineEvents,
      syncStatus: 'pending',
      version: 1,
      updatedAt: nowIso,
    }

    const outboxPayload: OutboxItem[] = [
      {
        id: newId('outbox'),
        tenantId,
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
      date: todayISO(),
        status: paymentStatus,
        syncStatus: 'pending',
        version: 1,
        updatedAt: nowIso,
      }
      outboxPayload.push({
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
          tenantId,
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
    const productUpdates: LocalProduct[] = []

    for (const item of items) {
      const existing = productMap.get(item.productId)
      if (!existing || existing.tenantId !== tenantId || existing.type !== 'Produk Fisik') continue

      const nextStock = Math.max(0, existing.stock - item.qty)
      productUpdates.push({ ...existing, stock: nextStock, updatedAt: nowIso, version: existing.version + 1, syncStatus: 'pending' })

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

    try {
      await localDb.transaction('rw', [localDb.serviceOrders, localDb.payments, localDb.stockMovements, localDb.products, localDb.inventory, localDb.outbox], async () => {
        await localDb.serviceOrders.put(serviceOrder)
        if (payment) await localDb.payments.put(payment)
        if (stockMovements.length > 0) await localDb.stockMovements.bulkPut(stockMovements)
        for (const product of productUpdates) {
          await productRepository.upsert(product)
        }
        if (inventoryRows.length > 0) await localDb.inventory.bulkPut(inventoryRows)
        if (outboxPayload.length > 0) await localDb.outbox.bulkPut(outboxPayload)
      })
    } catch (err) {
      console.error('[SOC] Transaction failed:', err)
      throw err
    }

    if (customerId) {
      try {
        await syncCustomerSalesMetrics(customerId, tenantId)
      } catch (err) {
        console.error('[SOC] syncCustomerSalesMetrics failed (non-critical):', err)
      }
    }

    return { serviceOrderId, paymentId, code: serviceOrder.code, serviceOrder, payment }
  }
}
