import { and, eq } from 'drizzle-orm'

import type { AppDb } from '../../lib/db.js'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function isValidUuid(value: string): boolean {
  return uuidPattern.test(value)
}
import {
  cash,
  cashCategories,
  customers,
  paymentMethods,
  payments,
  productCategories,
  productionBatches,
  products,
  purchaseItems,
  purchases,
  recipes,
  returnItems,
  returns,
  salesOrderItems,
  salesOrders,
  serviceOrders,
  settings,
  shifts,
  stockMovements,
  suppliers,
  warehouses,
} from '../../../../../src/db/schema/index.js'

type ApplyContext = {
  tenantId: string
  branchId?: string | null
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

type ProductPayload = {
  name?: string
  category?: string
  type?: string
  price?: number
  costPrice?: number
  wholesalePrice?: number
  wholesaleTiers?: unknown[]
  manageStock?: boolean
  minimumStock?: number
  stock?: number
  sku?: string
  barcode?: string
  imageUrl?: string
  icon?: string
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
  serviceOrderId?: string
  purchaseId?: string
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
  if (typeof value !== 'string' || value.length === 0) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value) ? value : null
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
      costPrice: toNumeric(payload.costPrice),
      wholesalePrice: toNumeric(payload.wholesalePrice),
      wholesaleTiers: payload.wholesaleTiers ?? null,
      manageStock: payload.manageStock ?? true,
      minimumStock: payload.minimumStock ?? 0,
      imageUrl: payload.imageUrl ?? null,
      icon: payload.icon ?? null,
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
        costPrice: toNumeric(payload.costPrice),
        wholesalePrice: toNumeric(payload.wholesalePrice),
        wholesaleTiers: payload.wholesaleTiers ?? null,
        manageStock: payload.manageStock ?? true,
        minimumStock: payload.minimumStock ?? 0,
        imageUrl: payload.imageUrl ?? null,
        icon: payload.icon ?? null,
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
          id: item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID(),
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
      serviceOrderId: toNullableUuid(payload.serviceOrderId),
      purchaseId: toNullableUuid(payload.purchaseId),
      paymentNumber: payload.paymentNumber ?? payload.ref ?? entityId,
      source: payload.source ?? null,
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
        source: payload.source ?? undefined,
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

  let warehouseId = payload.warehouseId as string | undefined
  if (!warehouseId && ctx.branchId) {
    const defaultWarehouse = await db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(and(eq(warehouses.tenantId, ctx.tenantId), eq(warehouses.branchId, ctx.branchId), eq(warehouses.isDefault, true)))
      .limit(1)
      .then((rows) => rows[0])
    warehouseId = defaultWarehouse?.id
  }
  if (!warehouseId) {
    const anyWarehouse = await db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(eq(warehouses.tenantId, ctx.tenantId))
      .limit(1)
      .then((rows) => rows[0])
    warehouseId = anyWarehouse?.id
  }
  if (!warehouseId) {
    throw new Error('No warehouse found for stock_movement mutation')
  }

  const now = new Date()
  await db
    .insert(stockMovements)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      warehouseId,
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

type CustomerPayload = {
  id?: string
  name?: string
  phone?: string
  email?: string
  city?: string | null
  receivable?: number
  orders?: number
  status?: string
  isActive?: boolean
}

type ProductCategoryPayload = {
  id?: string
  name?: string
  description?: string
  status?: string
  isActive?: boolean
}

type CashCategoryPayload = {
  id?: string
  name?: string
  type?: string
  status?: string
  isActive?: boolean
}

type CashPayload = {
  id?: string
  ref?: string
  date?: string
  account?: string
  category?: string
  categoryId?: string
  income?: number
  expense?: number
  status?: string
}

type SettingPayload = {
  id?: string
  key?: string
  area?: string
  setting?: string
  value?: string
  status?: string
}

type ShiftPayload = {
  id?: string
  cashierName?: string
  startTime?: string
  endTime?: string
  startCash?: number
  expectedCash?: number
  actualCash?: number
  difference?: number
  status?: string
}

type SupplierPayload = {
  id?: string
  name?: string
  phone?: string
  city?: string
  payable?: number
  orders?: number
  status?: string
  isActive?: boolean
}

type PurchasePayload = {
  id?: string
  code?: string
  supplierId?: string
  supplierName?: string
  date?: string
  subtotal?: number | string
  grandTotal?: number | string
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

type ReturnPayload = {
  id?: string
  code?: string
  type?: string
  referenceCode?: string
  date?: string
  total?: number | string
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

type ServiceOrderPayload = {
  id?: string
  code?: string
  customerId?: string
  customerName?: string
  description?: string
  date?: string
  cost?: number | string
  paidTotal?: number | string
  status?: string
  items?: Array<{
    id?: string
    productId?: string
    name?: string
    qty?: number | string
    price?: number | string
    unitPrice?: number | string
    subtotal?: number | string
  }>
  timeline?: Array<{
    id?: string
    status?: string
    date?: string
    note?: string
    type?: string
  }>
}

type PaymentMethodPayload = {
  id?: string
  name?: string
  provider?: string
  type?: string
  accountNumber?: string
  accountName?: string
  status?: string
}

type RecipePayload = {
  id?: string
  productId?: string
  productName?: string
  name?: string
  batchYield?: number
  items?: Array<{
    id?: string
    productId?: string
    productName?: string
    qty?: number
    unit?: string
  }>
  status?: string
}

function mapClientCustomerStatus(value: unknown): boolean {
  if (value === 'Nonaktif' || value === false) return false
  return true
}

function mapClientCategoryStatus(value: unknown): boolean {
  if (value === 'Arsip' || value === 'Nonaktif' || value === false) return false
  return true
}

function mapClientCashCategoryType(value: unknown): 'income' | 'expense' {
  if (value === 'Pemasukan' || value === 'income') return 'income'
  return 'expense'
}

function mapClientShiftStatus(value: unknown): 'open' | 'closed' {
  if (value === 'closed' || value === 'tutup') return 'closed'
  return 'open'
}

function mapClientPurchaseStatus(value: unknown): 'draft' | 'shipped' | 'received' | 'cancelled' {
  if (value === 'Draft' || value === 'draft') return 'draft'
  if (value === 'Dikirim' || value === 'shipped') return 'shipped'
  if (value === 'Diterima' || value === 'received') return 'received'
  if (value === 'Batal' || value === 'cancelled') return 'cancelled'
  return 'draft'
}

function mapClientReturnType(value: unknown): 'sale' | 'purchase' {
  if (value === 'Pembelian' || value === 'purchase') return 'purchase'
  return 'sale'
}

function mapClientReturnStatus(value: unknown): 'draft' | 'processing' | 'completed' | 'cancelled' {
  if (value === 'Draft' || value === 'draft') return 'draft'
  if (value === 'Diproses' || value === 'processing') return 'processing'
  if (value === 'Selesai' || value === 'completed') return 'completed'
  if (value === 'Batal' || value === 'cancelled') return 'cancelled'
  return 'draft'
}

function mapClientServiceOrderStatus(value: unknown): 'received' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled' {
  if (value === 'Diterima' || value === 'received') return 'received'
  if (value === 'Dikerjakan' || value === 'in_progress') return 'in_progress'
  if (value === 'Selesai' || value === 'completed') return 'completed'
  if (value === 'Diambil' || value === 'picked_up') return 'picked_up'
  if (value === 'Batal' || value === 'cancelled') return 'cancelled'
  return 'received'
}

async function applyCustomer(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: CustomerPayload) {
  if (mutationType === 'delete') {
    await db.update(customers).set({ deletedAt: new Date() }).where(eq(customers.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(customers)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      name: payload.name ?? '',
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.city ?? null,
      notes: null,
      isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: customers.id,
      set: {
        name: payload.name ?? '',
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        address: payload.city ?? null,
        isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applyProductCategory(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: ProductCategoryPayload) {
  if (mutationType === 'delete') {
    await db.update(productCategories).set({ deletedAt: new Date() }).where(eq(productCategories.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(productCategories)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      name: payload.name ?? '',
      isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: productCategories.id,
      set: {
        name: payload.name ?? '',
        isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applyCashCategory(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: CashCategoryPayload) {
  if (mutationType === 'delete') {
    await db.update(cashCategories).set({ deletedAt: new Date() }).where(eq(cashCategories.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(cashCategories)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      name: payload.name ?? '',
      type: mapClientCashCategoryType(payload.type),
      isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: cashCategories.id,
      set: {
        name: payload.name ?? '',
        type: mapClientCashCategoryType(payload.type),
        isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applyCash(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: CashPayload) {
  if (mutationType === 'delete') {
    await db.delete(cash).where(eq(cash.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(cash)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      ref: payload.ref ?? payload.id ?? entityId,
      date: payload.date ? new Date(payload.date) : now,
      categoryId: toNullableUuid(payload.categoryId ?? payload.category),
      income: toNumeric(payload.income),
      expense: toNumeric(payload.expense),
      status: payload.status ?? 'posted',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: cash.id,
      set: {
        income: toNumeric(payload.income),
        expense: toNumeric(payload.expense),
        status: payload.status ?? 'posted',
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applySetting(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: SettingPayload) {
  if (mutationType === 'delete') {
    await db.delete(settings).where(eq(settings.id, entityId))
    return
  }

  const now = new Date()
  const rawKey = payload.key ?? payload.id ?? payload.setting ?? entityId
  const area = payload.area ?? 'general'
  const settingKey = normalizeSettingKey(rawKey, area)

  const existing = await db.query.settings.findFirst({
    where: and(eq(settings.tenantId, ctx.tenantId), eq(settings.key, settingKey)),
  })

  if (existing) {
    await db
      .update(settings)
      .set({
        value: payload.value ?? '',
        area,
        status: payload.status ?? 'active',
        syncStatus: 'synced',
        updatedAt: now,
      })
      .where(eq(settings.id, existing.id))
  } else {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId) ? entityId : crypto.randomUUID()
    await db.insert(settings).values({
      id: uuid,
      tenantId: ctx.tenantId,
      key: settingKey,
      area,
      value: payload.value ?? '',
      status: payload.status ?? 'active',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    })
  }
}

async function applyShift(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: ShiftPayload) {
  if (mutationType === 'delete') {
    await db.delete(shifts).where(eq(shifts.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(shifts)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      cashierName: payload.cashierName ?? '',
      startTime: payload.startTime ? new Date(payload.startTime) : now,
      endTime: payload.endTime ? new Date(payload.endTime) : null,
      startCash: toNumeric(payload.startCash),
      expectedCash: payload.expectedCash !== undefined ? toNumeric(payload.expectedCash) : null,
      actualCash: payload.actualCash !== undefined ? toNumeric(payload.actualCash) : null,
      difference: payload.difference !== undefined ? toNumeric(payload.difference) : null,
      status: mapClientShiftStatus(payload.status),
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: shifts.id,
      set: {
        endTime: payload.endTime ? new Date(payload.endTime) : null,
        expectedCash: payload.expectedCash !== undefined ? toNumeric(payload.expectedCash) : undefined,
        actualCash: payload.actualCash !== undefined ? toNumeric(payload.actualCash) : undefined,
        difference: payload.difference !== undefined ? toNumeric(payload.difference) : undefined,
        status: mapClientShiftStatus(payload.status),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applySupplier(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: SupplierPayload) {
  if (mutationType === 'delete') {
    await db.update(suppliers).set({ deletedAt: new Date() }).where(eq(suppliers.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(suppliers)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      name: payload.name ?? '',
      phone: payload.phone ?? null,
      city: payload.city ?? null,
      payable: toNumeric(payload.payable),
      orders: payload.orders ?? 0,
      isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: suppliers.id,
      set: {
        name: payload.name ?? '',
        phone: payload.phone ?? null,
        city: payload.city ?? null,
        payable: toNumeric(payload.payable),
        orders: payload.orders ?? 0,
        isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applyPurchase(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: PurchasePayload) {
  if (mutationType === 'delete') {
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, entityId))
    await db.delete(purchases).where(eq(purchases.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(purchases)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      supplierId: toNullableUuid(payload.supplierId),
      code: payload.code ?? entityId,
      date: payload.date ? new Date(payload.date) : now,
      subtotal: toNumeric(payload.subtotal),
      grandTotal: toNumeric(payload.grandTotal),
      status: mapClientPurchaseStatus(payload.status),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: purchases.id,
      set: {
        subtotal: toNumeric(payload.subtotal),
        grandTotal: toNumeric(payload.grandTotal),
        status: mapClientPurchaseStatus(payload.status),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })

  if (Array.isArray(payload.items)) {
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, entityId))

    if (payload.items.length > 0) {
      await db.insert(purchaseItems).values(
        payload.items.map((item) => ({
          id: item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID(),
          tenantId: ctx.tenantId,
          purchaseId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? '',
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now,
        })),
      )
    }
  }
}

async function applyReturn(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: ReturnPayload) {
  if (mutationType === 'delete') {
    await db.delete(returnItems).where(eq(returnItems.returnId, entityId))
    await db.delete(returns).where(eq(returns.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(returns)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      code: payload.code ?? entityId,
      type: mapClientReturnType(payload.type),
      referenceCode: payload.referenceCode ?? '',
      date: payload.date ? new Date(payload.date) : now,
      total: toNumeric(payload.total),
      status: mapClientReturnStatus(payload.status),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: returns.id,
      set: {
        total: toNumeric(payload.total),
        status: mapClientReturnStatus(payload.status),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })

  if (Array.isArray(payload.items)) {
    await db.delete(returnItems).where(eq(returnItems.returnId, entityId))

    if (payload.items.length > 0) {
      await db.insert(returnItems).values(
        payload.items.map((item) => ({
          id: item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID(),
          tenantId: ctx.tenantId,
          returnId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? '',
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now,
        })),
      )
    }
  }
}

async function applyServiceOrder(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: ServiceOrderPayload) {
  if (mutationType === 'delete') {
    await db.delete(serviceOrders).where(eq(serviceOrders.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(serviceOrders)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      customerId: toNullableUuid(payload.customerId),
      code: payload.code ?? entityId,
      customerName: payload.customerName ?? '',
      description: payload.description ?? null,
      date: payload.date ? new Date(payload.date) : now,
      cost: toNumeric(payload.cost),
      paidTotal: toNumeric(payload.paidTotal),
      items: (payload.items ?? []).map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        productId: item.productId ?? null,
        name: item.name ?? '',
        qty: toNumeric(item.qty),
        price: toNumeric(item.price ?? item.unitPrice),
        subtotal: toNumeric(item.subtotal),
      })),
      timeline: (payload.timeline ?? []).map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        status: item.status ?? '',
        date: item.date ?? now.toISOString(),
        note: item.note ?? '',
        type: item.type,
      })),
      status: mapClientServiceOrderStatus(payload.status),
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: serviceOrders.id,
      set: {
        customerName: payload.customerName ?? '',
        description: payload.description ?? null,
        cost: toNumeric(payload.cost),
        paidTotal: toNumeric(payload.paidTotal),
        items: (payload.items ?? []).map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          productId: item.productId ?? null,
          name: item.name ?? '',
          qty: toNumeric(item.qty),
          price: toNumeric(item.price ?? item.unitPrice),
          subtotal: toNumeric(item.subtotal),
        })),
        timeline: (payload.timeline ?? []).map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          status: item.status ?? '',
          date: item.date ?? now.toISOString(),
          note: item.note ?? '',
          type: item.type,
        })),
        status: mapClientServiceOrderStatus(payload.status),
        syncStatus: 'synced',
        updatedAt: now,
      },
    })
}

async function applyPaymentMethod(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: PaymentMethodPayload) {
  if (mutationType === 'delete') {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(paymentMethods)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      name: payload.name ?? '',
      provider: payload.provider ?? '',
      type: payload.type ?? '',
      accountNumber: payload.accountNumber ?? null,
      accountName: payload.accountName ?? null,
      status: payload.status === 'Tidak Aktif' ? 'inactive' : 'active',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: paymentMethods.id,
      set: {
        name: payload.name ?? '',
        provider: payload.provider ?? '',
        type: payload.type ?? '',
        accountNumber: payload.accountNumber ?? null,
        accountName: payload.accountName ?? null,
        status: payload.status === 'Tidak Aktif' ? 'inactive' : 'active',
        updatedAt: now,
      },
    })
}

async function applyRecipe(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: RecipePayload) {
  if (mutationType === 'delete') {
    await db.delete(recipes).where(eq(recipes.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(recipes)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      productId: payload.productId ?? entityId,
      productName: payload.productName ?? '',
      name: payload.name ?? '',
      batchYield: payload.batchYield ?? 1,
      items: payload.items ?? [],
      status: payload.status === 'Aktif' ? 'active' : 'draft',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: recipes.id,
      set: {
        productId: payload.productId ?? entityId,
        productName: payload.productName ?? '',
        name: payload.name ?? '',
        batchYield: payload.batchYield ?? 1,
        items: payload.items ?? [],
        status: payload.status === 'Aktif' ? 'active' : 'draft',
        updatedAt: now,
      },
    })
}

type ProductionBatchPayload = {
  id?: string
  recipeId?: string
  recipeName?: string
  productId?: string
  productName?: string
  batchQty?: number
  date?: string
}

async function applyProductionBatch(db: AppDb, ctx: ApplyContext, entityId: string, mutationType: string, payload: ProductionBatchPayload) {
  if (mutationType === 'delete') {
    await db.delete(productionBatches).where(eq(productionBatches.id, entityId))
    return
  }

  const now = new Date()
  await db
    .insert(productionBatches)
    .values({
      id: entityId,
      tenantId: ctx.tenantId,
      branchId: toNullableUuid(ctx.branchId),
      recipeId: payload.recipeId ?? entityId,
      productId: payload.productId ?? entityId,
      batchQty: payload.batchQty ?? 1,
      date: payload.date ? new Date(payload.date) : now,
      syncStatus: 'synced',
      version: 1,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: productionBatches.id,
      set: {
        batchQty: payload.batchQty ?? 1,
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
  if (entityType === 'customer') {
    await applyCustomer(db, ctx, entityId, mutationType, (payload ?? {}) as CustomerPayload)
    return
  }
  if (entityType === 'product_category') {
    await applyProductCategory(db, ctx, entityId, mutationType, (payload ?? {}) as ProductCategoryPayload)
    return
  }
  if (entityType === 'cash_category') {
    await applyCashCategory(db, ctx, entityId, mutationType, (payload ?? {}) as CashCategoryPayload)
    return
  }
  if (entityType === 'cash') {
    await applyCash(db, ctx, entityId, mutationType, (payload ?? {}) as CashPayload)
    return
  }
  if (entityType === 'setting') {
    await applySetting(db, ctx, entityId, mutationType, (payload ?? {}) as SettingPayload)
    return
  }
  if (entityType === 'shift') {
    await applyShift(db, ctx, entityId, mutationType, (payload ?? {}) as ShiftPayload)
    return
  }
  if (entityType === 'supplier') {
    await applySupplier(db, ctx, entityId, mutationType, (payload ?? {}) as SupplierPayload)
    return
  }
  if (entityType === 'purchase') {
    await applyPurchase(db, ctx, entityId, mutationType, (payload ?? {}) as PurchasePayload)
    return
  }
  if (entityType === 'return') {
    await applyReturn(db, ctx, entityId, mutationType, (payload ?? {}) as ReturnPayload)
    return
  }
  if (entityType === 'service_order') {
    await applyServiceOrder(db, ctx, entityId, mutationType, (payload ?? {}) as ServiceOrderPayload)
    return
  }
  if (entityType === 'payment_method') {
    await applyPaymentMethod(db, ctx, entityId, mutationType, (payload ?? {}) as PaymentMethodPayload)
    return
  }
  if (entityType === 'recipe') {
    await applyRecipe(db, ctx, entityId, mutationType, (payload ?? {}) as RecipePayload)
    return
  }
  if (entityType === 'production_batch') {
    await applyProductionBatch(db, ctx, entityId, mutationType, (payload ?? {}) as ProductionBatchPayload)
    return
  }
}
