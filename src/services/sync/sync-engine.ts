import { localDb } from '@/services/local-db/client'
import { DEMO_TENANT_ID } from '@/services/local-db/seeds'
import { baimRuntime } from '@/lib/baim-runtime'
import { apiGet, apiPost, buildTenantQuery } from '@/services/api/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { listOutboxItems, updateOutboxStatus } from '@/services/sync/outbox-service'
import { indexPushResults, partitionSyncMutations, toLocalOutboxStatus } from '@/services/sync/sync-transport'
import type {
  LocalCashCategory,
  LocalPayment,
  LocalPaymentMethod,
  LocalProduct,
  LocalPurchase,
  LocalRecipe,
  LocalReturn,
  LocalSalesOrder,
  LocalServiceOrder,
  LocalShift,
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

async function resolveSyncContext() {
  const tenantId = requireActiveTenantId()
  const branchSetting = await localDb.settings
    .where('tenantId')
    .equals(tenantId)
    .filter((item) => item.setting === 'default_branch_id')
    .first()

  const branchId = branchSetting?.value || (tenantId === DEMO_TENANT_ID ? baimRuntime.branchId : undefined)

  return { tenantId, branchId }
}

async function applyPullItem(item: SyncPullItem, tenantId: string) {
  if (item.mutationType === 'delete') {
    if (item.entityType === 'product') await localDb.products.delete(item.entityId)
    else if (item.entityType === 'sale') await localDb.salesOrders.delete(item.entityId)
    else if (item.entityType === 'payment') await localDb.payments.delete(item.entityId)
    else if (item.entityType === 'stock_movement') await localDb.stockMovements.delete(item.entityId)
    else if (item.entityType === 'customer') await localDb.customers.delete(item.entityId)
    else if (item.entityType === 'cash') await localDb.cash.delete(item.entityId)
    else if (item.entityType === 'product_category') await localDb.productCategories.delete(item.entityId)
    else if (item.entityType === 'cash_category') await localDb.cashCategories.delete(item.entityId)
    else if (item.entityType === 'setting') await localDb.settings.delete(item.entityId)
    else if (item.entityType === 'shift') await localDb.shifts.delete(item.entityId)
    else if (item.entityType === 'supplier') await localDb.suppliers.delete(item.entityId)
    else if (item.entityType === 'purchase') await localDb.purchases.delete(item.entityId)
    else if (item.entityType === 'return') await localDb.returns.delete(item.entityId)
    else if (item.entityType === 'service_order') await localDb.serviceOrders.delete(item.entityId)
    else if (item.entityType === 'payment_method') await localDb.paymentMethods.delete(item.entityId)
    else if (item.entityType === 'recipe') await localDb.recipes.delete(item.entityId)
    return
  }

  const payload = item.payload
  if (!isRecord(payload)) return

  if (item.entityType === 'product') {
    const product: LocalProduct = {
      id: item.entityId,
      tenantId,
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
      tenantId,
      code: typeof payload.orderNumber === 'string' ? payload.orderNumber : typeof payload.code === 'string' ? payload.code : '',
      customerId: typeof payload.customerId === 'string' ? payload.customerId : undefined,
      customerName: typeof payload.customerName === 'string' ? payload.customerName : 'Umum',
      date: typeof payload.date === 'string' ? payload.date : '',
      subtotal: Number(payload.subtotal ?? 0),
      discountTotal: Number(payload.discountTotal ?? 0),
      taxTotal: Number(payload.taxTotal ?? 0),
      grandTotal: Number(payload.grandTotal ?? 0),
      paidTotal: Number(payload.paidTotal ?? 0),
      notes: typeof payload.notes === 'string' ? payload.notes : undefined,
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
      tenantId,
      ref: typeof payload.paymentNumber === 'string' ? payload.paymentNumber : typeof payload.ref === 'string' ? payload.ref : '',
      salesOrderId: typeof payload.salesOrderId === 'string' ? payload.salesOrderId : undefined,
      serviceOrderId: typeof payload.serviceOrderId === 'string' ? payload.serviceOrderId : undefined,
      purchaseId: typeof payload.purchaseId === 'string' ? payload.purchaseId : undefined,
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
      tenantId,
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
      tenantId,
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
      tenantId,
      ref: typeof payload.ref === 'string' ? payload.ref : '',
      date: typeof payload.date === 'string' ? payload.date : '',
      account: typeof payload.account === 'string' ? payload.account : '',
      category: typeof payload.category === 'string' ? payload.category : '',
      income: Number(payload.income ?? 0),
      expense: Number(payload.expense ?? 0),
      status: typeof payload.status === 'string' ? payload.status : 'Tercatat',
    })
  } else if (item.entityType === 'product_category') {
    await localDb.productCategories.put({
      id: item.entityId,
      tenantId,
      name: typeof payload.name === 'string' ? payload.name : '',
      description: typeof payload.description === 'string' ? payload.description : undefined,
      status: (typeof payload.status === 'string' ? payload.status : 'Aktif') as 'Aktif' | 'Arsip',
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    })
  } else if (item.entityType === 'cash_category') {
    await localDb.cashCategories.put({
      id: item.entityId,
      tenantId,
      name: typeof payload.name === 'string' ? payload.name : '',
      type: (typeof payload.type === 'string' ? payload.type : 'Pemasukan') as LocalCashCategory['type'],
      status: (typeof payload.status === 'string' ? payload.status : 'Aktif') as LocalCashCategory['status'],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    })
  } else if (item.entityType === 'setting') {
    await localDb.settings.put({
      id: typeof payload.key === 'string' ? payload.key : item.entityId,
      tenantId,
      area: typeof payload.area === 'string' ? payload.area : 'general',
      setting: typeof payload.key === 'string' ? payload.key : '',
      value: typeof payload.value === 'string' ? payload.value : '',
      updatedAt: item.updatedAt,
      status: typeof payload.status === 'string' ? payload.status : 'active',
    })
  } else if (item.entityType === 'shift') {
    await localDb.shifts.put({
      id: item.entityId,
      tenantId,
      cashierName: typeof payload.cashierName === 'string' ? payload.cashierName : '',
      startTime: typeof payload.startTime === 'string' ? payload.startTime : '',
      endTime: typeof payload.endTime === 'string' ? payload.endTime : undefined,
      startCash: Number(payload.startCash ?? 0),
      expectedCash: typeof payload.expectedCash === 'number' ? payload.expectedCash : undefined,
      actualCash: typeof payload.actualCash === 'number' ? payload.actualCash : undefined,
      difference: typeof payload.difference === 'number' ? payload.difference : undefined,
      status: (typeof payload.status === 'string' ? payload.status : 'open') as LocalShift['status'],
    })
  } else if (item.entityType === 'supplier') {
    await localDb.suppliers.put({
      id: item.entityId,
      tenantId,
      name: typeof payload.name === 'string' ? payload.name : '',
      phone: typeof payload.phone === 'string' ? payload.phone : '',
      city: typeof payload.city === 'string' ? payload.city : '',
      payable: Number(payload.payable ?? 0),
      orders: Number(payload.orders ?? 0),
      status: typeof payload.status === 'string' ? payload.status : 'Aktif',
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    })
  } else if (item.entityType === 'purchase') {
    await localDb.purchases.put({
      id: item.entityId,
      tenantId,
      code: typeof payload.code === 'string' ? payload.code : '',
      supplierId: typeof payload.supplierId === 'string' ? payload.supplierId : undefined,
      supplierName: typeof payload.supplierName === 'string' ? payload.supplierName : '',
      date: typeof payload.date === 'string' ? payload.date : '',
      subtotal: Number(payload.subtotal ?? 0),
      grandTotal: Number(payload.grandTotal ?? 0),
      paidTotal: Number(payload.paidTotal ?? 0),
      status: (typeof payload.status === 'string' ? payload.status : 'Draft') as LocalPurchase['status'],
      items: [],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    })
  } else if (item.entityType === 'return') {
    await localDb.returns.put({
      id: item.entityId,
      tenantId,
      code: typeof payload.code === 'string' ? payload.code : '',
      type: (typeof payload.type === 'string' ? payload.type : 'Penjualan') as LocalReturn['type'],
      referenceCode: typeof payload.referenceCode === 'string' ? payload.referenceCode : '',
      date: typeof payload.date === 'string' ? payload.date : '',
      total: Number(payload.total ?? 0),
      status: (typeof payload.status === 'string' ? payload.status : 'Draft') as LocalReturn['status'],
      items: [],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    })
    } else if (item.entityType === 'service_order') {
      await localDb.serviceOrders.put({
        id: item.entityId,
        tenantId,
        code: typeof payload.code === 'string' ? payload.code : '',
        customerId: typeof payload.customerId === 'string' ? payload.customerId : undefined,
        customerName: typeof payload.customerName === 'string' ? payload.customerName : '',
        description: typeof payload.description === 'string' ? payload.description : '',
        date: typeof payload.date === 'string' ? payload.date : '',
        cost: Number(payload.cost ?? 0),
        paidTotal: Number(payload.paidTotal ?? 0),
        status: (typeof payload.status === 'string' ? payload.status : 'Diterima') as LocalServiceOrder['status'],
        syncStatus: 'synced',
        version: typeof payload.version === 'number' ? payload.version : 1,
        updatedAt: item.updatedAt,
      })
    } else if (item.entityType === 'payment_method') {
      await localDb.paymentMethods.put({
        id: item.entityId,
        tenantId,
        name: typeof payload.name === 'string' ? payload.name : '',
        provider: typeof payload.provider === 'string' ? payload.provider : '',
        type: typeof payload.type === 'string' ? payload.type : '',
        accountNumber: typeof payload.accountNumber === 'string' ? payload.accountNumber : undefined,
        accountName: typeof payload.accountName === 'string' ? payload.accountName : undefined,
        status: (typeof payload.status === 'string' ? payload.status : 'Aktif') as LocalPaymentMethod['status'],
        updatedAt: item.updatedAt,
      })
    } else if (item.entityType === 'recipe') {
      await localDb.recipes.put({
        id: item.entityId,
        tenantId,
        productId: typeof payload.productId === 'string' ? payload.productId : '',
        productName: typeof payload.productName === 'string' ? payload.productName : '',
        name: typeof payload.name === 'string' ? payload.name : '',
        batchYield: Number(payload.batchYield ?? 1),
        items: Array.isArray(payload.items) ? payload.items : [],
        status: (typeof payload.status === 'string' ? payload.status : 'Draft') as LocalRecipe['status'],
        updatedAt: item.updatedAt,
      })
    }
  }

export async function applyPullItems(items: SyncPullItem[], tenantId: string) {
  await localDb.transaction(
    'rw',
    [
      'products', 'customers', 'salesOrders', 'payments',
      'stockMovements', 'cash', 'productCategories', 'cashCategories',
      'settings', 'shifts', 'suppliers', 'purchases',
      'returns', 'serviceOrders', 'paymentMethods', 'recipes',
    ],
    async () => {
      for (const item of items) {
        await applyPullItem(item, tenantId)
      }
    },
  )
}

export async function runSync() {
  const syncContext = await resolveSyncContext()
  const tenantId = syncContext.tenantId
  const runId = createId('run')
  const startedAt = new Date().toISOString()

  await localDb.syncRuns.put({
    id: runId,
    tenantId,
    startedAt,
    status: 'running',
    processed: 0,
    failed: 0,
  })

  const items = await listOutboxItems()
  const pendingItems = items.filter((item) => item.status === 'queued' || item.status === 'failed' || item.status === 'syncing')
  const { accepted, rejected } = partitionSyncMutations(pendingItems)
  let processed = 0
  let failed = rejected.length

  for (const rejection of rejected) {
    await updateOutboxStatus(rejection.item.id, 'failed', rejection.message)
  }

  if (accepted.length === 0) {
    const pullResponse = await apiGet<SyncPullResponse>('/sync/pull', buildTenantQuery(syncContext)).catch(() => ({ ok: true as const, cursor: null, items: [] }))
    await applyPullItems(pullResponse.items, tenantId)

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

  let pushResponse!: SyncPushResponse
  try {
    pushResponse = await apiPost<SyncPushResponse>('/sync/push', {
      ...syncContext,
      deviceId: 'web-client',
      mutations: accepted.map((item) => ({
        clientMutationId: item.id,
        entityType: item.entityType,
        entityId: item.entityId,
        mutationType: item.mutationType,
        payload: item.payload,
        status: item.status,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal terhubung ke server'
    failed += accepted.length
    for (const item of accepted) {
      await updateOutboxStatus(item.id, 'failed', message)
    }
    await localDb.syncRuns.update(runId, {
      finishedAt: new Date().toISOString(),
      status: 'failed',
      processed,
      failed,
      pulled: 0,
    })
    return { processed, failed, pulled: 0 }
  }

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

  const pullResponse = await apiGet<SyncPullResponse>('/sync/pull', buildTenantQuery(syncContext)).catch(() => ({ ok: true as const, cursor: null, items: [] }))
  await applyPullItems(pullResponse.items, tenantId)

  await localDb.syncRuns.update(runId, {
    finishedAt: new Date().toISOString(),
    status: failed > 0 ? 'failed' : 'success',
    processed,
    failed,
    pulled: pullResponse.items.length,
  })

  return { processed, failed, pulled: pullResponse.items.length }
}
