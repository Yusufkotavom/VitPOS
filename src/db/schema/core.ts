import { relations } from 'drizzle-orm'
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'cashier', 'staff'])
export const orderStatusEnum = pgEnum('order_status', ['draft', 'confirmed', 'unpaid', 'partial', 'paid', 'receivable', 'cancelled', 'refunded'])
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'qris', 'card', 'transfer', 'ewallet', 'receivable'])
export const paymentStatusEnum = pgEnum('payment_status', ['success', 'pending', 'failed', 'refunded', 'partial_refund'])
export const productTypeEnum = pgEnum('product_type', ['physical', 'service'])
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['sale', 'purchase', 'return', 'adjustment', 'transfer_in', 'transfer_out', 'damage_lost', 'production'])
export const syncStatusEnum = pgEnum('sync_status', ['synced', 'pending', 'failed', 'conflict'])
export const cashCategoryTypeEnum = pgEnum('cash_category_type', ['income', 'expense'])
export const shiftStatusEnum = pgEnum('shift_status', ['open', 'closed'])
export const purchaseStatusEnum = pgEnum('purchase_status', ['draft', 'shipped', 'received', 'cancelled'])
export const returnTypeEnum = pgEnum('return_type', ['sale', 'purchase'])
export const returnStatusEnum = pgEnum('return_status', ['draft', 'processing', 'completed', 'cancelled'])
export const serviceOrderStatusEnum = pgEnum('service_order_status', ['received', 'in_progress', 'completed', 'picked_up', 'cancelled'])
export const recipeStatusEnum = pgEnum('recipe_status', ['draft', 'active'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

export const subscriptionStatusEnum = pgEnum('subscription_status', ['trial', 'active', 'past_due', 'suspended', 'cancelled'])

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 160 }).notNull(),
  legalName: varchar('legal_name', { length: 200 }),
  npwp: varchar('npwp', { length: 64 }),
  nib: varchar('nib', { length: 64 }),
  phone: varchar('phone', { length: 40 }),
  email: varchar('email', { length: 160 }),
  address: text('address'),
  planCode: varchar('plan_code', { length: 40 }).default('free').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial').notNull(),
  planValidUntil: timestamp('plan_valid_until', { withTimezone: true }),
  storageLimitMb: integer('storage_limit_mb').default(512).notNull(),
  maxBranches: integer('max_branches').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
})

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 160 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 40 }),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => [index('branches_tenant_id_idx').on(table.tenantId)])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 160 }).notNull().unique(),
  name: varchar('name', { length: 160 }).notNull(),
  avatarUrl: text('avatar_url'),
  ...timestamps,
})

export const tenantMembers = pgTable('tenant_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: memberRoleEnum('role').default('staff').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => [index('tenant_members_tenant_id_idx').on(table.tenantId), index('tenant_members_user_id_idx').on(table.userId)])

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  name: varchar('name', { length: 160 }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => [index('warehouses_tenant_id_idx').on(table.tenantId), index('warehouses_branch_id_idx').on(table.branchId)])

export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 120 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('product_categories_tenant_id_idx').on(table.tenantId)])

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  categoryId: uuid('category_id').references(() => productCategories.id),
  name: varchar('name', { length: 180 }).notNull(),
  sku: varchar('sku', { length: 80 }),
  barcode: varchar('barcode', { length: 120 }),
  type: productTypeEnum('type').default('physical').notNull(),
  salePrice: numeric('sale_price', { precision: 14, scale: 2 }).notNull(),
  wholesalePrice: numeric('wholesale_price', { precision: 14, scale: 2 }),
  costPrice: numeric('cost_price', { precision: 14, scale: 2 }),
  minimumStock: integer('minimum_stock').default(0).notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('products_tenant_id_idx').on(table.tenantId), index('products_branch_id_idx').on(table.branchId), index('products_category_id_idx').on(table.categoryId)])

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  name: varchar('name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  email: varchar('email', { length: 160 }),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('customers_tenant_id_idx').on(table.tenantId), index('customers_branch_id_idx').on(table.branchId)])

export const salesOrders = pgTable('sales_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  customerId: uuid('customer_id').references(() => customers.id),
  orderNumber: varchar('order_number', { length: 80 }).notNull(),
  status: orderStatusEnum('status').default('draft').notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).default('0').notNull(),
  discountTotal: numeric('discount_total', { precision: 14, scale: 2 }).default('0').notNull(),
  taxTotal: numeric('tax_total', { precision: 14, scale: 2 }).default('0').notNull(),
  grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).default('0').notNull(),
  paidTotal: numeric('paid_total', { precision: 14, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  syncStatus: syncStatusEnum('sync_status').default('pending').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('sales_orders_tenant_id_idx').on(table.tenantId), index('sales_orders_branch_id_idx').on(table.branchId), index('sales_orders_customer_id_idx').on(table.customerId)])

export const salesOrderItems = pgTable('sales_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  salesOrderId: uuid('sales_order_id').notNull().references(() => salesOrders.id),
  productId: uuid('product_id').references(() => products.id),
  name: varchar('name', { length: 180 }).notNull(),
  qty: numeric('qty', { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  discountTotal: numeric('discount_total', { precision: 14, scale: 2 }).default('0').notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  ...timestamps,
}, (table) => [index('sales_order_items_tenant_id_idx').on(table.tenantId), index('sales_order_items_order_id_idx').on(table.salesOrderId), index('sales_order_items_product_id_idx').on(table.productId)])

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  salesOrderId: uuid('sales_order_id').references(() => salesOrders.id),
  paymentNumber: varchar('payment_number', { length: 80 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  referenceNumber: varchar('reference_number', { length: 120 }),
  status: paymentStatusEnum('status').default('pending').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('pending').notNull(),
  ...timestamps,
}, (table) => [index('payments_tenant_id_idx').on(table.tenantId), index('payments_branch_id_idx').on(table.branchId), index('payments_order_id_idx').on(table.salesOrderId)])

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  type: stockMovementTypeEnum('type').notNull(),
  qty: numeric('qty', { precision: 14, scale: 3 }).notNull(),
  referenceType: varchar('reference_type', { length: 80 }),
  referenceId: uuid('reference_id'),
  notes: text('notes'),
  syncStatus: syncStatusEnum('sync_status').default('pending').notNull(),
  ...timestamps,
}, (table) => [index('stock_movements_tenant_id_idx').on(table.tenantId), index('stock_movements_warehouse_id_idx').on(table.warehouseId), index('stock_movements_product_id_idx').on(table.productId)])

export const cashCategories = pgTable('cash_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 120 }).notNull(),
  type: cashCategoryTypeEnum('type').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('cash_categories_tenant_id_idx').on(table.tenantId)])

export const cash = pgTable('cash', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  ref: varchar('ref', { length: 80 }).notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  categoryId: uuid('category_id').references(() => cashCategories.id),
  income: numeric('income', { precision: 14, scale: 2 }).default('0').notNull(),
  expense: numeric('expense', { precision: 14, scale: 2 }).default('0').notNull(),
  status: varchar('status', { length: 40 }).default('posted').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  ...timestamps,
}, (table) => [index('cash_tenant_id_idx').on(table.tenantId), index('cash_branch_id_idx').on(table.branchId)])

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  key: varchar('key', { length: 120 }).notNull(),
  area: varchar('area', { length: 80 }).notNull(),
  value: text('value').notNull(),
  status: varchar('status', { length: 40 }).default('active').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  ...timestamps,
}, (table) => [index('settings_tenant_id_idx').on(table.tenantId), index('settings_tenant_key_idx').on(table.tenantId, table.key)])

export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  cashierName: varchar('cashier_name', { length: 120 }).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).defaultNow().notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  startCash: numeric('start_cash', { precision: 14, scale: 2 }).default('0').notNull(),
  expectedCash: numeric('expected_cash', { precision: 14, scale: 2 }),
  actualCash: numeric('actual_cash', { precision: 14, scale: 2 }),
  difference: numeric('difference', { precision: 14, scale: 2 }),
  status: shiftStatusEnum('status').default('open').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  ...timestamps,
}, (table) => [index('shifts_tenant_id_idx').on(table.tenantId), index('shifts_branch_id_idx').on(table.branchId)])

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  city: varchar('city', { length: 80 }),
  payable: numeric('payable', { precision: 14, scale: 2 }).default('0').notNull(),
  orders: integer('orders').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('suppliers_tenant_id_idx').on(table.tenantId)])

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  code: varchar('code', { length: 80 }).notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).default('0').notNull(),
  grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).default('0').notNull(),
  status: purchaseStatusEnum('status').default('draft').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('purchases_tenant_id_idx').on(table.tenantId), index('purchases_branch_id_idx').on(table.branchId), index('purchases_supplier_id_idx').on(table.supplierId)])

export const purchaseItems = pgTable('purchase_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id),
  productId: uuid('product_id').references(() => products.id),
  name: varchar('name', { length: 180 }).notNull(),
  qty: numeric('qty', { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  ...timestamps,
}, (table) => [index('purchase_items_tenant_id_idx').on(table.tenantId), index('purchase_items_purchase_id_idx').on(table.purchaseId), index('purchase_items_product_id_idx').on(table.productId)])

export const returns = pgTable('returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  code: varchar('code', { length: 80 }).notNull(),
  type: returnTypeEnum('type').notNull(),
  referenceCode: varchar('reference_code', { length: 80 }).notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  total: numeric('total', { precision: 14, scale: 2 }).default('0').notNull(),
  status: returnStatusEnum('status').default('draft').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('returns_tenant_id_idx').on(table.tenantId), index('returns_branch_id_idx').on(table.branchId)])

export const returnItems = pgTable('return_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  returnId: uuid('return_id').notNull().references(() => returns.id),
  productId: uuid('product_id').references(() => products.id),
  name: varchar('name', { length: 180 }).notNull(),
  qty: numeric('qty', { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  ...timestamps,
}, (table) => [index('return_items_tenant_id_idx').on(table.tenantId), index('return_items_return_id_idx').on(table.returnId), index('return_items_product_id_idx').on(table.productId)])

export const serviceOrders = pgTable('service_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  customerId: uuid('customer_id').references(() => customers.id),
  code: varchar('code', { length: 80 }).notNull(),
  customerName: varchar('customer_name', { length: 160 }).notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  cost: numeric('cost', { precision: 14, scale: 2 }).default('0').notNull(),
  status: serviceOrderStatusEnum('status').default('received').notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('service_orders_tenant_id_idx').on(table.tenantId), index('service_orders_branch_id_idx').on(table.branchId), index('service_orders_customer_id_idx').on(table.customerId)])

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 120 }).notNull(),
  provider: varchar('provider', { length: 80 }).notNull(),
  type: varchar('type', { length: 80 }).notNull(),
  accountNumber: varchar('account_number', { length: 80 }),
  accountName: varchar('account_name', { length: 160 }),
  status: varchar('status', { length: 40 }).default('active').notNull(),
  ...timestamps,
}, (table) => [index('payment_methods_tenant_id_idx').on(table.tenantId)])

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  productName: varchar('product_name', { length: 180 }).notNull(),
  name: varchar('name', { length: 180 }).notNull(),
  batchYield: integer('batch_yield').default(1).notNull(),
  items: jsonb('items').default([]).notNull(),
  status: recipeStatusEnum('status').default('draft').notNull(),
  ...timestamps,
}, (table) => [index('recipes_tenant_id_idx').on(table.tenantId), index('recipes_product_id_idx').on(table.productId)])

export const productionBatches = pgTable('production_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  batchQty: integer('batch_qty').default(1).notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  syncStatus: syncStatusEnum('sync_status').default('synced').notNull(),
  version: integer('version').default(1).notNull(),
  ...timestamps,
}, (table) => [index('production_batches_tenant_id_idx').on(table.tenantId), index('production_batches_branch_id_idx').on(table.branchId), index('production_batches_recipe_id_idx').on(table.recipeId), index('production_batches_product_id_idx').on(table.productId)])

export const outboxLogs = pgTable('outbox_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').references(() => branches.id),
  deviceId: varchar('device_id', { length: 120 }).notNull(),
  entityType: varchar('entity_type', { length: 80 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  mutationType: varchar('mutation_type', { length: 40 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: syncStatusEnum('status').default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  errorMessage: text('error_message'),
  ...timestamps,
}, (table) => [index('outbox_logs_tenant_id_idx').on(table.tenantId), index('outbox_logs_branch_id_idx').on(table.branchId), index('outbox_logs_status_idx').on(table.status)])

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  members: many(tenantMembers),
  products: many(products),
  customers: many(customers),
}))

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  warehouses: many(warehouses),
  salesOrders: many(salesOrders),
}))

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [salesOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [salesOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [salesOrders.customerId], references: [customers.id] }),
  items: many(salesOrderItems),
  payments: many(payments),
}))

export const cashRelations = relations(cash, ({ one }) => ({
  tenant: one(tenants, { fields: [cash.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [cash.branchId], references: [branches.id] }),
  category: one(cashCategories, { fields: [cash.categoryId], references: [cashCategories.id] }),
}))

export const settingsRelations = relations(settings, ({ one }) => ({
  tenant: one(tenants, { fields: [settings.tenantId], references: [tenants.id] }),
}))

export const shiftsRelations = relations(shifts, ({ one }) => ({
  tenant: one(tenants, { fields: [shifts.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [shifts.branchId], references: [branches.id] }),
}))

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] }),
}))

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchases.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [purchases.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [purchases.supplierId], references: [suppliers.id] }),
  items: many(purchaseItems),
}))

export const returnsRelations = relations(returns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [returns.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [returns.branchId], references: [branches.id] }),
  items: many(returnItems),
}))

export const serviceOrdersRelations = relations(serviceOrders, ({ one }) => ({
  tenant: one(tenants, { fields: [serviceOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [serviceOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [serviceOrders.customerId], references: [customers.id] }),
}))
