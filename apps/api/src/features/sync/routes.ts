import { and, desc, eq, gte, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import { authMiddleware } from '../auth/middleware.js'
import {
  buildSyncPushResponse,
  serverSyncStatusToApiItemStatus,
  parseSyncPullQuery,
  parseSyncPushBody,
  type SyncPullItem,
  type SyncPushItemResult,
} from '../../lib/contracts.js'
import { applyMutation } from './apply.js'
import {
  cash,
  cashCategories,
  customers,
  outboxLogs,
  paymentMethods,
  payments,
  productCategories,
  products,
  purchases,
  recipes,
  returns,
  salesOrders,
  serviceOrders,
  settings,
  shifts,
  stockMovements,
  suppliers,
} from '../../../../../src/db/schema/index.js'

export const syncRoutes = new Hono()

syncRoutes.use('*', authMiddleware)

syncRoutes.get('/pull', async (c) => {
  const parsed = parseSyncPullQuery({
    tenantId: c.req.query('tenantId'),
    branchId: c.req.query('branchId'),
    since: c.req.query('since'),
  })

  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400)
  }

  const branchFilter = parsed.value.branchId ? eq(products.branchId, parsed.value.branchId) : undefined
  const sinceFilter = parsed.value.since ? gte(products.updatedAt, parsed.value.since) : undefined

  const productRows = await db.query.products.findMany({
    where: and(eq(products.tenantId, parsed.value.tenantId), isNull(products.deletedAt), branchFilter, sinceFilter),
    orderBy: [desc(products.updatedAt)],
    limit: 100,
  })

  const saleBranchFilter = parsed.value.branchId ? eq(salesOrders.branchId, parsed.value.branchId) : undefined
  const saleSinceFilter = parsed.value.since ? gte(salesOrders.updatedAt, parsed.value.since) : undefined
  const saleRows = await db.query.salesOrders.findMany({
    where: and(eq(salesOrders.tenantId, parsed.value.tenantId), isNull(salesOrders.deletedAt), saleBranchFilter, saleSinceFilter),
    orderBy: [desc(salesOrders.updatedAt)],
    limit: 100,
  })

  const paymentBranchFilter = parsed.value.branchId ? eq(payments.branchId, parsed.value.branchId) : undefined
  const paymentSinceFilter = parsed.value.since ? gte(payments.updatedAt, parsed.value.since) : undefined
  const paymentRows = await db.query.payments.findMany({
    where: and(eq(payments.tenantId, parsed.value.tenantId), isNull(payments.deletedAt), paymentBranchFilter, paymentSinceFilter),
    orderBy: [desc(payments.updatedAt)],
    limit: 100,
  })

  const stockBranchFilter = parsed.value.branchId ? eq(stockMovements.branchId, parsed.value.branchId) : undefined
  const stockSinceFilter = parsed.value.since ? gte(stockMovements.updatedAt, parsed.value.since) : undefined
  const stockRows = await db.query.stockMovements.findMany({
    where: and(eq(stockMovements.tenantId, parsed.value.tenantId), isNull(stockMovements.deletedAt), stockBranchFilter, stockSinceFilter),
    orderBy: [desc(stockMovements.updatedAt)],
    limit: 100,
  })

  const customerSinceFilter = parsed.value.since ? gte(customers.updatedAt, parsed.value.since) : undefined
  const customerRows = await db.query.customers.findMany({
    where: and(eq(customers.tenantId, parsed.value.tenantId), isNull(customers.deletedAt), customerSinceFilter),
    orderBy: [desc(customers.updatedAt)],
    limit: 100,
  })

  const categoriesSinceFilter = parsed.value.since ? gte(productCategories.updatedAt, parsed.value.since) : undefined
  const categoryRows = await db.query.productCategories.findMany({
    where: and(eq(productCategories.tenantId, parsed.value.tenantId), isNull(productCategories.deletedAt), categoriesSinceFilter),
    orderBy: [desc(productCategories.updatedAt)],
    limit: 100,
  })

  const cashCategoriesSinceFilter = parsed.value.since ? gte(cashCategories.updatedAt, parsed.value.since) : undefined
  const cashCategoryRows = await db.query.cashCategories.findMany({
    where: and(eq(cashCategories.tenantId, parsed.value.tenantId), isNull(cashCategories.deletedAt), cashCategoriesSinceFilter),
    orderBy: [desc(cashCategories.updatedAt)],
    limit: 100,
  })

  const cashBranchFilter = parsed.value.branchId ? eq(cash.branchId, parsed.value.branchId) : undefined
  const cashSinceFilter = parsed.value.since ? gte(cash.updatedAt, parsed.value.since) : undefined
  const cashRows = await db.query.cash.findMany({
    where: and(eq(cash.tenantId, parsed.value.tenantId), cashBranchFilter, cashSinceFilter),
    orderBy: [desc(cash.updatedAt)],
    limit: 100,
  })

  const settingsSinceFilter = parsed.value.since ? gte(settings.updatedAt, parsed.value.since) : undefined
  const settingRows = await db.query.settings.findMany({
    where: and(eq(settings.tenantId, parsed.value.tenantId), settingsSinceFilter),
    orderBy: [desc(settings.updatedAt)],
    limit: 100,
  })

  const shiftsBranchFilter = parsed.value.branchId ? eq(shifts.branchId, parsed.value.branchId) : undefined
  const shiftsSinceFilter = parsed.value.since ? gte(shifts.updatedAt, parsed.value.since) : undefined
  const shiftRows = await db.query.shifts.findMany({
    where: and(eq(shifts.tenantId, parsed.value.tenantId), shiftsBranchFilter, shiftsSinceFilter),
    orderBy: [desc(shifts.updatedAt)],
    limit: 100,
  })

  const supplierSinceFilter = parsed.value.since ? gte(suppliers.updatedAt, parsed.value.since) : undefined
  const supplierRows = await db.query.suppliers.findMany({
    where: and(eq(suppliers.tenantId, parsed.value.tenantId), isNull(suppliers.deletedAt), supplierSinceFilter),
    orderBy: [desc(suppliers.updatedAt)],
    limit: 100,
  })

  const purchaseBranchFilter = parsed.value.branchId ? eq(purchases.branchId, parsed.value.branchId) : undefined
  const purchaseSinceFilter = parsed.value.since ? gte(purchases.updatedAt, parsed.value.since) : undefined
  const purchaseRows = await db.query.purchases.findMany({
    where: and(eq(purchases.tenantId, parsed.value.tenantId), purchaseBranchFilter, purchaseSinceFilter),
    orderBy: [desc(purchases.updatedAt)],
    limit: 100,
  })

  const returnBranchFilter = parsed.value.branchId ? eq(returns.branchId, parsed.value.branchId) : undefined
  const returnSinceFilter = parsed.value.since ? gte(returns.updatedAt, parsed.value.since) : undefined
  const returnRows = await db.query.returns.findMany({
    where: and(eq(returns.tenantId, parsed.value.tenantId), returnBranchFilter, returnSinceFilter),
    orderBy: [desc(returns.updatedAt)],
    limit: 100,
  })

  const serviceOrderBranchFilter = parsed.value.branchId ? eq(serviceOrders.branchId, parsed.value.branchId) : undefined
  const serviceOrderSinceFilter = parsed.value.since ? gte(serviceOrders.updatedAt, parsed.value.since) : undefined
  const serviceOrderRows = await db.query.serviceOrders.findMany({
    where: and(eq(serviceOrders.tenantId, parsed.value.tenantId), serviceOrderBranchFilter, serviceOrderSinceFilter),
    orderBy: [desc(serviceOrders.updatedAt)],
    limit: 100,
  })

  const paymentMethodsSinceFilter = parsed.value.since ? gte(paymentMethods.updatedAt, parsed.value.since) : undefined
  const paymentMethodsRows = await db.query.paymentMethods.findMany({
    where: and(eq(paymentMethods.tenantId, parsed.value.tenantId), paymentMethodsSinceFilter),
    orderBy: [desc(paymentMethods.updatedAt)],
    limit: 100,
  })

  const recipeSinceFilter = parsed.value.since ? gte(recipes.updatedAt, parsed.value.since) : undefined
  const recipeRows = await db.query.recipes.findMany({
    where: and(eq(recipes.tenantId, parsed.value.tenantId), recipeSinceFilter),
    orderBy: [desc(recipes.updatedAt)],
    limit: 100,
  })

  const items: SyncPullItem[] = [
    ...productRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'product',
      mutationType: 'update',
      payload: {
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        type: row.type === 'service' ? 'Jasa' : 'Produk Fisik',
        price: Number(row.salePrice),
        salePrice: Number(row.salePrice),
        costPrice: row.costPrice ? Number(row.costPrice) : undefined,
        wholesalePrice: row.wholesalePrice ? Number(row.wholesalePrice) : undefined,
        imageUrl: row.imageUrl,
        status: row.isActive ? 'Aktif' : 'Arsip',
        isActive: row.isActive,
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...saleRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'sale',
      mutationType: 'update',
      payload: {
        id: row.id,
        code: row.orderNumber,
        orderNumber: row.orderNumber,
        customerId: row.customerId,
        status: row.status,
        subtotal: Number(row.subtotal),
        discountTotal: Number(row.discountTotal),
        taxTotal: Number(row.taxTotal),
        grandTotal: Number(row.grandTotal),
        paidTotal: Number(row.paidTotal),
        notes: row.notes,
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...paymentRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'payment',
      mutationType: 'update',
      payload: {
        id: row.id,
        ref: row.paymentNumber,
        paymentNumber: row.paymentNumber,
        salesOrderId: row.salesOrderId,
        serviceOrderId: row.serviceOrderId,
        purchaseId: row.purchaseId,
        source: row.source,
        method: row.method,
        amount: Number(row.amount),
        status: row.status,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...stockRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'stock_movement',
      mutationType: 'update',
      payload: {
        id: row.id,
        productId: row.productId,
        warehouseId: row.warehouseId,
        type: row.type,
        qty: Number(row.qty),
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        notes: row.notes,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...customerRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'customer',
      mutationType: 'update',
      payload: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: null,
        receivable: 0,
        orders: 0,
        status: row.isActive ? 'Aktif' : 'Nonaktif',
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...categoryRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'product_category',
      mutationType: 'update',
      payload: {
        id: row.id,
        name: row.name,
        status: row.isActive ? 'Aktif' : 'Arsip',
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus ?? 'synced'),
      serverSyncStatus: row.syncStatus ?? 'synced',
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...cashCategoryRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'cash_category',
      mutationType: 'update',
      payload: {
        id: row.id,
        name: row.name,
        type: row.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        status: row.isActive ? 'Aktif' : 'Nonaktif',
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...cashRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'cash',
      mutationType: 'update',
      payload: {
        id: row.id,
        ref: row.ref,
        date: row.date.toISOString(),
        account: '',
        category: row.categoryId ?? '',
        income: Number(row.income),
        expense: Number(row.expense),
        status: row.status,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...settingRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'setting',
      mutationType: 'update',
      payload: {
        id: row.key,
        key: row.key,
        area: row.area,
        value: row.value,
        status: row.status,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...shiftRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'shift',
      mutationType: 'update',
      payload: {
        id: row.id,
        cashierName: row.cashierName,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime?.toISOString() ?? null,
        startCash: Number(row.startCash),
        expectedCash: row.expectedCash ? Number(row.expectedCash) : undefined,
        actualCash: row.actualCash ? Number(row.actualCash) : undefined,
        difference: row.difference ? Number(row.difference) : undefined,
        status: row.status,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...supplierRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'supplier',
      mutationType: 'update',
      payload: {
        id: row.id,
        name: row.name,
        phone: row.phone ?? '',
        city: row.city ?? '',
        payable: Number(row.payable),
        orders: row.orders,
        status: row.isActive ? 'Aktif' : 'Nonaktif',
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...purchaseRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'purchase',
      mutationType: 'update',
      payload: {
        id: row.id,
        code: row.code,
        supplierId: row.supplierId,
        date: row.date.toISOString(),
        subtotal: Number(row.subtotal),
        grandTotal: Number(row.grandTotal),
        status: row.status,
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...returnRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'return',
      mutationType: 'update',
      payload: {
        id: row.id,
        code: row.code,
        type: row.type === 'sale' ? 'Penjualan' : 'Pembelian',
        referenceCode: row.referenceCode,
        date: row.date.toISOString(),
        total: Number(row.total),
        status: row.status,
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    ...serviceOrderRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'service_order',
      mutationType: 'update',
      payload: {
        id: row.id,
        code: row.code,
        customerId: row.customerId,
        customerName: row.customerName,
        description: row.description,
        date: row.date.toISOString(),
        cost: Number(row.cost),
        paidTotal: Number(row.paidTotal),
        status: row.status,
        version: row.version,
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),

    ...paymentMethodsRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'payment_method',
      mutationType: 'update',
      payload: {
        id: row.id,
        name: row.name,
        provider: row.provider,
        type: row.type,
        accountNumber: row.accountNumber,
        accountName: row.accountName,
        status: row.status === 'inactive' ? 'Tidak Aktif' : 'Aktif',
      },
      transportStatus: 'applied',
      serverSyncStatus: 'synced',
      updatedAt: row.updatedAt.toISOString(),
    })),

    ...recipeRows.map<SyncPullItem>((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: 'recipe',
      mutationType: 'update',
      payload: {
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        name: row.name,
        batchYield: row.batchYield,
        items: row.items,
        status: row.status === 'active' ? 'Aktif' : 'Draft',
      },
      transportStatus: 'applied',
      serverSyncStatus: 'synced',
      updatedAt: row.updatedAt.toISOString(),
    })),
  ]

  items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const cursor = items.at(0)?.updatedAt ?? parsed.value.since?.toISOString() ?? null

  return c.json({ ok: true, cursor, items })
})

syncRoutes.post('/push', async (c) => {
  const parsed = parseSyncPushBody(await c.req.json().catch(() => null))

  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400)
  }

  const now = new Date()
  const items: SyncPushItemResult[] = []

  for (const mutation of parsed.value.mutations) {
    const payload = mutation.payload

    if (payload === undefined) {
      await db.insert(outboxLogs).values({
        tenantId: parsed.value.tenantId,
        branchId: parsed.value.branchId ?? null,
        deviceId: parsed.value.deviceId,
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        mutationType: mutation.mutationType,
        payload: { message: 'payload missing' },
        status: 'failed',
        attempts: 1,
        errorMessage: 'payload missing',
        createdAt: now,
        updatedAt: now,
      })

      items.push({
        entityId: mutation.entityId,
        entityType: mutation.entityType,
        mutationType: mutation.mutationType,
        status: 'rejected',
        message: 'payload missing',
      })
      continue
    }

    let itemStatus: 'applied' | 'rejected' = 'applied'
    let message: string | undefined

    try {
      await applyMutation(
        db,
        { tenantId: parsed.value.tenantId, branchId: parsed.value.branchId },
        mutation.entityType,
        mutation.entityId,
        mutation.mutationType,
        payload,
      )
    } catch (error) {
      itemStatus = 'rejected'
      message = error instanceof Error ? error.message : 'apply failed'
    }

    await db.insert(outboxLogs).values({
      tenantId: parsed.value.tenantId,
      branchId: parsed.value.branchId ?? null,
      deviceId: parsed.value.deviceId,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      mutationType: mutation.mutationType,
      payload,
      status: itemStatus === 'applied' ? 'synced' : 'failed',
      attempts: 1,
      errorMessage: itemStatus === 'rejected' ? message ?? 'rejected' : null,
      createdAt: now,
      updatedAt: now,
    })

    items.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType,
      mutationType: mutation.mutationType,
      status: itemStatus,
      message,
    })
  }

  return c.json(buildSyncPushResponse(items))
})
