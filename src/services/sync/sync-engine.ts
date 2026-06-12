import { toDateInput } from '@/lib/date'
import { localDb } from '@/services/local-db/client'
import { DEMO_TENANT_ID } from '@/services/local-db/seeds'
import { baimRuntime } from '@/lib/baim-runtime'
import { apiGet, apiPost, buildTenantQuery } from '@/services/api/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { listOutboxItems, updateOutboxStatus } from '@/services/sync/outbox-service'
import { extractEntityId, indexPushResults, partitionSyncMutations, toLocalOutboxStatus } from '@/services/sync/sync-transport'
import type {
  LocalCashCategory,
  LocalPayment,
  LocalPaymentMethod,
  LocalProduct,
  LocalProductionBatch,
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

const SERVER_TO_LOCAL_SALE_STATUS: Record<string, LocalSalesOrder['status']> = {
  draft: 'Draft',
  paid: 'Lunas',
  partial: 'Sebagian',
  unpaid: 'Belum Bayar',
  cancelled: 'Batal',
}

const SERVER_TO_LOCAL_PAYMENT_STATUS: Record<string, LocalPayment['status']> = {
  success: 'Berhasil',
  pending: 'Pending',
  failed: 'Gagal',
  refunded: 'Refund',
}

const SERVER_TO_LOCAL_SERVICE_STATUS: Record<string, LocalServiceOrder['status']> = {
  received: 'Diterima',
  in_progress: 'Dikerjakan',
  completed: 'Selesai',
  picked_up: 'Diambil',
  cancelled: 'Batal',
}

const LEGACY_COMPANY_SETTING_KEYS: Record<string, string> = {
  'Ikon Usaha': 'company-icon',
  'Logo Perusahaan': 'company-logo',
  'Nama Usaha': 'company-name',
  'Nomor Telepon': 'company-phone',
  'Alamat Usaha': 'company-address',
  'NPWP / NIB': 'company-tax-number',
}

function normalizeSettingKey(key: string, area: string) {
  if (area === 'Profil Usaha') return LEGACY_COMPANY_SETTING_KEYS[key] ?? key
  return key
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
  let branchSetting = await localDb.settings
    .where('tenantId')
    .equals(tenantId)
    .filter((item) => item.setting === 'default_branch_id')
    .first()

  let branchId = branchSetting?.value

  if (!branchId && tenantId === DEMO_TENANT_ID) {
    branchId = baimRuntime.branchId
  }

  if (!branchId) {
    try {
      const res = await apiGet<{ ok: true; id: string; name: string }>('/tenants/default-branch', new URLSearchParams({ tenantId }))
      if (res.ok) {
        branchId = res.id
        const newSetting = {
          id: `${tenantId}:default-branch-id`,
          tenantId,
          area: 'System',
          setting: 'default_branch_id',
          value: branchId,
          status: 'Lengkap',
          updatedAt: new Date().toISOString(),
        }
        await localDb.settings.put(newSetting)
        branchSetting = newSetting
      }
    } catch {
      // API tidak tersedia — branchId tetap undefined
    }
  }

  return { tenantId, branchId }
}

async function applyPullItem(item: SyncPullItem, tenantId: string) {
  if (item.mutationType === 'delete') {
    if (item.entityType === 'product') await localDb.products.delete(item.entityId)
    else if (item.entityType === 'sale') {
      await localDb.salesOrders.delete(item.entityId)
      await localDb.salesOrderItems.where('salesOrderId').equals(item.entityId).delete()
    }
    else if (item.entityType === 'payment') await localDb.payments.delete(item.entityId)
    else if (item.entityType === 'stock_movement') await localDb.stockMovements.delete(item.entityId)
    else if (item.entityType === 'customer') await localDb.customers.delete(item.entityId)
    else if (item.entityType === 'cash') await localDb.cash.delete(item.entityId)
    else if (item.entityType === 'product_category') await localDb.productCategories.delete(item.entityId)
    else if (item.entityType === 'cash_category') await localDb.cashCategories.delete(item.entityId)
    else if (item.entityType === 'setting') await localDb.settings.delete(item.entityId)
    else if (item.entityType === 'shift') await localDb.shifts.delete(item.entityId)
    else if (item.entityType === 'supplier') await localDb.suppliers.delete(item.entityId)
    else if (item.entityType === 'purchase') {
      await localDb.purchases.delete(item.entityId)
      await localDb.purchaseItems.where('purchaseId').equals(item.entityId).delete()
    }
    else if (item.entityType === 'return') {
      await localDb.returns.delete(item.entityId)
      await localDb.returnItems.where('returnId').equals(item.entityId).delete()
    }
    else if (item.entityType === 'service_order') await localDb.serviceOrders.delete(item.entityId)
    else if (item.entityType === 'payment_method') await localDb.paymentMethods.delete(item.entityId)
    else if (item.entityType === 'recipe') await localDb.recipes.delete(item.entityId)
    else if (item.entityType === 'production_batch') await localDb.productionBatches.delete(item.entityId)
    return
  }

  const payload = item.payload
  if (!isRecord(payload)) return

  if (item.entityType === 'product') {
    const existing = await localDb.products.get(item.entityId)
    const product: LocalProduct = {
      id: item.entityId,
      tenantId,
      name: typeof payload.name === 'string' ? payload.name : existing?.name ?? '',
      category: typeof payload.category === 'string' ? payload.category : existing?.category ?? '',
      type: payload.type === 'Jasa' ? 'Jasa' : existing?.type ?? 'Produk Fisik',
      price: typeof payload.salePrice === 'number' ? payload.salePrice : typeof payload.price === 'number' ? payload.price : existing?.price ?? 0,
      costPrice: typeof payload.costPrice === 'number' ? payload.costPrice : existing?.costPrice,
      wholesalePrice: typeof payload.wholesalePrice === 'number' ? payload.wholesalePrice : existing?.wholesalePrice,
      wholesaleTiers: existing?.wholesaleTiers,
      stock: existing?.stock ?? 0,
      manageStock: existing?.manageStock,
      sku: typeof payload.sku === 'string' ? payload.sku : existing?.sku,
      barcode: typeof payload.barcode === 'string' ? payload.barcode : existing?.barcode,
      imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl : existing?.imageUrl,
      icon: existing?.icon,
      status: payload.isActive === false ? 'Arsip' : existing?.status ?? 'Aktif',
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.products.put(product)
  } else if (item.entityType === 'sale') {
    const existing = await localDb.salesOrders.get(item.entityId)
    const rawStatus = typeof payload.status === 'string' ? payload.status : ''
    const order: LocalSalesOrder = {
      id: item.entityId,
      tenantId,
      code: typeof payload.orderNumber === 'string' ? payload.orderNumber : typeof payload.code === 'string' ? payload.code : '',
      customerId: typeof payload.customerId === 'string' ? payload.customerId : existing?.customerId,
      customerName: typeof payload.customerName === 'string' ? payload.customerName : existing?.customerName ?? 'Umum',
      date: typeof payload.date === 'string' ? toDateInput(payload.date) : existing?.date ?? '',
      subtotal: Number(payload.subtotal ?? 0),
      discountTotal: Number(payload.discountTotal ?? 0),
      taxTotal: Number(payload.taxTotal ?? 0),
      grandTotal: Number(payload.grandTotal ?? 0),
      paidTotal: Number(payload.paidTotal ?? 0),
      notes: typeof payload.notes === 'string' ? payload.notes : existing?.notes,
      status: SERVER_TO_LOCAL_SALE_STATUS[rawStatus] ?? existing?.status ?? 'Draft',
      items: Array.isArray(payload.items) ? payload.items.map((rawItem) => {
        const itemPayload = isRecord(rawItem) ? rawItem : {}
        return {
          id: typeof itemPayload.id === 'string' ? itemPayload.id : createId('sale-item'),
          tenantId,
          salesOrderId: item.entityId,
          productId: typeof itemPayload.productId === 'string' ? itemPayload.productId : '',
          name: typeof itemPayload.name === 'string' ? itemPayload.name : '',
          qty: Number(itemPayload.qty ?? 0),
          unitPrice: Number(itemPayload.unitPrice ?? 0),
          subtotal: Number(itemPayload.subtotal ?? 0),
        }
      }) : existing?.items ?? [],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.salesOrders.put(order)
    if (Array.isArray(payload.items)) {
      await localDb.salesOrderItems.where('salesOrderId').equals(item.entityId).delete()
      await localDb.salesOrderItems.bulkPut(order.items)
    }
  } else if (item.entityType === 'payment') {
    const salesOrderId = typeof payload.salesOrderId === 'string' ? payload.salesOrderId : undefined
    const serviceOrderId = typeof payload.serviceOrderId === 'string' ? payload.serviceOrderId : undefined
    const purchaseId = typeof payload.purchaseId === 'string' ? payload.purchaseId : undefined
    const existingPayment = await localDb.payments.get(item.entityId)
      ?? (salesOrderId ? await localDb.payments.where('[tenantId+salesOrderId]').equals([tenantId, salesOrderId]).first() : undefined)
      ?? (serviceOrderId ? await localDb.payments.where('[tenantId+serviceOrderId]').equals([tenantId, serviceOrderId]).first() : undefined)
      ?? (purchaseId ? await localDb.payments.where('[tenantId+purchaseId]').equals([tenantId, purchaseId]).first() : undefined)
    const paymentId = existingPayment?.id ?? item.entityId
    const rawStatus = typeof payload.status === 'string' ? payload.status : ''
    const payment: LocalPayment = {
      id: paymentId,
      tenantId,
      ref: typeof payload.paymentNumber === 'string' ? payload.paymentNumber : typeof payload.ref === 'string' ? payload.ref : existingPayment?.ref ?? '',
      salesOrderId,
      serviceOrderId: typeof payload.serviceOrderId === 'string' ? payload.serviceOrderId : existingPayment?.serviceOrderId,
      purchaseId: typeof payload.purchaseId === 'string' ? payload.purchaseId : existingPayment?.purchaseId,
      source: typeof payload.source === 'string' ? payload.source : existingPayment?.source ?? 'cloud',
      method: normalizePaymentMethod(payload.method),
      amount: Number(payload.amount ?? 0),
      date: typeof payload.date === 'string' ? toDateInput(payload.date) : existingPayment?.date ?? '',
      status: SERVER_TO_LOCAL_PAYMENT_STATUS[rawStatus] ?? existingPayment?.status ?? 'Pending',
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.payments.put(payment)
  } else if (item.entityType === 'stock_movement') {
    const productId = typeof payload.productId === 'string' ? payload.productId : ''
    const qty = Number(payload.qty ?? 0)
    const movement: LocalStockMovement = {
      id: item.entityId,
      tenantId,
      productId,
      productName: typeof payload.productName === 'string' ? payload.productName : '',
      warehouseId: typeof payload.warehouseId === 'string' ? payload.warehouseId : undefined,
      warehouseName: typeof payload.warehouseName === 'string' ? payload.warehouseName : '',
      type: (typeof payload.type === 'string' ? payload.type : 'adjustment') as LocalStockMovement['type'],
      qty,
      referenceType: typeof payload.referenceType === 'string' ? payload.referenceType : undefined,
      referenceId: typeof payload.referenceId === 'string' ? payload.referenceId : undefined,
      notes: typeof payload.notes === 'string' ? payload.notes : undefined,
      syncStatus: 'synced',
      updatedAt: item.updatedAt,
    }

    const existingMovement = await localDb.stockMovements.get(item.entityId)
    await localDb.stockMovements.put(movement)

    if (!existingMovement && productId) {
      const product = await localDb.products.get(productId)
      if (product && product.manageStock !== false) {
        product.stock = Math.max(0, (product.stock ?? 0) + qty)
        product.updatedAt = item.updatedAt
        product.syncStatus = 'synced'
        await localDb.products.put(product)
      }
    }
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
      date: typeof payload.date === 'string' ? toDateInput(payload.date) : '',
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
    const area = typeof payload.area === 'string' ? payload.area : 'general'
    const rawKey = typeof payload.key === 'string' ? payload.key : typeof payload.id === 'string' ? payload.id : item.entityId
    const normalizedKey = normalizeSettingKey(rawKey, area)
    await localDb.settings.put({
      id: normalizedKey,
      tenantId,
      area,
      setting: typeof payload.setting === 'string' ? payload.setting : rawKey,
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
    const purchase: LocalPurchase = {
      id: item.entityId,
      tenantId,
      code: typeof payload.code === 'string' ? payload.code : '',
      supplierId: typeof payload.supplierId === 'string' ? payload.supplierId : undefined,
      supplierName: typeof payload.supplierName === 'string' ? payload.supplierName : '',
      date: typeof payload.date === 'string' ? toDateInput(payload.date) : '',
      subtotal: Number(payload.subtotal ?? 0),
      grandTotal: Number(payload.grandTotal ?? 0),
      paidTotal: Number(payload.paidTotal ?? 0),
      status: (typeof payload.status === 'string' ? payload.status : 'Draft') as LocalPurchase['status'],
      items: Array.isArray(payload.items) ? payload.items : [],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.purchases.put(purchase)
    if (Array.isArray(payload.items)) {
      await localDb.purchaseItems.where('purchaseId').equals(item.entityId).delete()
      await localDb.purchaseItems.bulkPut(payload.items)
    }
  } else if (item.entityType === 'return') {
    const ret: LocalReturn = {
      id: item.entityId,
      tenantId,
      code: typeof payload.code === 'string' ? payload.code : '',
      type: (typeof payload.type === 'string' ? payload.type : 'Penjualan') as LocalReturn['type'],
      referenceCode: typeof payload.referenceCode === 'string' ? payload.referenceCode : '',
      date: typeof payload.date === 'string' ? toDateInput(payload.date) : '',
      total: Number(payload.total ?? 0),
      status: (typeof payload.status === 'string' ? payload.status : 'Draft') as LocalReturn['status'],
      items: Array.isArray(payload.items) ? payload.items : [],
      syncStatus: 'synced',
      version: typeof payload.version === 'number' ? payload.version : 1,
      updatedAt: item.updatedAt,
    }
    await localDb.returns.put(ret)
    if (Array.isArray(payload.items)) {
      await localDb.returnItems.where('returnId').equals(item.entityId).delete()
      await localDb.returnItems.bulkPut(payload.items)
    }
    } else if (item.entityType === 'service_order') {
      const existingSo = await localDb.serviceOrders.get(item.entityId)
      const rawStatus = typeof payload.status === 'string' ? payload.status : ''
      await localDb.serviceOrders.put({
        id: item.entityId,
        tenantId,
        code: typeof payload.code === 'string' ? payload.code : existingSo?.code ?? '',
        customerId: typeof payload.customerId === 'string' ? payload.customerId : existingSo?.customerId,
        customerName: typeof payload.customerName === 'string' ? payload.customerName : existingSo?.customerName ?? 'Umum',
        description: typeof payload.description === 'string' ? payload.description : existingSo?.description ?? '',
        date: typeof payload.date === 'string' ? toDateInput(payload.date) : existingSo?.date ?? '',
        cost: Number(payload.cost ?? existingSo?.cost ?? 0),
        paidTotal: Number(payload.paidTotal ?? existingSo?.paidTotal ?? 0),
        status: SERVER_TO_LOCAL_SERVICE_STATUS[rawStatus] ?? existingSo?.status ?? 'Diterima',
        items: Array.isArray(payload.items) ? payload.items.map((rawItem) => {
          const itemPayload = isRecord(rawItem) ? rawItem : {}
          return {
            productId: typeof itemPayload.productId === 'string' ? itemPayload.productId : '',
            name: typeof itemPayload.name === 'string' ? itemPayload.name : '',
            qty: Number(itemPayload.qty ?? 0),
            price: Number(itemPayload.price ?? itemPayload.unitPrice ?? 0),
            subtotal: Number(itemPayload.subtotal ?? 0),
          }
        }) : existingSo?.items,
        notes: typeof payload.notes === 'string' ? payload.notes : existingSo?.notes,
        timeline: Array.isArray(payload.timeline) ? payload.timeline.map((rawItem) => {
          const itemPayload = isRecord(rawItem) ? rawItem : {}
          return {
            id: typeof itemPayload.id === 'string' ? itemPayload.id : crypto.randomUUID(),
            status: typeof itemPayload.status === 'string' ? itemPayload.status : '',
            date: typeof itemPayload.date === 'string' ? itemPayload.date : item.updatedAt,
            note: typeof itemPayload.note === 'string' ? itemPayload.note : '',
            type: (typeof itemPayload.type === 'string' ? itemPayload.type : undefined) as 'status' | 'warranty' | undefined,
          }
        }) : existingSo?.timeline,
        hasWarranty: existingSo?.hasWarranty,
        warrantyValue: existingSo?.warrantyValue,
        warrantyUnit: existingSo?.warrantyUnit,
        warrantyStartDate: existingSo?.warrantyStartDate,
        warrantyEndDate: existingSo?.warrantyEndDate,
        estimatedCompletion: typeof payload.estimatedCompletion === 'string' ? payload.estimatedCompletion : existingSo?.estimatedCompletion,
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
    } else if (item.entityType === 'production_batch') {
      const existingPb = await localDb.productionBatches.get(item.entityId)
      const batch: LocalProductionBatch = {
        id: item.entityId,
        tenantId,
        recipeId: typeof payload.recipeId === 'string' ? payload.recipeId : existingPb?.recipeId ?? '',
        recipeName: typeof payload.recipeName === 'string' ? payload.recipeName : existingPb?.recipeName ?? '',
        productId: typeof payload.productId === 'string' ? payload.productId : existingPb?.productId ?? '',
        productName: typeof payload.productName === 'string' ? payload.productName : existingPb?.productName ?? '',
        batchQty: Number(payload.batchQty ?? existingPb?.batchQty ?? 1),
        date: typeof payload.date === 'string' ? toDateInput(payload.date) : existingPb?.date ?? new Date().toISOString().slice(0, 10),
        syncStatus: 'synced',
        version: typeof payload.version === 'number' ? payload.version : 1,
        updatedAt: item.updatedAt,
      }
      await localDb.productionBatches.put(batch)
    }
  }

export async function applyPullItems(items: SyncPullItem[], tenantId: string) {
  const issues: string[] = []

  const sortedItems = [...items].sort((a, b) => (a.updatedAt > b.updatedAt ? 1 : -1))

  await localDb.transaction(
    'rw',
    [
      localDb.products, localDb.customers, localDb.salesOrders, localDb.salesOrderItems, localDb.payments,
      localDb.stockMovements, localDb.cash, localDb.productCategories, localDb.cashCategories,
      localDb.settings, localDb.shifts, localDb.suppliers, localDb.purchases, localDb.purchaseItems,
      localDb.returns, localDb.returnItems, localDb.serviceOrders, localDb.paymentMethods, localDb.recipes,
      localDb.productionBatches,
    ],
    async () => {
      for (const item of sortedItems) {
        await applyPullItem(item, tenantId)

        if (item.entityType === 'sale') {
          const payload = isRecord(item.payload) ? item.payload : null
          if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
            issues.push(`sale:${item.entityId}:missing-items`)
          }
          if (!payload || typeof payload.date !== 'string' || payload.date.length === 0) {
            issues.push(`sale:${item.entityId}:missing-date`)
          }
        }

        if (item.entityType === 'payment') {
          const payload = isRecord(item.payload) ? item.payload : null
          if (!payload || typeof payload.date !== 'string' || payload.date.length === 0) {
            issues.push(`payment:${item.entityId}:missing-date`)
          }
        }
      }
    },
  )

  return issues
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
    const pullIssues = await applyPullItems(pullResponse.items, tenantId)

    await localDb.syncRuns.update(runId, {
      finishedAt: new Date().toISOString(),
      status: failed > 0 ? 'failed' : 'success',
      processed,
      failed,
      pulled: pullResponse.items.length,
      pullSummary: pullIssues.length > 0 ? pullIssues.join(', ') : undefined,
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
        entityId: extractEntityId(item.entityId),
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
    const result = indexedResults.get(`${item.entityType}:${extractEntityId(item.entityId)}:${item.mutationType}`)

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
  const pullIssues = await applyPullItems(pullResponse.items, tenantId)

  await localDb.syncRuns.update(runId, {
    finishedAt: new Date().toISOString(),
    status: failed > 0 ? 'failed' : 'success',
    processed,
    failed,
    pulled: pullResponse.items.length,
    pullSummary: pullIssues.length > 0 ? pullIssues.join(', ') : undefined,
  })

  return { processed, failed, pulled: pullResponse.items.length }
}
