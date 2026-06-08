import { and, desc, eq, gte, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import {
  buildSyncPushResponse,
  serverSyncStatusToApiItemStatus,
  parseSyncPullQuery,
  parseSyncPushBody,
  type SyncPullItem,
  type SyncPushItemResult,
} from '../../lib/contracts.js'
import { applyMutation } from './apply.js'
import { customers, outboxLogs, payments, products, salesOrders, stockMovements } from '../../../../../src/db/schema/index.js'

export const syncRoutes = new Hono()

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
        stock: 0,
        status: row.isActive ? 'Aktif' : 'Arsip',
        isActive: row.isActive,
        salePrice: Number(row.salePrice),
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
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
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
