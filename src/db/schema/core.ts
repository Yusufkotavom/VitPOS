import { relations } from 'drizzle-orm'
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'cashier', 'staff'])
export const orderStatusEnum = pgEnum('order_status', ['draft', 'confirmed', 'unpaid', 'partial', 'paid', 'receivable', 'cancelled', 'refunded'])
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'qris', 'card', 'transfer', 'ewallet', 'receivable'])
export const paymentStatusEnum = pgEnum('payment_status', ['success', 'pending', 'failed', 'refunded', 'partial_refund'])
export const productTypeEnum = pgEnum('product_type', ['physical', 'service'])
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['sale', 'purchase', 'return', 'adjustment', 'transfer_in', 'transfer_out', 'damage_lost'])
export const syncStatusEnum = pgEnum('sync_status', ['synced', 'pending', 'failed', 'conflict'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

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
