import { localDb } from '@/services/local-db/client'
import { buildBaimTenantQuery, baimRuntime } from '@/lib/baim-runtime'
import { apiGet, apiPost, buildTenantQuery } from '@/services/api/client'
import { listOutboxItems, updateOutboxStatus } from '@/services/sync/outbox-service'
import { indexPushResults, partitionSyncMutations, toLocalOutboxStatus } from '@/services/sync/sync-transport'
import type {
  LocalPayment,
  LocalProduct,
  LocalSalesOrder,
  LocalStockMovement,
  PosPaymentMethodCode,
} from '@/services/local-db/schema'

import type { SyncPullItem, SyncPullResponse, SyncPushResponse } from '@kotacom/shared-contracts/sync'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

const SERVER_TO_LOCAL_PAYMENT_METHOD: Record<string, PosPaymentMethodCode> = {
  cash: 'tunai',
  qris: 'qris',
  card: 'kartu',
  transfer: 'transfer',
  ewallet: 'e-wallet',
  receivable: 'piutang',
}

function normalizePaymentMethod(serverMethod: unknown): PosPaymentMethodCode {
  if (typeof serverMethod !== 'string') return 'tunai'
  return SERVER_TO_LOCAL_PAYMENT_METHOD[serverMethod] ?? (serverMethod as PosPaymentMethodCode)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function applyPullItem(item: SyncPullItem) {
  if (item.mutationType === 'delete') {
    if (item.entityType === 'product') await localDb.products.delete(item.entityId)
    else if (item.entityType === 'sale') await localDb.salesOrders.delete(item.entityId)
    else if (item.entityType === 'payment') await localDb.payments.delete(item.entityId)
    else if (item.entityType === 'stock_movement') await localDb.stockMovements.delete(item.entityId)
    else if (item.entityType === 'customer') await localDb.customers.delete(item.entityId)
    else if (item.entityType === 'cash') await localDb.cash.delete(item.entityId)
    return
  }

  const payload = item.payload
  if (!isRecord(payload)) return

  if (item.entityType === 'product') {
    const product: LocalProduct = {
      id: item.entityId,
      name: typeof payload.name === 'string' ? payload.name : '',
      category: typeof payload.category === 'string' ? payload.category : '',
      type: payload.type === 'Jasa' ? 'Jasa' : 'Produk Fisik',
      price: typeof payload.salePrice === 'number' ? payload.salePrice : typeof payload.price === 'number' ? payload.price : 0,
      stock: typeof payload.stock === 'number' ? payload.stock : 0,
      sku: typeof payload.sku === 'string' ? payload.sku : undefined,
      barcode: typeof payload.barcode === 'string' ? payload.barcode : undefined,
      status: payload.isActive === false ? 'Arsip' : 'Aktif',
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.products.put(product)
  } else if (item.entityType === 'sale') {
    const order: LocalSalesOrder = {
      id: item.entityId,
      code: typeof payload.orderNumber === 'string' ? payload.orderNumber : typeof payload.code === 'string' ? payload.code : '',
      customerId: typeof payload.customerId === 'string' ? payload.customerId : undefined,
      customerName: typeof payload.customerName === 'string' ? payload.customerName : 'Umum',
      date: typeof payload.date === 'string' ? payload.date : '',
      subtotal: Number(payload.subtotal ?? 0),
      discountTotal: Number(payload.discountTotal ?? 0),
      taxTotal: Number(payload.taxTotal ?? 0),
      grandTotal: Number(payload.grandTotal ?? 0),
      paidTotal: Number(payload.paidTotal ?? 0),
      status: (typeof payload.status === 'string' ? payload.status : 'Draft') as LocalSalesOrder['status'],
      items: [],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.salesOrders.put(order)
  } else if (item.entityType === 'payment') {
    const payment: LocalPayment = {
      id: item.entityId,
      ref: typeof payload.paymentNumber === 'string' ? payload.paymentNumber : typeof payload.ref === 'string' ? payload.ref : '',
      salesOrderId: typeof payload.salesOrderId === 'string' ? payload.salesOrderId : undefined,
      source: typeof payload.source === 'string' ? payload.source : 'cloud',
      method: normalizePaymentMethod(payload.method),
      amount: Number(payload.amount ?? 0),
      date: typeof payload.date === 'string' ? payload.date : '',
      status: (typeof payload.status === 'string' ? payload.status : 'Pending') as LocalPayment['status'],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.payments.put(payment)
  } else if (item.entityType === 'stock_movement') {
    const movement: LocalStockMovement = {
      id: item.entityId,
      productId: typeof payload.productId === 'string' ? payload.productId : '',
      productName: typeof payload.productName === 'string' ? payload.productName : '',
      warehouseId: typeof payload.warehouseId === 'string' ? payload.warehouseId : undefined,
      warehouseName: typeof payload.warehouseName === 'string' ? payload.warehouseName : '',
      type: (typeof payload.type === 'string' ? payload.type : 'adjustment') as LocalStockMovement['type'],
      qty: Number(payload.qty ?? 0),
      referenceType: typeof payload.referenceType === 'string' ? payload.referenceType : undefined,
      referenceId: typeof payload.referenceId === 'string' ? payload.referenceId : undefined,
      notes: typeof payload.notes === 'string' ? payload.notes : undefined,
      syncStatus: 'synced',
      updatedAt: item.updatedAt,
    }
    await localDb.stockMovements.put(movement)
  } else if (item.entityType === 'customer') {
    await localDb.customers.put({
      id: item.entityId,
      name: typeof payload.name === 'string' ? payload.name : '',
      phone: typeof payload.phone === 'string' ? payload.phone : '',
      city: typeof payload.city === 'string' ? payload.city : '',
      receivable: Number(payload.receivable ?? 0),
      orders: Number(payload.orders ?? 0),
      status: typeof payload.status === 'string' ? payload.status : 'Aktif',
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    })
  } else if (item.entityType === 'cash') {
    await localDb.cash.put({
      id: item.entityId,
      ref: typeof payload.ref === 'string' ? payload.ref : '',
      date: typeof payload.date === 'string' ? payload.date : '',
      account: typeof payload.account === 'string' ? payload.account : '',
      category: typeof payload.category === 'string' ? payload.category : '',
      income: Number(payload.income ?? 0),
      expense: Number(payload.expense ?? 0),
      status: typeof payload.status === 'string' ? payload.status : 'Tercatat',
    })
  }
}

export async function applyPullItems(items: SyncPullItem[]) {
  await localDb.transaction(
    'rw',
    [localDb.products, localDb.customers, localDb.salesOrders, localDb.payments, localDb.stockMovements, localDb.cash],
    async () => {
      for (const item of items) {
        await applyPullItem(item)
      }
    },
  )
}

export async function runSync() {
  const runId = createId('run')
  const startedAt = new Date().toISOString()

  await localDb.syncRuns.put({
    id: runId,
    startedAt,
    status: 'running',
    processed: 0,
    failed: 0,
  })

  const items = await listOutboxItems()
  const pendingItems = items.filter((item) => item.status === 'queued' || item.status === 'failed')
  const { accepted, rejected } = partitionSyncMutations(pendingItems)
  let processed = 0
  let failed = rejected.length

  for (const rejection of rejected) {
    await updateOutboxStatus(rejection.item.id, 'failed', rejection.message)
  }

  if (accepted.length === 0) {
    const pullResponse = await apiGet<SyncPullResponse>('/sync/pull', buildTenantQuery(buildBaimTenantQuery())).catch(() => ({ ok: true as const, cursor: null, items: [] }))
    await applyPullItems(pullResponse.items)

    await localDb.syncRuns.update(runId, {
      finishedAt: new Date().toISOString(),
      status: failed > 0 ? 'failed' : 'success',
      processed,
      failed,
      pulled: pullResponse.items.length,
    })

    return { processed, failed, pulled: pullResponse.items.length }
  }

  for (const item of accepted) {
    await updateOutboxStatus(item.id, 'syncing')
  }

  const pushResponse = await apiPost<SyncPushResponse>('/sync/push', {
    ...buildBaimTenantQuery(),
    deviceId: baimRuntime.deviceId,
    mutations: accepted.map((item) => ({
      clientMutationId: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      mutationType: item.mutationType,
      payload: item.payload,
      status: item.status,
    })),
  })

  const indexedResults = indexPushResults(pushResponse.items)

  for (const item of accepted) {
    const result = indexedResults.get(`${item.entityType}:${item.entityId}:${item.mutationType}`)

    if (!result) {
      failed += 1
      await updateOutboxStatus(item.id, 'failed', 'Server tidak mengembalikan hasil sinkron item ini.')
      continue
    }

    const nextStatus = toLocalOutboxStatus(result.status)
    if (nextStatus === 'synced') processed += 1
    if (nextStatus === 'failed' || nextStatus === 'conflict') failed += 1
    await updateOutboxStatus(item.id, nextStatus, result.message)
  }

  const pullResponse = await apiGet<SyncPullResponse>('/sync/pull', buildTenantQuery(buildBaimTenantQuery())).catch(() => ({ ok: true as const, cursor: null, items: [] }))
  await applyPullItems(pullResponse.items)

  await localDb.syncRuns.update(runId, {
    finishedAt: new Date().toISOString(),
    status: failed > 0 ? 'failed' : 'success',
    processed,
    failed,
    pulled: pullResponse.items.length,
  })

  return { processed, failed, pulled: pullResponse.items.length }
}
