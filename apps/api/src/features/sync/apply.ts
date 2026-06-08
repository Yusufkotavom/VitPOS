import { eq } from 'drizzle-orm'

import type { AppDb } from '../../lib/db.js'
import {
  payments,
  products,
  salesOrderItems,
  salesOrders,
  stockMovements,
} from '../../../../../src/db/schema/index.js'

type ApplyContext = {
  tenantId: string
  branchId?: string | null
}

type ProductPayload = {
  name?: string
  category?: string
  type?: string
  price?: number
  stock?: number
  sku?: string
  barcode?: string
  status?: string
  isActive?: boolean
}

type SalesOrderPayload = {
  code?: string
  orderNumber?: string
  customerName?: string
  customerId?: string
  date?: string
  subtotal?: number | string
  discountTotal?: number | string
  taxTotal?: number | string
  grandTotal?: number | string
  paidTotal?: number | string
  status?: string
  items?: Array<{
    id?: string
    productId?: string
    name?: string
    qty?: number | string
    unitPrice?: number | string
    subtotal?: number | string
  }>
}

type PaymentPayload = {
  ref?: string
  paymentNumber?: string
  salesOrderId?: string
  source?: string
  method?: string
  amount?: number | string
  date?: string
  status?: string
}

type StockMovementPayload = {
  productId?: string
  productName?: string
  warehouseId?: string
  warehouseName?: string
  type?: string
  qty?: number | string
  referenceType?: string
  referenceId?: string
  notes?: string
}

function toNumeric(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0'
  if (typeof value === 'number') return String(value)
  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : '0'
}

function toNullableUuid(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function mapClientProductType(value: unknown): 'physical' | 'service' {
  if (value === 'Jasa' || value === 'service') return 'service'
  return 'physical'
}

function mapClientProductStatus(value: unknown): boolean {
  if (value === 'Arsip' || value === false) return false
  return true
}

function mapClientPaymentMethod(value: unknown): 'cash' | 'qris' | 'card' | 'transfer' | 'ewallet' | 'receivable' {
  if (value === 'tunai' || value === 'cash') return 'cash'
  if (value === 'qris') return 'qris'
  if (value === 'kartu' || value === 'card') return 'card'
  if (value === 'transfer') return 'transfer'
  if (value === 'e-wallet' || value === 'ewallet') return 'ewallet'
  if (value === 'piutang' || value === 'receivable') return 'receivable'
  return 'cash'
}

function mapClientPaymentStatus(value: unknown): 'success' | 'pending' | 'failed' | 'refunded' | 'partial_refund' {
  if (value === 'Berhasil' || value === 'success') return 'success'
  if (value === 'Pending' || value === 'pending') return 'pending'
  if (value === 'Gagal' || value === 'failed') return 'failed'
  if (value === 'Refund' || value === 'refunded') return 'refunded'
  return 'pending'
}

function mapClientSalesOrderStatus(value: unknown): 'draft' | 'confirmed' | 'unpaid' | 'partial' | 'paid' | 'receivable' | 'cancelled' | 'refunded' {
  if (value === 'Draft' || value === 'draft') return 'draft'
  if (value === 'Lunas' || value === 'paid') return 'paid'
  if (value === 'Sebagian' || value === 'partial') return 'partial'
  if (value === 'Belum Bayar' || value === 'unpaid') return 'unpaid'
  if (value === 'Batal' || value === 'cancelled') return 'cancelled'
  if (value === 'Piutang' || value === 'receivable') return 'receivable'
  return 'draft'
}

function mapClientStockMovementType(value: unknown): 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'damage_lost' {
  const allowed = new Set(['sale', 'purchase', 'return', 'adjustment', 'transfer_in', 'transfer_out', 'damage_lost'])
  if (typeof value === 'string' && allowed.has(value)) return value as 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'damage_lost'
  return 'adjustment'
}

async function applyProduct(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: ProductPayload) {
  if (mutationType === 'delete') {
    await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(products)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      name: payload.name ?? '',
      sku: payload.sku ?? null,
      barcode: payload.barcode ?? null,
      type: mapClientProductType(payload.type),
      salePrice: toNumeric(payload.price),
      costPrice: null,
      wholesalePrice: null,
      minimumStock: 0,
      imageUrl: null,
      isActive: mapClientProductStatus(payload.status ?? payload.isActive),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: products.id,
      set: {
        name: payload.name ?? '',
        sku: payload.sku ?? null,
        barcode: payload.barcode ?? null,
        type: mapClientProductType(payload.type),
        salePrice: toNumeric(payload.price),
        isActive: mapClientProductStatus(payload.status ?? payload.isActive),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applySale(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: SalesOrderPayload) {
  if (!ctx.branchId) {
    throw new Error('branchId required for sale mutation')
  }

  const now = new Date()

  if (mutationType === 'delete') {
    await db.delete(salesOrderItems).where(eq(salesOrderItems.salesOrderId, entityId))
    await db.delete(salesOrders).where(eq(salesOrders.id, entityId))
    return
  }

  await db
    .insert(salesOrders)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      customerId: toNullableUuid(payload.customerId),
      orderNumber: payload.orderNumber ?? payload.code ?? entityId,
      status: mapClientSalesOrderStatus(payload.status),
      subtotal: toNumeric(payload.subtotal),
      discountTotal: toNumeric(payload.discountTotal),
      taxTotal: toNumeric(payload.taxTotal),
      grandTotal: toNumeric(payload.grandTotal),
      paidTotal: toNumeric(payload.paidTotal),
      notes: null,
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: salesOrders.id,
      set: {
        status: mapClientSalesOrderStatus(payload.status),
        subtotal: toNumeric(payload.subtotal),
        discountTotal: toNumeric(payload.discountTotal),
        taxTotal: toNumeric(payload.taxTotal),
        grandTotal: toNumeric(payload.grandTotal),
        paidTotal: toNumeric(payload.paidTotal),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })

  if (Array.isArray(payload.items)) {
    await db.delete(salesOrderItems).where(eq(salesOrderItems.salesOrderId, entityId))

    if (payload.items.length > 0) {
      await db.insert(salesOrderItems).values(
        payload.items.map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          tenantId: ctx.tenantId,
          salesOrderId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? '',
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          discountTotal: '0',
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now,
        })),
      )
    }
  }
}

async function applyPayment(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: PaymentPayload) {
  if (!ctx.branchId) {
    throw new Error('branchId required for payment mutation')
  }

  if (mutationType === 'delete') {
    await db.delete(payments).where(eq(payments.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(payments)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      salesOrderId: toNullableUuid(payload.salesOrderId),
      paymentNumber: payload.paymentNumber ?? payload.ref ?? entityId,
      method: mapClientPaymentMethod(payload.method),
      amount: toNumeric(payload.amount),
      referenceNumber: null,
      status: mapClientPaymentStatus(payload.status),
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: payments.id,
      set: {
        status: mapClientPaymentStatus(payload.status),
        amount: toNumeric(payload.amount),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applyStockMovement(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: StockMovementPayload) {
  if (!payload.productId) {
    throw new Error('productId required for stock_movement mutation')
  }

  if (mutationType === 'delete') {
    await db.delete(stockMovements).where(eq(stockMovements.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(stockMovements)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      warehouseId: ctx.branchId ?? '',
      productId: payload.productId,
      type: mapClientStockMovementType(payload.type),
      qty: toNumeric(payload.qty),
      referenceType: payload.referenceType ?? null,
      referenceId: toNullableUuid(payload.referenceId),
      notes: payload.notes ?? null,
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: stockMovements.id,
      set: {
        qty: toNumeric(payload.qty),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

export async function applyMutation(
  db: AppDb,
  ctx: ApplyContext,
  entityType: string,
  entityId: string,
  mutationType: string,
  payload: unknown,
): Promise<void> {
  if (entityType === 'product') {
    await applyProduct(db, ctx, entityId, mutationType, (payload ?? {}) as ProductPayload)
    return
  }
  if (entityType === 'sale') {
    await applySale(db, ctx, entityId, mutationType, (payload ?? {}) as SalesOrderPayload)
    return
  }
  if (entityType === 'payment') {
    await applyPayment(db, ctx, entityId, mutationType, (payload ?? {}) as PaymentPayload)
    return
  }
  if (entityType === 'stock_movement') {
    await applyStockMovement(db, ctx, entityId, mutationType, (payload ?? {}) as StockMovementPayload)
    return
  }
}
