import { localDb } from '@/services/local-db/client'
import { productRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { todayISO } from '@/lib/date'
import { addWarrantyDuration, buildWarrantyTimelineNote } from '@/features/service-orders/lib/warranty'
import { isStockTrackedLine, jobLineToLegacyItem, sumJobLineCost } from '@/features/service-orders/lib/job-lines'
import { syncCustomerSalesMetrics } from '@/features/sales-orders/services/sales-order-finance.service'
import { recordServiceOrderJournal } from '@/services/accounting/accounting-integration'
import type {
  LocalServiceOrder,
  LocalPayment,
  LocalProduct,
  LocalStockMovement,
  LocalInventory,
  OutboxItem,
  PosPaymentMethodCode,
  WarrantyUnit,
  LocalJobLine,
  JobPriority,
} from '@/services/local-db/schema'

export type SocItem = LocalJobLine

export type SocServiceData = {
  description: string
  notes: string
  estimatedCompletion?: string
  hasWarranty?: boolean
  warrantyValue?: number
  warrantyUnit?: WarrantyUnit
  complaint?: string
  diagnosis?: string
  jobCategory?: string
  deviceType?: string
  deviceBrand?: string
  deviceModel?: string
  deviceSerial?: string
  accessories?: string
  priority?: JobPriority
  technicianName?: string
  details?: Record<string, string>
  discountTotal?: number
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
    lines: SocItem[],
    totals: { total: number; subtotal?: number },
    paymentMethod: string,
    paidAmount: number,
    customerName: string,
    customerId: string | null,
    serviceData: SocServiceData,
  ) {
    if (!serviceData.description.trim()) throw new Error('Deskripsi pekerjaan wajib diisi')
    if (lines.length === 0) throw new Error('Tambahkan minimal satu item pekerjaan')
    if (lines.some((line) => !line.name.trim())) throw new Error('Nama item tidak boleh kosong')
    if (lines.some((line) => !Number.isFinite(line.qty) || line.qty <= 0)) throw new Error('Jumlah item harus lebih dari 0')

    const tenantId = requireActiveTenantId()
    const nowIso = new Date().toISOString()
    const serviceOrderId = crypto.randomUUID()
    const paymentId = newId('pay')

    const discountTotal = Math.max(serviceData.discountTotal ?? 0, 0)
    const grandTotal = Math.max(totals.total, 0)

    const rawPaid = Math.max(paidAmount, 0)
    const retainedAmount = Math.min(rawPaid, grandTotal)

    const paymentStatus = paymentMethod === 'piutang' ? 'Pending' : 'Berhasil'

    const warrantyVal = serviceData.hasWarranty ? (serviceData.warrantyValue || 30) : undefined
    const warrantyUnit = serviceData.warrantyUnit || 'hari'
    const warrantyEndDate = serviceData.hasWarranty && warrantyVal
      ? addWarrantyDuration(nowIso, warrantyVal, warrantyUnit)
      : undefined

    const timelineEvents: LocalServiceOrder['timeline'] = [{
      id: crypto.randomUUID(),
      status: 'Diterima',
      date: nowIso,
      note: 'Service order dibuat',
      actor: serviceData.technicianName || undefined,
    }]

    if (serviceData.hasWarranty && warrantyVal) {
      timelineEvents.push({
        id: crypto.randomUUID(),
        status: 'Diterima',
        date: nowIso,
        note: buildWarrantyTimelineNote({ value: warrantyVal, unit: warrantyUnit, mode: 'created', endDate: warrantyEndDate }),
        type: 'warranty',
        actor: serviceData.technicianName || undefined,
        hasWarranty: true,
        warrantyValue: warrantyVal,
        warrantyUnit,
        warrantyStartDate: nowIso,
        warrantyEndDate,
      })
    }

    // Only catalog products that manage stock move inventory.
    const stockTrackedLines = lines.filter(isStockTrackedLine)

    const productIds = [...new Set(stockTrackedLines.map((line) => line.productId).filter(Boolean))] as string[]
    const existingProducts = productIds.length > 0 ? await localDb.products.bulkGet(productIds) : []
    const productMap = new Map(existingProducts.filter(Boolean).map((p) => [p!.id, p!]))

    for (const line of stockTrackedLines) {
      if (!line.productId) continue
      const product = productMap.get(line.productId)
      if (!product) continue
      if (product.stock < line.qty) {
        throw new Error(`Stok ${product.name} tidak mencukupi. Tersedia: ${product.stock}, diminta: ${line.qty}`)
      }
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
      cost: grandTotal,
      costPrice: sumJobLineCost(lines),
      discountTotal: discountTotal > 0 ? discountTotal : undefined,
      paidTotal: retainedAmount,
      status: 'Diterima',
      lines,
      items: lines.map(jobLineToLegacyItem),
      notes: serviceData.notes?.trim() || undefined,
      complaint: serviceData.complaint,
      diagnosis: serviceData.diagnosis,
      jobCategory: serviceData.jobCategory,
      deviceType: serviceData.deviceType,
      deviceBrand: serviceData.deviceBrand,
      deviceModel: serviceData.deviceModel,
      deviceSerial: serviceData.deviceSerial,
      accessories: serviceData.accessories,
      priority: serviceData.priority ?? 'Normal',
      technicianName: serviceData.technicianName || undefined,
      details: serviceData.details,
      hasWarranty: serviceData.hasWarranty,
      warrantyValue: serviceData.hasWarranty ? warrantyVal : undefined,
      warrantyUnit: serviceData.hasWarranty ? warrantyUnit : undefined,
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
      },
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

    const warehouseName = 'Gudang Toko'

    const stockMovements: LocalStockMovement[] = stockTrackedLines.map((line) => ({
      id: newId('sm'),
      tenantId,
      productId: line.productId!,
      productName: line.name,
      warehouseName,
      type: 'sale',
      qty: -line.qty,
      referenceType: 'service',
      referenceId: serviceOrderId,
      syncStatus: 'pending',
      updatedAt: nowIso,
    }))

    stockMovements.forEach((movement) => {
      outboxPayload.push({
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
      })
    })

    const inventoryRows: LocalInventory[] = []
    const productUpdates: LocalProduct[] = []

    for (const movement of stockMovements) {
      const existing = productMap.get(movement.productId)
      if (!existing || existing.tenantId !== tenantId) continue
      if (existing.type !== 'Produk Fisik' || existing.manageStock === false) continue

      const nextStock = Math.max(0, existing.stock + movement.qty)
      productUpdates.push({ ...existing, stock: nextStock, updatedAt: nowIso, version: existing.version + 1, syncStatus: 'pending' })

      let status = 'Aman'
      if (nextStock <= 0) status = 'Habis'
      else if (nextStock <= 5) status = 'Stok Rendah'

      inventoryRows.push({
        id: `${tenantId}_${movement.productId}_${warehouseName}`,
        tenantId,
        product: existing.name,
        warehouse: warehouseName,
        stockSystem: nextStock,
        stockSafe: 5,
        movement: `${movement.qty} (service)`,
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

    try {
      await recordServiceOrderJournal(
        tenantId,
        serviceOrderId,
        grandTotal,
        paymentMethod,
        todayISO(),
      )
    } catch (err) {
      console.warn('[SOC] recordServiceOrderJournal failed (non-critical):', err)
    }

    return { serviceOrderId, paymentId, code: serviceOrder.code, serviceOrder, payment }
  }
}
