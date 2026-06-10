var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { Hono as Hono9 } from "hono";
import { cors } from "hono/cors";

// src/features/auth/routes.ts
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

// src/lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// ../../src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  billingPeriodEnum: () => billingPeriodEnum,
  branches: () => branches,
  branchesRelations: () => branchesRelations,
  cash: () => cash,
  cashCategories: () => cashCategories,
  cashCategoryTypeEnum: () => cashCategoryTypeEnum,
  cashRelations: () => cashRelations,
  customers: () => customers,
  memberRoleEnum: () => memberRoleEnum,
  orderStatusEnum: () => orderStatusEnum,
  outboxLogs: () => outboxLogs,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentMethods: () => paymentMethods,
  paymentStatusEnum: () => paymentStatusEnum,
  payments: () => payments,
  platformAuditLogs: () => platformAuditLogs,
  productCategories: () => productCategories,
  productTypeEnum: () => productTypeEnum,
  productionBatches: () => productionBatches,
  products: () => products,
  purchaseItems: () => purchaseItems,
  purchaseStatusEnum: () => purchaseStatusEnum,
  purchases: () => purchases,
  purchasesRelations: () => purchasesRelations,
  recipeStatusEnum: () => recipeStatusEnum,
  recipes: () => recipes,
  returnItems: () => returnItems,
  returnStatusEnum: () => returnStatusEnum,
  returnTypeEnum: () => returnTypeEnum,
  returns: () => returns,
  returnsRelations: () => returnsRelations,
  salesOrderItems: () => salesOrderItems,
  salesOrders: () => salesOrders,
  salesOrdersRelations: () => salesOrdersRelations,
  serviceOrderStatusEnum: () => serviceOrderStatusEnum,
  serviceOrders: () => serviceOrders,
  serviceOrdersRelations: () => serviceOrdersRelations,
  settings: () => settings,
  settingsRelations: () => settingsRelations,
  shiftStatusEnum: () => shiftStatusEnum,
  shifts: () => shifts,
  shiftsRelations: () => shiftsRelations,
  stockMovementTypeEnum: () => stockMovementTypeEnum,
  stockMovements: () => stockMovements,
  subscriptionPlans: () => subscriptionPlans,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  suppliers: () => suppliers,
  suppliersRelations: () => suppliersRelations,
  syncStatusEnum: () => syncStatusEnum,
  tenantMembers: () => tenantMembers,
  tenants: () => tenants,
  tenantsRelations: () => tenantsRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  warehouses: () => warehouses
});

// ../../src/db/schema/core.ts
import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
var memberRoleEnum = pgEnum("member_role", ["owner", "admin", "cashier", "staff"]);
var userRoleEnum = pgEnum("user_role", ["user", "platform_admin"]);
var orderStatusEnum = pgEnum("order_status", ["draft", "confirmed", "unpaid", "partial", "paid", "receivable", "cancelled", "refunded"]);
var paymentMethodEnum = pgEnum("payment_method", ["cash", "qris", "card", "transfer", "ewallet", "receivable"]);
var paymentStatusEnum = pgEnum("payment_status", ["success", "pending", "failed", "refunded", "partial_refund"]);
var productTypeEnum = pgEnum("product_type", ["physical", "service"]);
var stockMovementTypeEnum = pgEnum("stock_movement_type", ["sale", "purchase", "return", "adjustment", "transfer_in", "transfer_out", "damage_lost", "production"]);
var syncStatusEnum = pgEnum("sync_status", ["synced", "pending", "failed", "conflict"]);
var cashCategoryTypeEnum = pgEnum("cash_category_type", ["income", "expense"]);
var shiftStatusEnum = pgEnum("shift_status", ["open", "closed"]);
var purchaseStatusEnum = pgEnum("purchase_status", ["draft", "shipped", "received", "cancelled"]);
var returnTypeEnum = pgEnum("return_type", ["sale", "purchase"]);
var returnStatusEnum = pgEnum("return_status", ["draft", "processing", "completed", "cancelled"]);
var serviceOrderStatusEnum = pgEnum("service_order_status", ["received", "in_progress", "completed", "picked_up", "cancelled"]);
var recipeStatusEnum = pgEnum("recipe_status", ["draft", "active"]);
var timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
};
var subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "past_due", "suspended", "cancelled"]);
var billingPeriodEnum = pgEnum("billing_period", ["monthly", "yearly"]);
var tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  legalName: varchar("legal_name", { length: 200 }),
  npwp: varchar("npwp", { length: 64 }),
  nib: varchar("nib", { length: 64 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 160 }),
  address: text("address"),
  planCode: varchar("plan_code", { length: 40 }).default("free").notNull(),
  billingPeriod: billingPeriodEnum("billing_period").default("monthly").notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial").notNull(),
  planValidUntil: timestamp("plan_valid_until", { withTimezone: true }),
  storageLimitMb: integer("storage_limit_mb").default(512).notNull(),
  maxBranches: integer("max_branches").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
});
var branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 160 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 40 }),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (table) => [index("branches_tenant_id_idx").on(table.tenantId)]);
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  avatarUrl: text("avatar_url"),
  ...timestamps
});
var subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  billingPeriod: billingPeriodEnum("billing_period").default("monthly").notNull(),
  durationDays: integer("duration_days").default(30).notNull(),
  trialDays: integer("trial_days").default(0).notNull(),
  monthlyPrice: numeric("monthly_price", { precision: 14, scale: 2 }).default("0").notNull(),
  yearlyPrice: numeric("yearly_price", { precision: 14, scale: 2 }),
  storageLimitMb: integer("storage_limit_mb").default(512).notNull(),
  maxBranches: integer("max_branches").default(1).notNull(),
  maxUsers: integer("max_users").default(1).notNull(),
  features: jsonb("features").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
});
var platformAuditLogs = pgTable("platform_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetId: uuid("target_id"),
  payload: jsonb("payload").default({}).notNull(),
  ...timestamps
}, (table) => [index("platform_audit_logs_actor_id_idx").on(table.actorId), index("platform_audit_logs_target_idx").on(table.targetType, table.targetId)]);
var tenantMembers = pgTable("tenant_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: memberRoleEnum("role").default("staff").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (table) => [index("tenant_members_tenant_id_idx").on(table.tenantId), index("tenant_members_user_id_idx").on(table.userId)]);
var warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  name: varchar("name", { length: 160 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps
}, (table) => [index("warehouses_tenant_id_idx").on(table.tenantId), index("warehouses_branch_id_idx").on(table.branchId)]);
var productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("product_categories_tenant_id_idx").on(table.tenantId)]);
var products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  categoryId: uuid("category_id").references(() => productCategories.id),
  name: varchar("name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  barcode: varchar("barcode", { length: 120 }),
  type: productTypeEnum("type").default("physical").notNull(),
  salePrice: numeric("sale_price", { precision: 14, scale: 2 }).notNull(),
  wholesalePrice: numeric("wholesale_price", { precision: 14, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 14, scale: 2 }),
  minimumStock: integer("minimum_stock").default(0).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("products_tenant_id_idx").on(table.tenantId), index("products_branch_id_idx").on(table.branchId), index("products_category_id_idx").on(table.categoryId)]);
var customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 160 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("customers_tenant_id_idx").on(table.tenantId), index("customers_branch_id_idx").on(table.branchId)]);
var salesOrders = pgTable("sales_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  orderNumber: varchar("order_number", { length: 80 }).notNull(),
  status: orderStatusEnum("status").default("draft").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
  discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).default("0").notNull(),
  taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).default("0").notNull(),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).default("0").notNull(),
  paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("sales_orders_tenant_id_idx").on(table.tenantId), index("sales_orders_branch_id_idx").on(table.branchId), index("sales_orders_customer_id_idx").on(table.customerId)]);
var salesOrderItems = pgTable("sales_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  salesOrderId: uuid("sales_order_id").notNull().references(() => salesOrders.id),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name", { length: 180 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).default("0").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  ...timestamps
}, (table) => [index("sales_order_items_tenant_id_idx").on(table.tenantId), index("sales_order_items_order_id_idx").on(table.salesOrderId), index("sales_order_items_product_id_idx").on(table.productId)]);
var payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
  serviceOrderId: uuid("service_order_id").references(() => serviceOrders.id),
  purchaseId: uuid("purchase_id").references(() => purchases.id),
  paymentNumber: varchar("payment_number", { length: 80 }).notNull(),
  source: varchar("source", { length: 80 }),
  method: paymentMethodEnum("method").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 120 }),
  status: paymentStatusEnum("status").default("pending").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  ...timestamps
}, (table) => [
  index("payments_tenant_id_idx").on(table.tenantId),
  index("payments_branch_id_idx").on(table.branchId),
  index("payments_order_id_idx").on(table.salesOrderId),
  index("payments_service_order_id_idx").on(table.serviceOrderId),
  index("payments_purchase_id_idx").on(table.purchaseId)
]);
var stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  type: stockMovementTypeEnum("type").notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  referenceType: varchar("reference_type", { length: 80 }),
  referenceId: uuid("reference_id"),
  notes: text("notes"),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  ...timestamps
}, (table) => [index("stock_movements_tenant_id_idx").on(table.tenantId), index("stock_movements_warehouse_id_idx").on(table.warehouseId), index("stock_movements_product_id_idx").on(table.productId)]);
var cashCategories = pgTable("cash_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 120 }).notNull(),
  type: cashCategoryTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("cash_categories_tenant_id_idx").on(table.tenantId)]);
var cash = pgTable("cash", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  ref: varchar("ref", { length: 80 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  categoryId: uuid("category_id").references(() => cashCategories.id),
  income: numeric("income", { precision: 14, scale: 2 }).default("0").notNull(),
  expense: numeric("expense", { precision: 14, scale: 2 }).default("0").notNull(),
  status: varchar("status", { length: 40 }).default("posted").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  ...timestamps
}, (table) => [index("cash_tenant_id_idx").on(table.tenantId), index("cash_branch_id_idx").on(table.branchId)]);
var settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  key: varchar("key", { length: 120 }).notNull(),
  area: varchar("area", { length: 80 }).notNull(),
  value: text("value").notNull(),
  status: varchar("status", { length: 40 }).default("active").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  ...timestamps
}, (table) => [index("settings_tenant_id_idx").on(table.tenantId), index("settings_tenant_key_idx").on(table.tenantId, table.key)]);
var shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  cashierName: varchar("cashier_name", { length: 120 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).defaultNow().notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  startCash: numeric("start_cash", { precision: 14, scale: 2 }).default("0").notNull(),
  expectedCash: numeric("expected_cash", { precision: 14, scale: 2 }),
  actualCash: numeric("actual_cash", { precision: 14, scale: 2 }),
  difference: numeric("difference", { precision: 14, scale: 2 }),
  status: shiftStatusEnum("status").default("open").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  ...timestamps
}, (table) => [index("shifts_tenant_id_idx").on(table.tenantId), index("shifts_branch_id_idx").on(table.branchId)]);
var suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  city: varchar("city", { length: 80 }),
  payable: numeric("payable", { precision: 14, scale: 2 }).default("0").notNull(),
  orders: integer("orders").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("suppliers_tenant_id_idx").on(table.tenantId)]);
var purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  code: varchar("code", { length: 80 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).default("0").notNull(),
  status: purchaseStatusEnum("status").default("draft").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("purchases_tenant_id_idx").on(table.tenantId), index("purchases_branch_id_idx").on(table.branchId), index("purchases_supplier_id_idx").on(table.supplierId)]);
var purchaseItems = pgTable("purchase_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name", { length: 180 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  ...timestamps
}, (table) => [index("purchase_items_tenant_id_idx").on(table.tenantId), index("purchase_items_purchase_id_idx").on(table.purchaseId), index("purchase_items_product_id_idx").on(table.productId)]);
var returns = pgTable("returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  code: varchar("code", { length: 80 }).notNull(),
  type: returnTypeEnum("type").notNull(),
  referenceCode: varchar("reference_code", { length: 80 }).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
  status: returnStatusEnum("status").default("draft").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("returns_tenant_id_idx").on(table.tenantId), index("returns_branch_id_idx").on(table.branchId)]);
var returnItems = pgTable("return_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  returnId: uuid("return_id").notNull().references(() => returns.id),
  productId: uuid("product_id").references(() => products.id),
  name: varchar("name", { length: 180 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  ...timestamps
}, (table) => [index("return_items_tenant_id_idx").on(table.tenantId), index("return_items_return_id_idx").on(table.returnId), index("return_items_product_id_idx").on(table.productId)]);
var serviceOrders = pgTable("service_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  customerId: uuid("customer_id").references(() => customers.id),
  code: varchar("code", { length: 80 }).notNull(),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  cost: numeric("cost", { precision: 14, scale: 2 }).default("0").notNull(),
  paidTotal: numeric("paid_total", { precision: 14, scale: 2 }).default("0").notNull(),
  status: serviceOrderStatusEnum("status").default("received").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("service_orders_tenant_id_idx").on(table.tenantId), index("service_orders_branch_id_idx").on(table.branchId), index("service_orders_customer_id_idx").on(table.customerId)]);
var paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 120 }).notNull(),
  provider: varchar("provider", { length: 80 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  accountNumber: varchar("account_number", { length: 80 }),
  accountName: varchar("account_name", { length: 160 }),
  status: varchar("status", { length: 40 }).default("active").notNull(),
  ...timestamps
}, (table) => [index("payment_methods_tenant_id_idx").on(table.tenantId)]);
var recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 180 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  batchYield: integer("batch_yield").default(1).notNull(),
  items: jsonb("items").default([]).notNull(),
  status: recipeStatusEnum("status").default("draft").notNull(),
  ...timestamps
}, (table) => [index("recipes_tenant_id_idx").on(table.tenantId), index("recipes_product_id_idx").on(table.productId)]);
var productionBatches = pgTable("production_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  recipeId: uuid("recipe_id").notNull().references(() => recipes.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  batchQty: integer("batch_qty").default(1).notNull(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps
}, (table) => [index("production_batches_tenant_id_idx").on(table.tenantId), index("production_batches_branch_id_idx").on(table.branchId), index("production_batches_recipe_id_idx").on(table.recipeId), index("production_batches_product_id_idx").on(table.productId)]);
var outboxLogs = pgTable("outbox_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  deviceId: varchar("device_id", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 120 }).notNull(),
  mutationType: varchar("mutation_type", { length: 40 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: syncStatusEnum("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  errorMessage: text("error_message"),
  ...timestamps
}, (table) => [index("outbox_logs_tenant_id_idx").on(table.tenantId), index("outbox_logs_branch_id_idx").on(table.branchId), index("outbox_logs_status_idx").on(table.status)]);
var tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  members: many(tenantMembers),
  products: many(products),
  customers: many(customers)
}));
var branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  warehouses: many(warehouses),
  salesOrders: many(salesOrders)
}));
var salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [salesOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [salesOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [salesOrders.customerId], references: [customers.id] }),
  items: many(salesOrderItems),
  payments: many(payments)
}));
var cashRelations = relations(cash, ({ one }) => ({
  tenant: one(tenants, { fields: [cash.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [cash.branchId], references: [branches.id] }),
  category: one(cashCategories, { fields: [cash.categoryId], references: [cashCategories.id] })
}));
var settingsRelations = relations(settings, ({ one }) => ({
  tenant: one(tenants, { fields: [settings.tenantId], references: [tenants.id] })
}));
var shiftsRelations = relations(shifts, ({ one }) => ({
  tenant: one(tenants, { fields: [shifts.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [shifts.branchId], references: [branches.id] })
}));
var suppliersRelations = relations(suppliers, ({ one }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] })
}));
var purchasesRelations = relations(purchases, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchases.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [purchases.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [purchases.supplierId], references: [suppliers.id] }),
  items: many(purchaseItems)
}));
var returnsRelations = relations(returns, ({ one, many }) => ({
  tenant: one(tenants, { fields: [returns.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [returns.branchId], references: [branches.id] }),
  items: many(returnItems)
}));
var serviceOrdersRelations = relations(serviceOrders, ({ one }) => ({
  tenant: one(tenants, { fields: [serviceOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [serviceOrders.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [serviceOrders.customerId], references: [customers.id] })
}));

// src/lib/env.ts
function getApiDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for API database access");
  }
  return url;
}

// src/lib/db.ts
var dbInstance = null;
function getDb() {
  if (dbInstance) {
    return dbInstance;
  }
  const client = postgres(getApiDatabaseUrl(), {
    prepare: false,
    max: 5
  });
  dbInstance = drizzle(client, { schema: schema_exports });
  return dbInstance;
}
var db = new Proxy({}, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  }
});

// ../../src/lib/crypto.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// src/features/auth/routes.ts
var authRoutes = new Hono();
function readUserId(request) {
  const userId = request.headers.get("x-user-id");
  const authorization = request.headers.get("authorization");
  if (userId) return userId;
  if (authorization?.startsWith("Bearer dev-")) return authorization.slice("Bearer dev-".length);
  return null;
}
async function findUserById(appDb, userId) {
  return appDb.query.users.findFirst({
    where: eq(users.id, userId)
  });
}
async function findUserByEmail(appDb, email) {
  return appDb.query.users.findFirst({
    where: eq(users.email, email)
  });
}
async function listActiveMemberships(appDb, userId) {
  return appDb.select({
    tenantId: tenantMembers.tenantId,
    role: tenantMembers.role,
    tenantName: tenants.name,
    tenantPlan: tenants.planCode,
    tenantBillingPeriod: tenants.billingPeriod,
    tenantSubscriptionStatus: tenants.subscriptionStatus,
    tenantPlanValidUntil: tenants.planValidUntil,
    tenantStorageLimitMb: tenants.storageLimitMb,
    tenantMaxBranches: tenants.maxBranches
  }).from(tenantMembers).innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id)).where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true), eq(tenants.isActive, true)));
}
function userResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl
  };
}
authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  const tenantName = body?.tenantName?.trim();
  const planCode = body?.planCode?.trim() || "trial-monthly";
  const billingPeriod = body?.billingPeriod === "yearly" ? "yearly" : "monthly";
  if (!name || !email || !password || !tenantName) {
    return c.json({ ok: false, message: "name, email, password, and tenantName required" }, 400);
  }
  const existingUser = await findUserByEmail(db, email);
  if (existingUser) {
    return c.json({ ok: false, message: "Email already registered" }, 409);
  }
  const planRows = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.code, planCode), eq(subscriptionPlans.isActive, true)));
  const plan = planRows[0];
  const now = /* @__PURE__ */ new Date();
  let planValidUntil = null;
  let subscriptionStatus = "active";
  let storageLimitMb = 1024;
  let maxBranches = 1;
  if (plan) {
    storageLimitMb = plan.storageLimitMb;
    maxBranches = plan.maxBranches;
    if (plan.trialDays > 0) {
      subscriptionStatus = "trial";
      planValidUntil = new Date(now);
      planValidUntil.setDate(planValidUntil.getDate() + plan.trialDays);
    } else if (plan.code.startsWith("free")) {
      subscriptionStatus = "active";
      planValidUntil = null;
    } else {
      subscriptionStatus = "active";
      planValidUntil = new Date(now);
      planValidUntil.setDate(planValidUntil.getDate() + plan.durationDays);
    }
  } else {
    subscriptionStatus = "trial";
    planValidUntil = new Date(now);
    planValidUntil.setDate(planValidUntil.getDate() + 14);
  }
  const userId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const warehouseId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(tenants).values({
      id: tenantId,
      name: tenantName,
      planCode,
      billingPeriod,
      subscriptionStatus,
      planValidUntil,
      storageLimitMb,
      maxBranches,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(branches).values({
      id: branchId,
      tenantId,
      name: "Cabang Utama",
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(warehouses).values({
      id: warehouseId,
      tenantId,
      branchId,
      name: "Gudang Utama",
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    await tx.insert(tenantMembers).values({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      role: "owner",
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  });
  const memberships = await listActiveMemberships(db, userId);
  return c.json({
    ok: true,
    accessToken: `dev-${userId}`,
    user: { id: userId, email, name, role: "user" },
    defaultBranchId: branchId,
    defaultWarehouseId: warehouseId,
    memberships
  });
});
authRoutes.get("/me", async (c) => {
  const userId = readUserId(c.req.raw);
  if (!userId) {
    return c.json({ ok: false, message: "x-user-id header or dev token required" }, 401);
  }
  const user = await findUserById(db, userId);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const memberships = await listActiveMemberships(db, user.id);
  return c.json({ ok: true, user: userResponse(user), memberships });
});
authRoutes.get("/tenants", async (c) => {
  const userId = readUserId(c.req.raw);
  if (!userId) {
    return c.json({ ok: false, message: "x-user-id header or dev token required" }, 401);
  }
  const user = await findUserById(db, userId);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const memberships = await listActiveMemberships(db, user.id);
  return c.json({ ok: true, items: memberships });
});
authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim();
  if (!email || !password) {
    return c.json({ ok: false, message: "email and password required" }, 400);
  }
  const user = await findUserByEmail(db, email);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return c.json({ ok: false, message: "Email tidak terdaftar atau kata sandi salah" }, 401);
  }
  const memberships = await listActiveMemberships(db, user.id);
  if (memberships.length === 0 && user.role !== "platform_admin") {
    return c.json({ ok: false, message: "Active tenant membership required" }, 403);
  }
  return c.json({
    ok: true,
    accessToken: `dev-${user.id}`,
    user: userResponse(user),
    memberships
  });
});
authRoutes.post("/reset-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const newPassword = body?.newPassword?.trim();
  if (!email || !newPassword) {
    return c.json({ ok: false, message: "email and newPassword required" }, 400);
  }
  const user = await findUserByEmail(db, email);
  if (!user) {
    return c.json({ ok: false, message: "Email tidak ditemukan" }, 404);
  }
  await db.update(users).set({
    passwordHash: await hashPassword(newPassword),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id));
  return c.json({ ok: true });
});

// src/features/health/routes.ts
import { Hono as Hono2 } from "hono";
var healthRoutes = new Hono2();
healthRoutes.get("/", (c) => {
  return c.json({ ok: true, service: "kotacom-api", version: "v1" });
});

// src/features/reports/routes.ts
import { Hono as Hono3 } from "hono";

// src/features/reports/service.ts
import { and as and2, count, desc, eq as eq2, gte, inArray, lte, ne, sql, sum } from "drizzle-orm";
function n(val) {
  return Number(val ?? 0);
}
async function getSalesSummary(db2, input) {
  const filters = [eq2(salesOrders.tenantId, input.tenantId)];
  if (input.branchId) filters.push(eq2(salesOrders.branchId, input.branchId));
  if (input.from) filters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) filters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [summary] = await db2.select({
    orderCount: count(salesOrders.id),
    grossSales: sum(salesOrders.grandTotal),
    paidTotal: sum(salesOrders.paidTotal)
  }).from(salesOrders).where(and2(...filters));
  return {
    orderCount: Number(summary?.orderCount ?? 0),
    grossSales: String(summary?.grossSales ?? "0"),
    paidTotal: String(summary?.paidTotal ?? "0")
  };
}
async function getPaymentSummary(db2, input) {
  const filters = [eq2(payments.tenantId, input.tenantId)];
  if (input.branchId) filters.push(eq2(payments.branchId, input.branchId));
  if (input.from) filters.push(gte(payments.createdAt, new Date(input.from)));
  if (input.to) filters.push(lte(payments.createdAt, new Date(input.to)));
  const rows = await db2.select({
    method: payments.method,
    total: sum(payments.amount),
    count: count(payments.id)
  }).from(payments).where(and2(...filters)).groupBy(payments.method).orderBy(payments.method);
  return rows.map((row) => ({
    method: row.method,
    total: String(row.total ?? "0"),
    count: Number(row.count ?? 0)
  }));
}
async function getInventoryMovementSummary(db2, input) {
  const filters = [eq2(stockMovements.tenantId, input.tenantId)];
  if (input.branchId) filters.push(eq2(stockMovements.branchId, input.branchId));
  if (input.from) filters.push(gte(stockMovements.createdAt, new Date(input.from)));
  if (input.to) filters.push(lte(stockMovements.createdAt, new Date(input.to)));
  const rows = await db2.select({
    type: stockMovements.type,
    totalQty: sum(stockMovements.qty),
    count: count(stockMovements.id)
  }).from(stockMovements).where(and2(...filters)).groupBy(stockMovements.type).orderBy(stockMovements.type);
  return rows.map((row) => ({
    type: row.type,
    totalQty: String(row.totalQty ?? "0"),
    count: Number(row.count ?? 0)
  }));
}
async function getProfitLoss(db2, input) {
  const tenantId = input.tenantId;
  const saleFilters = [eq2(salesOrders.tenantId, tenantId), inArray(salesOrders.status, ["paid", "partial"])];
  if (input.branchId) saleFilters.push(eq2(salesOrders.branchId, input.branchId));
  if (input.from) saleFilters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) saleFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [salesRev] = await db2.select({ revenue: sum(salesOrders.grandTotal), orderCount: count(salesOrders.id) }).from(salesOrders).where(and2(...saleFilters));
  const svcFilters = [eq2(serviceOrders.tenantId, tenantId), inArray(serviceOrders.status, ["completed", "picked_up"])];
  if (input.branchId) svcFilters.push(eq2(serviceOrders.branchId, input.branchId));
  if (input.from) svcFilters.push(gte(serviceOrders.date, new Date(input.from)));
  if (input.to) svcFilters.push(lte(serviceOrders.date, new Date(input.to)));
  const [svcRev] = await db2.select({ revenue: sum(serviceOrders.cost), orderCount: count(serviceOrders.id) }).from(serviceOrders).where(and2(...svcFilters));
  const cogsFilters = [eq2(salesOrders.tenantId, tenantId)];
  if (input.branchId) cogsFilters.push(eq2(salesOrders.branchId, input.branchId));
  if (input.from) cogsFilters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) cogsFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [cogsRow] = await db2.select({ cogs: sum(sql`${salesOrderItems.qty} * COALESCE(${products.costPrice}, 0)`) }).from(salesOrderItems).innerJoin(salesOrders, eq2(salesOrderItems.salesOrderId, salesOrders.id)).leftJoin(products, eq2(salesOrderItems.productId, products.id)).where(and2(...cogsFilters));
  const cashFilters = [eq2(cash.tenantId, tenantId)];
  if (input.branchId) cashFilters.push(eq2(cash.branchId, input.branchId));
  if (input.from) cashFilters.push(gte(cash.date, new Date(input.from)));
  if (input.to) cashFilters.push(lte(cash.date, new Date(input.to)));
  const expenseRows = await db2.select({
    category: cashCategories.name,
    total: sum(cash.expense)
  }).from(cash).leftJoin(cashCategories, eq2(cash.categoryId, cashCategories.id)).where(and2(...cashFilters, eq2(cashCategories.type, "expense"), sql`${cash.expense} > 0`)).groupBy(cashCategories.name);
  const [incomeRow] = await db2.select({ total: sum(cash.income) }).from(cash).leftJoin(cashCategories, eq2(cash.categoryId, cashCategories.id)).where(and2(...cashFilters, eq2(cashCategories.type, "income"), sql`${cash.income} > 0`));
  const payFilters = [eq2(payments.tenantId, tenantId), eq2(payments.status, "success")];
  if (input.branchId) payFilters.push(eq2(payments.branchId, input.branchId));
  if (input.from) payFilters.push(gte(payments.createdAt, new Date(input.from)));
  if (input.to) payFilters.push(lte(payments.createdAt, new Date(input.to)));
  const paymentBreakdown = await db2.select({ method: payments.method, total: sum(payments.amount), count: count(payments.id) }).from(payments).where(and2(...payFilters)).groupBy(payments.method).orderBy(payments.method);
  const salesRevenue = n(salesRev?.revenue);
  const serviceRevenue = n(svcRev?.revenue);
  const totalRevenue = salesRevenue + serviceRevenue;
  const cogs = n(cogsRow?.cogs);
  const grossProfit = totalRevenue - cogs;
  const totalExpenses = expenseRows.reduce((s, r) => s + n(r.total), 0);
  const otherIncome = n(incomeRow?.total);
  const netProfit = grossProfit - totalExpenses + otherIncome;
  return {
    salesRevenue,
    serviceRevenue,
    totalRevenue,
    salesOrderCount: Number(salesRev?.orderCount ?? 0),
    serviceOrderCount: Number(svcRev?.orderCount ?? 0),
    cogs,
    grossProfit,
    expenses: expenseRows.map((r) => ({ category: r.category ?? "Lainnya", total: n(r.total) })),
    totalExpenses,
    otherIncome,
    netProfit,
    paymentBreakdown: paymentBreakdown.map((r) => ({
      method: r.method,
      total: n(r.total),
      count: Number(r.count ?? 0)
    }))
  };
}
async function getBalanceSheet(db2, input) {
  const tenantId = input.tenantId;
  const cashFilters = [eq2(cash.tenantId, tenantId)];
  if (input.branchId) cashFilters.push(eq2(cash.branchId, input.branchId));
  if (input.to) cashFilters.push(lte(cash.date, new Date(input.to)));
  const [cashRow] = await db2.select({
    totalIncome: sum(cash.income),
    totalExpense: sum(cash.expense)
  }).from(cash).where(and2(...cashFilters));
  const cashOnHand = n(cashRow?.totalIncome) - n(cashRow?.totalExpense);
  const arFilters = [eq2(salesOrders.tenantId, tenantId), ne(salesOrders.status, "cancelled")];
  if (input.branchId) arFilters.push(eq2(salesOrders.branchId, input.branchId));
  if (input.to) arFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const [arRow] = await db2.select({ outstanding: sum(sql`${salesOrders.grandTotal} - ${salesOrders.paidTotal}`) }).from(salesOrders).where(and2(...arFilters));
  const accountsReceivable = Math.max(0, n(arRow?.outstanding));
  const invRows = await db2.select({
    productId: stockMovements.productId,
    totalQty: sum(stockMovements.qty)
  }).from(stockMovements).where(eq2(stockMovements.tenantId, tenantId)).groupBy(stockMovements.productId);
  const productIds = invRows.map((r) => r.productId);
  const costMap = /* @__PURE__ */ new Map();
  if (productIds.length > 0) {
    const prodRows = await db2.select({ id: products.id, costPrice: products.costPrice }).from(products).where(and2(eq2(products.tenantId, tenantId), inArray(products.id, productIds)));
    for (const p of prodRows) {
      costMap.set(p.id, n(p.costPrice));
    }
  }
  let inventoryValue = 0;
  const inventoryDetail = invRows.map((r) => {
    const stock = n(r.totalQty);
    const unitCost = costMap.get(r.productId) ?? 0;
    const value = Math.max(0, stock) * unitCost;
    inventoryValue += value;
    return { productId: r.productId, stock: Math.max(0, stock), unitCost, value };
  });
  const totalAssets = cashOnHand + accountsReceivable + inventoryValue;
  const supplierFilters = [eq2(suppliers.tenantId, tenantId)];
  const [payableRow] = await db2.select({ total: sum(suppliers.payable) }).from(suppliers).where(and2(...supplierFilters));
  const accountsPayable = n(payableRow?.total);
  const totalLiabilities = accountsPayable;
  const allTimeSaleFilters = [eq2(salesOrders.tenantId, tenantId), inArray(salesOrders.status, ["paid", "partial"])];
  const [allTimeSalesRev] = await db2.select({ revenue: sum(salesOrders.grandTotal) }).from(salesOrders).where(and2(...allTimeSaleFilters));
  const allTimeSvcFilters = [eq2(serviceOrders.tenantId, tenantId), inArray(serviceOrders.status, ["completed", "picked_up"])];
  const [allTimeSvcRev] = await db2.select({ revenue: sum(serviceOrders.cost) }).from(serviceOrders).where(and2(...allTimeSvcFilters));
  const [allTimeCogs] = await db2.select({ cogs: sum(sql`${salesOrderItems.qty} * COALESCE(${products.costPrice}, 0)`) }).from(salesOrderItems).innerJoin(salesOrders, eq2(salesOrderItems.salesOrderId, salesOrders.id)).leftJoin(products, eq2(salesOrderItems.productId, products.id)).where(eq2(salesOrders.tenantId, tenantId));
  const [allTimeExpense] = await db2.select({ total: sum(cash.expense) }).from(cash).leftJoin(cashCategories, eq2(cash.categoryId, cashCategories.id)).where(and2(eq2(cash.tenantId, tenantId), eq2(cashCategories.type, "expense")));
  const [allTimeIncome] = await db2.select({ total: sum(cash.income) }).from(cash).leftJoin(cashCategories, eq2(cash.categoryId, cashCategories.id)).where(and2(eq2(cash.tenantId, tenantId), eq2(cashCategories.type, "income")));
  const retainedEarnings = n(allTimeSalesRev?.revenue) + n(allTimeSvcRev?.revenue) - n(allTimeCogs?.cogs) - n(allTimeExpense?.total) + n(allTimeIncome?.total);
  const totalEquity = retainedEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  return {
    assets: {
      cashOnHand,
      accountsReceivable,
      inventoryValue,
      inventoryDetail,
      totalAssets
    },
    liabilities: {
      accountsPayable,
      totalLiabilities
    },
    equity: {
      retainedEarnings,
      totalEquity
    },
    totalLiabilitiesAndEquity
  };
}
async function getSalesReport(db2, input) {
  const tenantId = input.tenantId;
  const saleFilters = [eq2(salesOrders.tenantId, tenantId), ne(salesOrders.status, "cancelled")];
  if (input.branchId) saleFilters.push(eq2(salesOrders.branchId, input.branchId));
  if (input.from) saleFilters.push(gte(salesOrders.createdAt, new Date(input.from)));
  if (input.to) saleFilters.push(lte(salesOrders.createdAt, new Date(input.to)));
  const dailySales = await db2.select({
    date: sql`DATE(${salesOrders.createdAt})`.as("date"),
    orderCount: count(salesOrders.id),
    revenue: sum(salesOrders.grandTotal),
    paid: sum(salesOrders.paidTotal)
  }).from(salesOrders).where(and2(...saleFilters)).groupBy(sql`DATE(${salesOrders.createdAt})`).orderBy(sql`DATE(${salesOrders.createdAt})`);
  const svcFilters = [eq2(serviceOrders.tenantId, tenantId), ne(serviceOrders.status, "cancelled")];
  if (input.branchId) svcFilters.push(eq2(serviceOrders.branchId, input.branchId));
  if (input.from) svcFilters.push(gte(serviceOrders.date, new Date(input.from)));
  if (input.to) svcFilters.push(lte(serviceOrders.date, new Date(input.to)));
  const dailyService = await db2.select({
    date: sql`DATE(${serviceOrders.date})`.as("date"),
    orderCount: count(serviceOrders.id),
    revenue: sum(serviceOrders.cost)
  }).from(serviceOrders).where(and2(...svcFilters)).groupBy(sql`DATE(${serviceOrders.date})`).orderBy(sql`DATE(${serviceOrders.date})`);
  const topProductRows = await db2.select({
    productId: salesOrderItems.productId,
    name: salesOrderItems.name,
    totalQty: sum(salesOrderItems.qty),
    totalRevenue: sum(salesOrderItems.subtotal)
  }).from(salesOrderItems).innerJoin(salesOrders, eq2(salesOrderItems.salesOrderId, salesOrders.id)).where(and2(...saleFilters)).groupBy(salesOrderItems.productId, salesOrderItems.name).orderBy(desc(sum(salesOrderItems.subtotal))).limit(20);
  const [totals] = await db2.select({
    orderCount: count(salesOrders.id),
    revenue: sum(salesOrders.grandTotal),
    paid: sum(salesOrders.paidTotal)
  }).from(salesOrders).where(and2(...saleFilters));
  const [svcTotals] = await db2.select({
    orderCount: count(serviceOrders.id),
    revenue: sum(serviceOrders.cost)
  }).from(serviceOrders).where(and2(...svcFilters));
  const totalRevenue = n(totals?.revenue) + n(svcTotals?.revenue);
  const totalOrders = Number(totals?.orderCount ?? 0) + Number(svcTotals?.orderCount ?? 0);
  return {
    summary: {
      totalRevenue,
      salesRevenue: n(totals?.revenue),
      serviceRevenue: n(svcTotals?.revenue),
      totalOrders,
      salesOrders: Number(totals?.orderCount ?? 0),
      serviceOrders: Number(svcTotals?.orderCount ?? 0),
      totalPaid: n(totals?.paid),
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
    },
    dailySales: dailySales.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount ?? 0),
      revenue: n(r.revenue),
      paid: n(r.paid)
    })),
    dailyService: dailyService.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount ?? 0),
      revenue: n(r.revenue)
    })),
    topProducts: topProductRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      totalQty: n(r.totalQty),
      totalRevenue: n(r.totalRevenue)
    }))
  };
}
async function getPaymentReport(db2, input) {
  const tenantId = input.tenantId;
  const payFilters = [eq2(payments.tenantId, tenantId), eq2(payments.status, "success")];
  if (input.branchId) payFilters.push(eq2(payments.branchId, input.branchId));
  if (input.from) payFilters.push(gte(payments.createdAt, new Date(input.from)));
  if (input.to) payFilters.push(lte(payments.createdAt, new Date(input.to)));
  const byMethod = await db2.select({ method: payments.method, total: sum(payments.amount), count: count(payments.id) }).from(payments).where(and2(...payFilters)).groupBy(payments.method).orderBy(payments.method);
  const bySource = await db2.select({ source: payments.source, total: sum(payments.amount), count: count(payments.id) }).from(payments).where(and2(...payFilters)).groupBy(payments.source).orderBy(payments.source);
  const dailyFlow = await db2.select({
    date: sql`DATE(${payments.createdAt})`.as("date"),
    method: payments.method,
    total: sum(payments.amount)
  }).from(payments).where(and2(...payFilters)).groupBy(sql`DATE(${payments.createdAt})`, payments.method).orderBy(sql`DATE(${payments.createdAt})`);
  const arFilters = [eq2(salesOrders.tenantId, tenantId), ne(salesOrders.status, "cancelled"), sql`${salesOrders.grandTotal} > ${salesOrders.paidTotal}`];
  if (input.branchId) arFilters.push(eq2(salesOrders.branchId, input.branchId));
  const receivables = await db2.select({
    id: salesOrders.id,
    orderNumber: salesOrders.orderNumber,
    grandTotal: salesOrders.grandTotal,
    paidTotal: salesOrders.paidTotal,
    outstanding: sql`${salesOrders.grandTotal} - ${salesOrders.paidTotal}`,
    createdAt: salesOrders.createdAt
  }).from(salesOrders).where(and2(...arFilters)).orderBy(salesOrders.createdAt).limit(50);
  const now = /* @__PURE__ */ new Date();
  const aging = { current: 0, days7: 0, days30: 0, days60: 0, over60: 0 };
  for (const r of receivables) {
    const days = Math.floor((now.getTime() - new Date(r.createdAt).getTime()) / 864e5);
    const amount = n(r.outstanding);
    if (days <= 7) aging.current += amount;
    else if (days <= 30) aging.days7 += amount;
    else if (days <= 60) aging.days30 += amount;
    else aging.over60 += amount;
  }
  const totalCollected = byMethod.reduce((s, r) => s + n(r.total), 0);
  const totalReceivable = receivables.reduce((s, r) => s + n(r.outstanding), 0);
  return {
    summary: {
      totalCollected,
      totalReceivable,
      transactionCount: byMethod.reduce((s, r) => s + Number(r.count ?? 0), 0)
    },
    byMethod: byMethod.map((r) => ({ method: r.method, total: n(r.total), count: Number(r.count ?? 0) })),
    bySource: bySource.map((r) => ({ source: r.source ?? "Unknown", total: n(r.total), count: Number(r.count ?? 0) })),
    dailyFlow: dailyFlow.map((r) => ({ date: r.date, method: r.method, total: n(r.total) })),
    aging,
    receivables: receivables.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      grandTotal: n(r.grandTotal),
      paidTotal: n(r.paidTotal),
      outstanding: n(r.outstanding),
      createdAt: r.createdAt.toISOString()
    }))
  };
}
async function getInventoryReport(db2, input) {
  const tenantId = input.tenantId;
  const prodRows = await db2.select({
    id: products.id,
    name: products.name,
    sku: products.sku,
    type: products.type,
    costPrice: products.costPrice,
    salePrice: products.salePrice,
    minimumStock: products.minimumStock,
    isActive: products.isActive
  }).from(products).where(and2(eq2(products.tenantId, tenantId), eq2(products.isActive, true)));
  const movementTotals = await db2.select({
    productId: stockMovements.productId,
    totalQty: sum(stockMovements.qty)
  }).from(stockMovements).where(eq2(stockMovements.tenantId, tenantId)).groupBy(stockMovements.productId);
  const stockMap = new Map(movementTotals.map((r) => [r.productId, Math.max(0, n(r.totalQty))]));
  const valuation = prodRows.map((p) => {
    const stock = stockMap.get(p.id) ?? 0;
    const unitCost = n(p.costPrice);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      type: p.type,
      stock,
      unitCost,
      unitPrice: n(p.salePrice),
      value: stock * unitCost,
      minimumStock: p.minimumStock,
      isLow: stock <= p.minimumStock
    };
  });
  const movFilters = [eq2(stockMovements.tenantId, tenantId)];
  if (input.branchId) movFilters.push(eq2(stockMovements.branchId, input.branchId));
  if (input.from) movFilters.push(gte(stockMovements.createdAt, new Date(input.from)));
  if (input.to) movFilters.push(lte(stockMovements.createdAt, new Date(input.to)));
  const movementSummary = await db2.select({
    type: stockMovements.type,
    totalQty: sum(sql`ABS(${stockMovements.qty})`),
    count: count(stockMovements.id)
  }).from(stockMovements).where(and2(...movFilters)).groupBy(stockMovements.type).orderBy(stockMovements.type);
  const movementDetail = await db2.select({
    id: stockMovements.id,
    productName: products.name,
    type: stockMovements.type,
    qty: stockMovements.qty,
    referenceType: stockMovements.referenceType,
    notes: stockMovements.notes,
    createdAt: stockMovements.createdAt
  }).from(stockMovements).leftJoin(products, eq2(stockMovements.productId, products.id)).where(and2(...movFilters)).orderBy(desc(stockMovements.createdAt)).limit(200);
  const totalSkus = valuation.length;
  const totalValue = valuation.reduce((s, v) => s + v.value, 0);
  const lowStockCount = valuation.filter((v) => v.isLow).length;
  return {
    summary: {
      totalSkus,
      totalValue,
      lowStockCount
    },
    valuation,
    movementSummary: movementSummary.map((r) => ({
      type: r.type,
      totalQty: n(r.totalQty),
      count: Number(r.count ?? 0)
    })),
    movementDetail: movementDetail.map((r) => ({
      id: r.id,
      productName: r.productName ?? "Unknown",
      type: r.type,
      qty: n(r.qty),
      referenceType: r.referenceType,
      notes: r.notes,
      createdAt: r.createdAt.toISOString()
    })),
    lowStock: valuation.filter((v) => v.isLow)
  };
}

// src/features/reports/routes.ts
var reportRoutes = new Hono3();
function getInput(c) {
  return {
    tenantId: c.req.query("tenantId") ?? "",
    branchId: c.req.query("branchId") ?? void 0,
    from: c.req.query("from") ?? void 0,
    to: c.req.query("to") ?? void 0
  };
}
reportRoutes.get("/sales/summary", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const summary = await getSalesSummary(db, input);
  return c.json({ ok: true, summary });
});
reportRoutes.get("/payments/summary", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const items = await getPaymentSummary(db, input);
  return c.json({ ok: true, items });
});
reportRoutes.get("/inventory/movements", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const items = await getInventoryMovementSummary(db, input);
  return c.json({ ok: true, items });
});
reportRoutes.get("/profit-loss", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getProfitLoss(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/balance-sheet", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getBalanceSheet(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/sales", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getSalesReport(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/payments", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getPaymentReport(db, input);
  return c.json({ ok: true, data });
});
reportRoutes.get("/inventory", async (c) => {
  const input = getInput(c);
  if (!input.tenantId) return c.json({ ok: false, message: "tenantId required" }, 400);
  const data = await getInventoryReport(db, input);
  return c.json({ ok: true, data });
});

// src/features/sync/routes.ts
import { and as and4, desc as desc2, eq as eq4, gte as gte2, isNull } from "drizzle-orm";
import { Hono as Hono4 } from "hono";

// src/features/auth/middleware.ts
async function authMiddleware(c, next) {
  const userId = readUserId(c.req.raw);
  if (!userId) {
    return c.json({ ok: false, message: "Authentication required" }, 401);
  }
  c.set("userId", userId);
  await next();
}

// ../../packages/shared-contracts/src/sync/api.ts
function buildSyncPushResponse(items) {
  return {
    ok: true,
    summary: {
      total: items.length,
      applied: items.filter((item) => item.status === "applied").length,
      conflict: items.filter((item) => item.status === "conflict").length,
      rejected: items.filter((item) => item.status === "rejected").length
    },
    items
  };
}

// ../../packages/shared-contracts/src/sync/mappers.ts
function serverSyncStatusToApiItemStatus(status) {
  if (status === "pending") return "pending";
  if (status === "synced") return "applied";
  if (status === "conflict") return "conflict";
  return "rejected";
}

// ../../packages/shared-contracts/src/sync/validation.ts
var syncEntityTypes = /* @__PURE__ */ new Set(["product", "customer", "sale", "payment", "stock_movement", "cash", "cash_category", "setting", "shift", "product_category", "supplier", "purchase", "return", "service_order", "payment_method", "recipe"]);
var syncMutationTypes = /* @__PURE__ */ new Set(["create", "update", "delete"]);
var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var prefixedIdPattern = /^[a-z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}
function isPrefixedId(value) {
  return typeof value === "string" && prefixedIdPattern.test(value);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readOptionalUuid(value) {
  if (value === void 0) return void 0;
  if (value === null) return null;
  if (!isUuid(value)) return void 0;
  return value;
}
function parseSyncPullQuery(input) {
  if (!isUuid(input.tenantId)) {
    return { ok: false, message: "tenantId required" };
  }
  const branchId = readOptionalUuid(input.branchId);
  if (input.branchId !== void 0 && branchId === void 0) {
    return { ok: false, message: "branchId invalid" };
  }
  let since;
  if (input.since) {
    since = new Date(input.since);
    if (Number.isNaN(since.getTime())) {
      return { ok: false, message: "since invalid" };
    }
  }
  return {
    ok: true,
    value: {
      tenantId: input.tenantId,
      branchId: branchId ?? void 0,
      since
    }
  };
}
function parseSyncPushBody(input) {
  if (!isRecord(input)) {
    return { ok: false, message: "body invalid" };
  }
  if (!isUuid(input.tenantId)) {
    return { ok: false, message: "tenantId required" };
  }
  const branchId = readOptionalUuid(input.branchId);
  if (input.branchId !== void 0 && input.branchId !== null && branchId === void 0) {
    return { ok: false, message: "branchId invalid" };
  }
  if (typeof input.deviceId !== "string" || input.deviceId.trim().length === 0) {
    return { ok: false, message: "deviceId required" };
  }
  if (!Array.isArray(input.mutations) || input.mutations.length === 0) {
    return { ok: false, message: "mutations required" };
  }
  const mutations = [];
  for (const mutation of input.mutations) {
    if (!isRecord(mutation)) {
      return { ok: false, message: "mutations invalid" };
    }
    if (mutation.entityType === "setting") {
      if (typeof mutation.entityId !== "string" || mutation.entityId.trim().length === 0) {
        return { ok: false, message: "mutations entityId invalid" };
      }
    } else if (!isUuid(mutation.entityId) && !isPrefixedId(mutation.entityId)) {
      return { ok: false, message: "mutations entityId invalid" };
    }
    if (!syncEntityTypes.has(mutation.entityType)) {
      return { ok: false, message: "mutations entityType invalid" };
    }
    if (!syncMutationTypes.has(mutation.mutationType)) {
      return { ok: false, message: "mutations mutationType invalid" };
    }
    if (mutation.clientMutationId !== void 0 && typeof mutation.clientMutationId !== "string") {
      return { ok: false, message: "mutations clientMutationId invalid" };
    }
    if (mutation.status !== void 0 && mutation.status !== "queued" && mutation.status !== "syncing" && mutation.status !== "synced" && mutation.status !== "failed" && mutation.status !== "conflict") {
      return { ok: false, message: "mutations status invalid" };
    }
    mutations.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType,
      mutationType: mutation.mutationType,
      clientMutationId: mutation.clientMutationId,
      payload: mutation.payload,
      status: mutation.status
    });
  }
  return {
    ok: true,
    value: {
      tenantId: input.tenantId,
      branchId: branchId ?? null,
      deviceId: input.deviceId.trim(),
      mutations
    }
  };
}

// src/features/sync/apply.ts
import { and as and3, eq as eq3 } from "drizzle-orm";
var uuidPattern2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(value) {
  return uuidPattern2.test(value);
}
function toNumeric(value) {
  if (value === void 0 || value === null) return "0";
  if (typeof value === "number") return String(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}
function toNullableUuid(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) ? value : null;
}
function mapClientProductType(value) {
  if (value === "Jasa" || value === "service") return "service";
  return "physical";
}
function mapClientProductStatus(value) {
  if (value === "Arsip" || value === false) return false;
  return true;
}
function mapClientPaymentMethod(value) {
  if (value === "tunai" || value === "cash") return "cash";
  if (value === "qris") return "qris";
  if (value === "kartu" || value === "card") return "card";
  if (value === "transfer") return "transfer";
  if (value === "e-wallet" || value === "ewallet") return "ewallet";
  if (value === "piutang" || value === "receivable") return "receivable";
  return "cash";
}
function mapClientPaymentStatus(value) {
  if (value === "Berhasil" || value === "success") return "success";
  if (value === "Pending" || value === "pending") return "pending";
  if (value === "Gagal" || value === "failed") return "failed";
  if (value === "Refund" || value === "refunded") return "refunded";
  return "pending";
}
function mapClientSalesOrderStatus(value) {
  if (value === "Draft" || value === "draft") return "draft";
  if (value === "Lunas" || value === "paid") return "paid";
  if (value === "Sebagian" || value === "partial") return "partial";
  if (value === "Belum Bayar" || value === "unpaid") return "unpaid";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  if (value === "Piutang" || value === "receivable") return "receivable";
  return "draft";
}
function mapClientStockMovementType(value) {
  const allowed = /* @__PURE__ */ new Set(["sale", "purchase", "return", "adjustment", "transfer_in", "transfer_out", "damage_lost"]);
  if (typeof value === "string" && allowed.has(value)) return value;
  return "adjustment";
}
async function applyProduct(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(products).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq3(products.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(products).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    name: payload.name ?? "",
    sku: payload.sku ?? null,
    barcode: payload.barcode ?? null,
    type: mapClientProductType(payload.type),
    salePrice: toNumeric(payload.price),
    costPrice: null,
    wholesalePrice: null,
    minimumStock: 0,
    imageUrl: null,
    isActive: mapClientProductStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: products.id,
    set: {
      name: payload.name ?? "",
      sku: payload.sku ?? null,
      barcode: payload.barcode ?? null,
      type: mapClientProductType(payload.type),
      salePrice: toNumeric(payload.price),
      isActive: mapClientProductStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applySale(db2, ctx, entityId, mutationType, payload) {
  if (!ctx.branchId) {
    throw new Error("branchId required for sale mutation");
  }
  const now = /* @__PURE__ */ new Date();
  if (mutationType === "delete") {
    await db2.delete(salesOrderItems).where(eq3(salesOrderItems.salesOrderId, entityId));
    await db2.delete(salesOrders).where(eq3(salesOrders.id, entityId));
    return;
  }
  await db2.insert(salesOrders).values({
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
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: salesOrders.id,
    set: {
      status: mapClientSalesOrderStatus(payload.status),
      subtotal: toNumeric(payload.subtotal),
      discountTotal: toNumeric(payload.discountTotal),
      taxTotal: toNumeric(payload.taxTotal),
      grandTotal: toNumeric(payload.grandTotal),
      paidTotal: toNumeric(payload.paidTotal),
      syncStatus: "synced",
      updatedAt: now
    }
  });
  if (Array.isArray(payload.items)) {
    await db2.delete(salesOrderItems).where(eq3(salesOrderItems.salesOrderId, entityId));
    if (payload.items.length > 0) {
      await db2.insert(salesOrderItems).values(
        payload.items.map((item) => ({
          id: item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID(),
          tenantId: ctx.tenantId,
          salesOrderId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? "",
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          discountTotal: "0",
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }
}
async function applyPayment(db2, ctx, entityId, mutationType, payload) {
  if (!ctx.branchId) {
    throw new Error("branchId required for payment mutation");
  }
  if (mutationType === "delete") {
    await db2.delete(payments).where(eq3(payments.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(payments).values({
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
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: payments.id,
    set: {
      status: mapClientPaymentStatus(payload.status),
      amount: toNumeric(payload.amount),
      source: payload.source ?? void 0,
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyStockMovement(db2, ctx, entityId, mutationType, payload) {
  if (!payload.productId) {
    throw new Error("productId required for stock_movement mutation");
  }
  if (mutationType === "delete") {
    await db2.delete(stockMovements).where(eq3(stockMovements.id, entityId));
    return;
  }
  let warehouseId = payload.warehouseId;
  if (!warehouseId && ctx.branchId) {
    const defaultWarehouse = await db2.select({ id: warehouses.id }).from(warehouses).where(and3(eq3(warehouses.tenantId, ctx.tenantId), eq3(warehouses.branchId, ctx.branchId), eq3(warehouses.isDefault, true))).limit(1).then((rows) => rows[0]);
    warehouseId = defaultWarehouse?.id;
  }
  if (!warehouseId) {
    const anyWarehouse = await db2.select({ id: warehouses.id }).from(warehouses).where(eq3(warehouses.tenantId, ctx.tenantId)).limit(1).then((rows) => rows[0]);
    warehouseId = anyWarehouse?.id;
  }
  if (!warehouseId) {
    throw new Error("No warehouse found for stock_movement mutation");
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(stockMovements).values({
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
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: stockMovements.id,
    set: {
      qty: toNumeric(payload.qty),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
function mapClientCustomerStatus(value) {
  if (value === "Nonaktif" || value === false) return false;
  return true;
}
function mapClientCategoryStatus(value) {
  if (value === "Arsip" || value === "Nonaktif" || value === false) return false;
  return true;
}
function mapClientCashCategoryType(value) {
  if (value === "Pemasukan" || value === "income") return "income";
  return "expense";
}
function mapClientShiftStatus(value) {
  if (value === "closed" || value === "tutup") return "closed";
  return "open";
}
function mapClientPurchaseStatus(value) {
  if (value === "Draft" || value === "draft") return "draft";
  if (value === "Dikirim" || value === "shipped") return "shipped";
  if (value === "Diterima" || value === "received") return "received";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  return "draft";
}
function mapClientReturnType(value) {
  if (value === "Pembelian" || value === "purchase") return "purchase";
  return "sale";
}
function mapClientReturnStatus(value) {
  if (value === "Draft" || value === "draft") return "draft";
  if (value === "Diproses" || value === "processing") return "processing";
  if (value === "Selesai" || value === "completed") return "completed";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  return "draft";
}
function mapClientServiceOrderStatus(value) {
  if (value === "Diterima" || value === "received") return "received";
  if (value === "Dikerjakan" || value === "in_progress") return "in_progress";
  if (value === "Selesai" || value === "completed") return "completed";
  if (value === "Diambil" || value === "picked_up") return "picked_up";
  if (value === "Batal" || value === "cancelled") return "cancelled";
  return "received";
}
async function applyCustomer(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(customers).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq3(customers.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(customers).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    name: payload.name ?? "",
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    address: payload.city ?? null,
    notes: null,
    isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: customers.id,
    set: {
      name: payload.name ?? "",
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.city ?? null,
      isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyProductCategory(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(productCategories).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq3(productCategories.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(productCategories).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: productCategories.id,
    set: {
      name: payload.name ?? "",
      isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyCashCategory(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(cashCategories).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq3(cashCategories.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(cashCategories).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    type: mapClientCashCategoryType(payload.type),
    isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: cashCategories.id,
    set: {
      name: payload.name ?? "",
      type: mapClientCashCategoryType(payload.type),
      isActive: mapClientCategoryStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyCash(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(cash).where(eq3(cash.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(cash).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    ref: payload.ref ?? payload.id ?? entityId,
    date: payload.date ? new Date(payload.date) : now,
    categoryId: toNullableUuid(payload.categoryId ?? payload.category),
    income: toNumeric(payload.income),
    expense: toNumeric(payload.expense),
    status: payload.status ?? "posted",
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: cash.id,
    set: {
      income: toNumeric(payload.income),
      expense: toNumeric(payload.expense),
      status: payload.status ?? "posted",
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applySetting(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(settings).where(eq3(settings.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  const settingKey = payload.key ?? payload.setting ?? entityId;
  const area = payload.area ?? "general";
  const existing = await db2.query.settings.findFirst({
    where: and3(eq3(settings.tenantId, ctx.tenantId), eq3(settings.key, settingKey))
  });
  if (existing) {
    await db2.update(settings).set({
      value: payload.value ?? "",
      area,
      status: payload.status ?? "active",
      syncStatus: "synced",
      updatedAt: now
    }).where(eq3(settings.id, existing.id));
  } else {
    const uuid2 = /^[0-9a-f]{8}-/i.test(entityId) ? entityId : crypto.randomUUID();
    await db2.insert(settings).values({
      id: uuid2,
      tenantId: ctx.tenantId,
      key: settingKey,
      area,
      value: payload.value ?? "",
      status: payload.status ?? "active",
      syncStatus: "synced",
      createdAt: now,
      updatedAt: now
    });
  }
}
async function applyShift(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(shifts).where(eq3(shifts.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(shifts).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    cashierName: payload.cashierName ?? "",
    startTime: payload.startTime ? new Date(payload.startTime) : now,
    endTime: payload.endTime ? new Date(payload.endTime) : null,
    startCash: toNumeric(payload.startCash),
    expectedCash: payload.expectedCash !== void 0 ? toNumeric(payload.expectedCash) : null,
    actualCash: payload.actualCash !== void 0 ? toNumeric(payload.actualCash) : null,
    difference: payload.difference !== void 0 ? toNumeric(payload.difference) : null,
    status: mapClientShiftStatus(payload.status),
    syncStatus: "synced",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: shifts.id,
    set: {
      endTime: payload.endTime ? new Date(payload.endTime) : null,
      expectedCash: payload.expectedCash !== void 0 ? toNumeric(payload.expectedCash) : void 0,
      actualCash: payload.actualCash !== void 0 ? toNumeric(payload.actualCash) : void 0,
      difference: payload.difference !== void 0 ? toNumeric(payload.difference) : void 0,
      status: mapClientShiftStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applySupplier(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.update(suppliers).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq3(suppliers.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(suppliers).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    phone: payload.phone ?? null,
    city: payload.city ?? null,
    payable: toNumeric(payload.payable),
    orders: payload.orders ?? 0,
    isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: suppliers.id,
    set: {
      name: payload.name ?? "",
      phone: payload.phone ?? null,
      city: payload.city ?? null,
      payable: toNumeric(payload.payable),
      orders: payload.orders ?? 0,
      isActive: mapClientCustomerStatus(payload.status ?? payload.isActive),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyPurchase(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(purchaseItems).where(eq3(purchaseItems.purchaseId, entityId));
    await db2.delete(purchases).where(eq3(purchases.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(purchases).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    supplierId: toNullableUuid(payload.supplierId),
    code: payload.code ?? entityId,
    date: payload.date ? new Date(payload.date) : now,
    subtotal: toNumeric(payload.subtotal),
    grandTotal: toNumeric(payload.grandTotal),
    status: mapClientPurchaseStatus(payload.status),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: purchases.id,
    set: {
      subtotal: toNumeric(payload.subtotal),
      grandTotal: toNumeric(payload.grandTotal),
      status: mapClientPurchaseStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
  if (Array.isArray(payload.items)) {
    await db2.delete(purchaseItems).where(eq3(purchaseItems.purchaseId, entityId));
    if (payload.items.length > 0) {
      await db2.insert(purchaseItems).values(
        payload.items.map((item) => ({
          id: item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID(),
          tenantId: ctx.tenantId,
          purchaseId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? "",
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }
}
async function applyReturn(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(returnItems).where(eq3(returnItems.returnId, entityId));
    await db2.delete(returns).where(eq3(returns.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(returns).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    code: payload.code ?? entityId,
    type: mapClientReturnType(payload.type),
    referenceCode: payload.referenceCode ?? "",
    date: payload.date ? new Date(payload.date) : now,
    total: toNumeric(payload.total),
    status: mapClientReturnStatus(payload.status),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: returns.id,
    set: {
      total: toNumeric(payload.total),
      status: mapClientReturnStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
  if (Array.isArray(payload.items)) {
    await db2.delete(returnItems).where(eq3(returnItems.returnId, entityId));
    if (payload.items.length > 0) {
      await db2.insert(returnItems).values(
        payload.items.map((item) => ({
          id: item.id && isValidUuid(item.id) ? item.id : crypto.randomUUID(),
          tenantId: ctx.tenantId,
          returnId: entityId,
          productId: toNullableUuid(item.productId),
          name: item.name ?? "",
          qty: toNumeric(item.qty),
          unitPrice: toNumeric(item.unitPrice),
          subtotal: toNumeric(item.subtotal),
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }
}
async function applyServiceOrder(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(serviceOrders).where(eq3(serviceOrders.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(serviceOrders).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    customerId: toNullableUuid(payload.customerId),
    code: payload.code ?? entityId,
    customerName: payload.customerName ?? "",
    description: payload.description ?? null,
    date: payload.date ? new Date(payload.date) : now,
    cost: toNumeric(payload.cost),
    paidTotal: toNumeric(payload.paidTotal),
    status: mapClientServiceOrderStatus(payload.status),
    syncStatus: "synced",
    version: 1,
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: serviceOrders.id,
    set: {
      customerName: payload.customerName ?? "",
      description: payload.description ?? null,
      cost: toNumeric(payload.cost),
      paidTotal: toNumeric(payload.paidTotal),
      status: mapClientServiceOrderStatus(payload.status),
      syncStatus: "synced",
      updatedAt: now
    }
  });
}
async function applyPaymentMethod(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(paymentMethods).where(eq3(paymentMethods.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(paymentMethods).values({
    id: entityId,
    tenantId: ctx.tenantId,
    name: payload.name ?? "",
    provider: payload.provider ?? "",
    type: payload.type ?? "",
    accountNumber: payload.accountNumber ?? null,
    accountName: payload.accountName ?? null,
    status: payload.status === "Tidak Aktif" ? "inactive" : "active",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: paymentMethods.id,
    set: {
      name: payload.name ?? "",
      provider: payload.provider ?? "",
      type: payload.type ?? "",
      accountNumber: payload.accountNumber ?? null,
      accountName: payload.accountName ?? null,
      status: payload.status === "Tidak Aktif" ? "inactive" : "active",
      updatedAt: now
    }
  });
}
async function applyRecipe(db2, ctx, entityId, mutationType, payload) {
  if (mutationType === "delete") {
    await db2.delete(recipes).where(eq3(recipes.id, entityId));
    return;
  }
  const now = /* @__PURE__ */ new Date();
  await db2.insert(recipes).values({
    id: entityId,
    tenantId: ctx.tenantId,
    productId: payload.productId ?? entityId,
    productName: payload.productName ?? "",
    name: payload.name ?? "",
    batchYield: payload.batchYield ?? 1,
    items: payload.items ?? [],
    status: payload.status === "Aktif" ? "active" : "draft",
    createdAt: now,
    updatedAt: now
  }).onConflictDoUpdate({
    target: recipes.id,
    set: {
      productId: payload.productId ?? entityId,
      productName: payload.productName ?? "",
      name: payload.name ?? "",
      batchYield: payload.batchYield ?? 1,
      items: payload.items ?? [],
      status: payload.status === "Aktif" ? "active" : "draft",
      updatedAt: now
    }
  });
}
async function applyMutation(db2, ctx, entityType, entityId, mutationType, payload) {
  if (entityType === "product") {
    await applyProduct(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "sale") {
    await applySale(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "payment") {
    await applyPayment(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "stock_movement") {
    await applyStockMovement(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "customer") {
    await applyCustomer(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "product_category") {
    await applyProductCategory(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "cash_category") {
    await applyCashCategory(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "cash") {
    await applyCash(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "setting") {
    await applySetting(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "shift") {
    await applyShift(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "supplier") {
    await applySupplier(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "purchase") {
    await applyPurchase(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "return") {
    await applyReturn(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "service_order") {
    await applyServiceOrder(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "payment_method") {
    await applyPaymentMethod(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
  if (entityType === "recipe") {
    await applyRecipe(db2, ctx, entityId, mutationType, payload ?? {});
    return;
  }
}

// src/features/sync/routes.ts
var syncRoutes = new Hono4();
syncRoutes.use("*", authMiddleware);
syncRoutes.get("/pull", async (c) => {
  const parsed = parseSyncPullQuery({
    tenantId: c.req.query("tenantId"),
    branchId: c.req.query("branchId"),
    since: c.req.query("since")
  });
  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400);
  }
  const branchFilter = parsed.value.branchId ? eq4(products.branchId, parsed.value.branchId) : void 0;
  const sinceFilter = parsed.value.since ? gte2(products.updatedAt, parsed.value.since) : void 0;
  const productRows = await db.query.products.findMany({
    where: and4(eq4(products.tenantId, parsed.value.tenantId), isNull(products.deletedAt), branchFilter, sinceFilter),
    orderBy: [desc2(products.updatedAt)],
    limit: 100
  });
  const saleBranchFilter = parsed.value.branchId ? eq4(salesOrders.branchId, parsed.value.branchId) : void 0;
  const saleSinceFilter = parsed.value.since ? gte2(salesOrders.updatedAt, parsed.value.since) : void 0;
  const saleRows = await db.query.salesOrders.findMany({
    where: and4(eq4(salesOrders.tenantId, parsed.value.tenantId), isNull(salesOrders.deletedAt), saleBranchFilter, saleSinceFilter),
    orderBy: [desc2(salesOrders.updatedAt)],
    limit: 100
  });
  const paymentBranchFilter = parsed.value.branchId ? eq4(payments.branchId, parsed.value.branchId) : void 0;
  const paymentSinceFilter = parsed.value.since ? gte2(payments.updatedAt, parsed.value.since) : void 0;
  const paymentRows = await db.query.payments.findMany({
    where: and4(eq4(payments.tenantId, parsed.value.tenantId), isNull(payments.deletedAt), paymentBranchFilter, paymentSinceFilter),
    orderBy: [desc2(payments.updatedAt)],
    limit: 100
  });
  const stockBranchFilter = parsed.value.branchId ? eq4(stockMovements.branchId, parsed.value.branchId) : void 0;
  const stockSinceFilter = parsed.value.since ? gte2(stockMovements.updatedAt, parsed.value.since) : void 0;
  const stockRows = await db.query.stockMovements.findMany({
    where: and4(eq4(stockMovements.tenantId, parsed.value.tenantId), isNull(stockMovements.deletedAt), stockBranchFilter, stockSinceFilter),
    orderBy: [desc2(stockMovements.updatedAt)],
    limit: 100
  });
  const customerSinceFilter = parsed.value.since ? gte2(customers.updatedAt, parsed.value.since) : void 0;
  const customerRows = await db.query.customers.findMany({
    where: and4(eq4(customers.tenantId, parsed.value.tenantId), isNull(customers.deletedAt), customerSinceFilter),
    orderBy: [desc2(customers.updatedAt)],
    limit: 100
  });
  const categoriesSinceFilter = parsed.value.since ? gte2(productCategories.updatedAt, parsed.value.since) : void 0;
  const categoryRows = await db.query.productCategories.findMany({
    where: and4(eq4(productCategories.tenantId, parsed.value.tenantId), isNull(productCategories.deletedAt), categoriesSinceFilter),
    orderBy: [desc2(productCategories.updatedAt)],
    limit: 100
  });
  const cashCategoriesSinceFilter = parsed.value.since ? gte2(cashCategories.updatedAt, parsed.value.since) : void 0;
  const cashCategoryRows = await db.query.cashCategories.findMany({
    where: and4(eq4(cashCategories.tenantId, parsed.value.tenantId), isNull(cashCategories.deletedAt), cashCategoriesSinceFilter),
    orderBy: [desc2(cashCategories.updatedAt)],
    limit: 100
  });
  const cashBranchFilter = parsed.value.branchId ? eq4(cash.branchId, parsed.value.branchId) : void 0;
  const cashSinceFilter = parsed.value.since ? gte2(cash.updatedAt, parsed.value.since) : void 0;
  const cashRows = await db.query.cash.findMany({
    where: and4(eq4(cash.tenantId, parsed.value.tenantId), cashBranchFilter, cashSinceFilter),
    orderBy: [desc2(cash.updatedAt)],
    limit: 100
  });
  const settingsSinceFilter = parsed.value.since ? gte2(settings.updatedAt, parsed.value.since) : void 0;
  const settingRows = await db.query.settings.findMany({
    where: and4(eq4(settings.tenantId, parsed.value.tenantId), settingsSinceFilter),
    orderBy: [desc2(settings.updatedAt)],
    limit: 100
  });
  const shiftsBranchFilter = parsed.value.branchId ? eq4(shifts.branchId, parsed.value.branchId) : void 0;
  const shiftsSinceFilter = parsed.value.since ? gte2(shifts.updatedAt, parsed.value.since) : void 0;
  const shiftRows = await db.query.shifts.findMany({
    where: and4(eq4(shifts.tenantId, parsed.value.tenantId), shiftsBranchFilter, shiftsSinceFilter),
    orderBy: [desc2(shifts.updatedAt)],
    limit: 100
  });
  const supplierSinceFilter = parsed.value.since ? gte2(suppliers.updatedAt, parsed.value.since) : void 0;
  const supplierRows = await db.query.suppliers.findMany({
    where: and4(eq4(suppliers.tenantId, parsed.value.tenantId), isNull(suppliers.deletedAt), supplierSinceFilter),
    orderBy: [desc2(suppliers.updatedAt)],
    limit: 100
  });
  const purchaseBranchFilter = parsed.value.branchId ? eq4(purchases.branchId, parsed.value.branchId) : void 0;
  const purchaseSinceFilter = parsed.value.since ? gte2(purchases.updatedAt, parsed.value.since) : void 0;
  const purchaseRows = await db.query.purchases.findMany({
    where: and4(eq4(purchases.tenantId, parsed.value.tenantId), purchaseBranchFilter, purchaseSinceFilter),
    orderBy: [desc2(purchases.updatedAt)],
    limit: 100
  });
  const returnBranchFilter = parsed.value.branchId ? eq4(returns.branchId, parsed.value.branchId) : void 0;
  const returnSinceFilter = parsed.value.since ? gte2(returns.updatedAt, parsed.value.since) : void 0;
  const returnRows = await db.query.returns.findMany({
    where: and4(eq4(returns.tenantId, parsed.value.tenantId), returnBranchFilter, returnSinceFilter),
    orderBy: [desc2(returns.updatedAt)],
    limit: 100
  });
  const serviceOrderBranchFilter = parsed.value.branchId ? eq4(serviceOrders.branchId, parsed.value.branchId) : void 0;
  const serviceOrderSinceFilter = parsed.value.since ? gte2(serviceOrders.updatedAt, parsed.value.since) : void 0;
  const serviceOrderRows = await db.query.serviceOrders.findMany({
    where: and4(eq4(serviceOrders.tenantId, parsed.value.tenantId), serviceOrderBranchFilter, serviceOrderSinceFilter),
    orderBy: [desc2(serviceOrders.updatedAt)],
    limit: 100
  });
  const paymentMethodsSinceFilter = parsed.value.since ? gte2(paymentMethods.updatedAt, parsed.value.since) : void 0;
  const paymentMethodsRows = await db.query.paymentMethods.findMany({
    where: and4(eq4(paymentMethods.tenantId, parsed.value.tenantId), paymentMethodsSinceFilter),
    orderBy: [desc2(paymentMethods.updatedAt)],
    limit: 100
  });
  const recipeSinceFilter = parsed.value.since ? gte2(recipes.updatedAt, parsed.value.since) : void 0;
  const recipeRows = await db.query.recipes.findMany({
    where: and4(eq4(recipes.tenantId, parsed.value.tenantId), recipeSinceFilter),
    orderBy: [desc2(recipes.updatedAt)],
    limit: 100
  });
  const items = [
    ...productRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "product",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        type: row.type === "service" ? "Jasa" : "Produk Fisik",
        price: Number(row.salePrice),
        salePrice: Number(row.salePrice),
        costPrice: row.costPrice ? Number(row.costPrice) : void 0,
        wholesalePrice: row.wholesalePrice ? Number(row.wholesalePrice) : void 0,
        imageUrl: row.imageUrl,
        status: row.isActive ? "Aktif" : "Arsip",
        isActive: row.isActive,
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...saleRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "sale",
      mutationType: "update",
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
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...paymentRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "payment",
      mutationType: "update",
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
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...stockRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "stock_movement",
      mutationType: "update",
      payload: {
        id: row.id,
        productId: row.productId,
        warehouseId: row.warehouseId,
        type: row.type,
        qty: Number(row.qty),
        referenceType: row.referenceType,
        referenceId: row.referenceId,
        notes: row.notes
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...customerRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "customer",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: null,
        receivable: 0,
        orders: 0,
        status: row.isActive ? "Aktif" : "Nonaktif",
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...categoryRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "product_category",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        status: row.isActive ? "Aktif" : "Arsip"
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus ?? "synced"),
      serverSyncStatus: row.syncStatus ?? "synced",
      updatedAt: row.updatedAt.toISOString()
    })),
    ...cashCategoryRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "cash_category",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        type: row.type === "income" ? "Pemasukan" : "Pengeluaran",
        status: row.isActive ? "Aktif" : "Nonaktif"
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...cashRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "cash",
      mutationType: "update",
      payload: {
        id: row.id,
        ref: row.ref,
        date: row.date.toISOString(),
        account: "",
        category: row.categoryId ?? "",
        income: Number(row.income),
        expense: Number(row.expense),
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...settingRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "setting",
      mutationType: "update",
      payload: {
        id: row.key,
        key: row.key,
        area: row.area,
        value: row.value,
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...shiftRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "shift",
      mutationType: "update",
      payload: {
        id: row.id,
        cashierName: row.cashierName,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime?.toISOString() ?? null,
        startCash: Number(row.startCash),
        expectedCash: row.expectedCash ? Number(row.expectedCash) : void 0,
        actualCash: row.actualCash ? Number(row.actualCash) : void 0,
        difference: row.difference ? Number(row.difference) : void 0,
        status: row.status
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...supplierRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "supplier",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        phone: row.phone ?? "",
        city: row.city ?? "",
        payable: Number(row.payable),
        orders: row.orders,
        status: row.isActive ? "Aktif" : "Nonaktif",
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...purchaseRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "purchase",
      mutationType: "update",
      payload: {
        id: row.id,
        code: row.code,
        supplierId: row.supplierId,
        date: row.date.toISOString(),
        subtotal: Number(row.subtotal),
        grandTotal: Number(row.grandTotal),
        status: row.status,
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...returnRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "return",
      mutationType: "update",
      payload: {
        id: row.id,
        code: row.code,
        type: row.type === "sale" ? "Penjualan" : "Pembelian",
        referenceCode: row.referenceCode,
        date: row.date.toISOString(),
        total: Number(row.total),
        status: row.status,
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...serviceOrderRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "service_order",
      mutationType: "update",
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
        version: row.version
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
      updatedAt: row.updatedAt.toISOString()
    })),
    ...paymentMethodsRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "payment_method",
      mutationType: "update",
      payload: {
        id: row.id,
        name: row.name,
        provider: row.provider,
        type: row.type,
        accountNumber: row.accountNumber,
        accountName: row.accountName,
        status: row.status === "inactive" ? "Tidak Aktif" : "Aktif"
      },
      transportStatus: "applied",
      serverSyncStatus: "synced",
      updatedAt: row.updatedAt.toISOString()
    })),
    ...recipeRows.map((row) => ({
      id: row.id,
      entityId: row.id,
      entityType: "recipe",
      mutationType: "update",
      payload: {
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        name: row.name,
        batchYield: row.batchYield,
        items: row.items,
        status: row.status === "active" ? "Aktif" : "Draft"
      },
      transportStatus: "applied",
      serverSyncStatus: "synced",
      updatedAt: row.updatedAt.toISOString()
    }))
  ];
  items.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
  const cursor = items.at(0)?.updatedAt ?? parsed.value.since?.toISOString() ?? null;
  return c.json({ ok: true, cursor, items });
});
syncRoutes.post("/push", async (c) => {
  const parsed = parseSyncPushBody(await c.req.json().catch(() => null));
  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400);
  }
  const now = /* @__PURE__ */ new Date();
  const items = [];
  for (const mutation of parsed.value.mutations) {
    const payload = mutation.payload;
    if (payload === void 0) {
      await db.insert(outboxLogs).values({
        tenantId: parsed.value.tenantId,
        branchId: parsed.value.branchId ?? null,
        deviceId: parsed.value.deviceId,
        entityType: mutation.entityType,
        entityId: mutation.entityId,
        mutationType: mutation.mutationType,
        payload: { message: "payload missing" },
        status: "failed",
        attempts: 1,
        errorMessage: "payload missing",
        createdAt: now,
        updatedAt: now
      });
      items.push({
        entityId: mutation.entityId,
        entityType: mutation.entityType,
        mutationType: mutation.mutationType,
        status: "rejected",
        message: "payload missing"
      });
      continue;
    }
    let itemStatus = "applied";
    let message;
    try {
      await applyMutation(
        db,
        { tenantId: parsed.value.tenantId, branchId: parsed.value.branchId },
        mutation.entityType,
        mutation.entityId,
        mutation.mutationType,
        payload
      );
    } catch (error) {
      itemStatus = "rejected";
      message = error instanceof Error ? error.message : "apply failed";
    }
    await db.insert(outboxLogs).values({
      tenantId: parsed.value.tenantId,
      branchId: parsed.value.branchId ?? null,
      deviceId: parsed.value.deviceId,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      mutationType: mutation.mutationType,
      payload,
      status: itemStatus === "applied" ? "synced" : "failed",
      attempts: 1,
      errorMessage: itemStatus === "rejected" ? message ?? "rejected" : null,
      createdAt: now,
      updatedAt: now
    });
    items.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType,
      mutationType: mutation.mutationType,
      status: itemStatus,
      message
    });
  }
  return c.json(buildSyncPushResponse(items));
});

// src/features/platform/routes.ts
import { count as count2, desc as desc3, eq as eq6, sql as sql2 } from "drizzle-orm";
import { Hono as Hono5 } from "hono";
import { z } from "zod";

// src/features/platform/middleware.ts
import { eq as eq5 } from "drizzle-orm";
async function platformAdminMiddleware(c, next) {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ ok: false, message: "Authentication required" }, 401);
  }
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq5(users.id, userId));
  const user = rows[0];
  if (!user || user.role !== "platform_admin") {
    return c.json({ ok: false, message: "Platform admin only" }, 403);
  }
  c.set("platformAdminId", user.id);
  await next();
}

// src/features/platform/audit.ts
async function writeAuditLog(input) {
  await db.insert(platformAuditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    payload: input.payload ?? {},
    updatedAt: /* @__PURE__ */ new Date()
  });
}

// src/features/platform/routes.ts
var platformRoutes = new Hono5();
platformRoutes.use("*", authMiddleware, platformAdminMiddleware);
platformRoutes.get("/tenants", async (c) => {
  const result = await db.select({
    id: tenants.id,
    tenantName: tenants.name,
    ownerName: users.name,
    ownerEmail: users.email,
    city: tenants.address,
    packageName: tenants.planCode,
    subscriptionStatus: tenants.subscriptionStatus,
    planValidUntil: tenants.planValidUntil,
    storageLimitGb: sql2`${tenants.storageLimitMb} / 1024.0`,
    maxBranches: tenants.maxBranches,
    isActive: tenants.isActive
  }).from(tenants).leftJoin(tenantMembers, eq6(tenants.id, tenantMembers.tenantId)).leftJoin(users, eq6(tenantMembers.userId, users.id)).where(eq6(tenantMembers.role, "owner"));
  return c.json({ ok: true, items: result });
});
platformRoutes.get("/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const tenant = await db.select().from(tenants).where(eq6(tenants.id, id)).then((r) => r[0]);
  if (!tenant) return c.json({ ok: false, message: "Tenant not found" }, 404);
  const members = await db.select({
    id: tenantMembers.id,
    userId: tenantMembers.userId,
    role: tenantMembers.role,
    isActive: tenantMembers.isActive,
    name: users.name,
    email: users.email
  }).from(tenantMembers).leftJoin(users, eq6(tenantMembers.userId, users.id)).where(eq6(tenantMembers.tenantId, id));
  return c.json({ ok: true, item: tenant, members });
});
var updateTenantSchema = z.object({
  planCode: z.string().min(1).max(40).optional(),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
  planValidUntil: z.string().datetime().nullable().optional(),
  storageLimitMb: z.number().int().min(0).optional(),
  maxBranches: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z.enum(["trial", "active", "past_due", "suspended", "cancelled"]).optional()
});
platformRoutes.patch("/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateTenantSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const dbSet = { updatedAt: /* @__PURE__ */ new Date() };
  if (body.planCode !== void 0) dbSet.planCode = body.planCode;
  if (body.billingPeriod !== void 0) dbSet.billingPeriod = body.billingPeriod;
  if (body.storageLimitMb !== void 0) dbSet.storageLimitMb = body.storageLimitMb;
  if (body.maxBranches !== void 0) dbSet.maxBranches = body.maxBranches;
  if (body.isActive !== void 0) dbSet.isActive = body.isActive;
  if (body.subscriptionStatus !== void 0) dbSet.subscriptionStatus = body.subscriptionStatus;
  if (body.planValidUntil !== void 0) {
    dbSet.planValidUntil = body.planValidUntil === null ? null : new Date(body.planValidUntil);
  }
  const updated = await db.update(tenants).set(dbSet).where(eq6(tenants.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Tenant not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "tenant.updated",
    targetType: "tenant",
    targetId: id,
    payload: body
  });
  return c.json({ ok: true, item: updated[0] });
});
platformRoutes.post("/tenants/:id/suspend", async (c) => {
  const id = c.req.param("id");
  const actorId = c.get("platformAdminId");
  await db.update(tenants).set({ isActive: false, subscriptionStatus: "suspended", updatedAt: /* @__PURE__ */ new Date() }).where(eq6(tenants.id, id));
  await writeAuditLog({ actorId, action: "tenant.suspended", targetType: "tenant", targetId: id });
  return c.json({ ok: true });
});
platformRoutes.post("/tenants/:id/reactivate", async (c) => {
  const id = c.req.param("id");
  const actorId = c.get("platformAdminId");
  await db.update(tenants).set({ isActive: true, subscriptionStatus: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq6(tenants.id, id));
  await writeAuditLog({ actorId, action: "tenant.reactivated", targetType: "tenant", targetId: id });
  return c.json({ ok: true });
});
platformRoutes.get("/plans", async (c) => {
  const includeInactive = c.req.query("includeInactive") === "true";
  const condition = includeInactive ? void 0 : eq6(subscriptionPlans.isActive, true);
  const items = await db.select().from(subscriptionPlans).where(condition).orderBy(subscriptionPlans.monthlyPrice);
  return c.json({ ok: true, items });
});
var planSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
  durationDays: z.number().int().min(1).optional(),
  trialDays: z.number().int().min(0).optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0).nullable().optional(),
  storageLimitMb: z.number().int().min(0),
  maxBranches: z.number().int().min(1),
  maxUsers: z.number().int().min(1),
  features: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional()
});
platformRoutes.post("/plans", async (c) => {
  const body = planSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const inserted = await db.insert(subscriptionPlans).values({
    code: body.code,
    name: body.name,
    billingPeriod: body.billingPeriod ?? "monthly",
    durationDays: body.durationDays ?? 30,
    trialDays: body.trialDays ?? 0,
    monthlyPrice: String(body.monthlyPrice),
    yearlyPrice: body.yearlyPrice === null || body.yearlyPrice === void 0 ? null : String(body.yearlyPrice),
    storageLimitMb: body.storageLimitMb,
    maxBranches: body.maxBranches,
    maxUsers: body.maxUsers,
    features: body.features ?? {},
    isActive: body.isActive ?? true,
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  await writeAuditLog({
    actorId,
    action: "plan.created",
    targetType: "plan",
    targetId: inserted[0].id,
    payload: body
  });
  return c.json({ ok: true, item: inserted[0] });
});
var planUpdateSchema = planSchema.partial();
platformRoutes.patch("/plans/:id", async (c) => {
  const id = c.req.param("id");
  const body = planUpdateSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const dbSet = { updatedAt: /* @__PURE__ */ new Date() };
  if (body.code !== void 0) dbSet.code = body.code;
  if (body.name !== void 0) dbSet.name = body.name;
  if (body.billingPeriod !== void 0) dbSet.billingPeriod = body.billingPeriod;
  if (body.durationDays !== void 0) dbSet.durationDays = body.durationDays;
  if (body.trialDays !== void 0) dbSet.trialDays = body.trialDays;
  if (body.monthlyPrice !== void 0) dbSet.monthlyPrice = String(body.monthlyPrice);
  if (body.yearlyPrice !== void 0) {
    dbSet.yearlyPrice = body.yearlyPrice === null ? null : String(body.yearlyPrice);
  }
  if (body.storageLimitMb !== void 0) dbSet.storageLimitMb = body.storageLimitMb;
  if (body.maxBranches !== void 0) dbSet.maxBranches = body.maxBranches;
  if (body.maxUsers !== void 0) dbSet.maxUsers = body.maxUsers;
  if (body.features !== void 0) dbSet.features = body.features;
  if (body.isActive !== void 0) dbSet.isActive = body.isActive;
  const updated = await db.update(subscriptionPlans).set(dbSet).where(eq6(subscriptionPlans.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Plan not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "plan.updated",
    targetType: "plan",
    targetId: id,
    payload: body
  });
  return c.json({ ok: true, item: updated[0] });
});
platformRoutes.delete("/plans/:id", async (c) => {
  const id = c.req.param("id");
  const actorId = c.get("platformAdminId");
  const updated = await db.update(subscriptionPlans).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq6(subscriptionPlans.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Plan not found" }, 404);
  await writeAuditLog({ actorId, action: "plan.deleted", targetType: "plan", targetId: id });
  return c.json({ ok: true });
});
platformRoutes.get("/users", async (c) => {
  const items = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    membershipCount: count2(tenantMembers.id)
  }).from(users).leftJoin(tenantMembers, eq6(users.id, tenantMembers.userId)).groupBy(users.id).orderBy(desc3(users.createdAt));
  return c.json({ ok: true, items });
});
platformRoutes.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await db.select().from(users).where(eq6(users.id, id)).then((r) => r[0]);
  if (!user) return c.json({ ok: false, message: "User not found" }, 404);
  const memberships = await db.select({
    id: tenantMembers.id,
    tenantId: tenantMembers.tenantId,
    role: tenantMembers.role,
    isActive: tenantMembers.isActive,
    tenantName: tenants.name
  }).from(tenantMembers).leftJoin(tenants, eq6(tenantMembers.tenantId, tenants.id)).where(eq6(tenantMembers.userId, id));
  return c.json({ ok: true, item: user, memberships });
});
var updateUserSchema = z.object({
  role: z.enum(["user", "platform_admin"]).optional()
});
platformRoutes.patch("/users/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateUserSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  if (id === actorId && body.role && body.role !== "platform_admin") {
    return c.json({ ok: false, message: "Cannot demote yourself" }, 400);
  }
  const updated = await db.update(users).set({ ...body, updatedAt: /* @__PURE__ */ new Date() }).where(eq6(users.id, id)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "User not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "user.role_changed",
    targetType: "user",
    targetId: id,
    payload: body
  });
  return c.json({ ok: true, item: updated[0] });
});
var updateMembershipSchema = z.object({
  role: z.enum(["owner", "admin", "cashier", "staff"])
});
platformRoutes.patch("/users/:id/memberships/:memberId", async (c) => {
  const memberId = c.req.param("memberId");
  const body = updateMembershipSchema.parse(await c.req.json());
  const actorId = c.get("platformAdminId");
  const updated = await db.update(tenantMembers).set({ ...body, updatedAt: /* @__PURE__ */ new Date() }).where(eq6(tenantMembers.id, memberId)).returning();
  if (updated.length === 0) return c.json({ ok: false, message: "Membership not found" }, 404);
  await writeAuditLog({
    actorId,
    action: "membership.role_changed",
    targetType: "membership",
    targetId: memberId,
    payload: { userId: c.req.param("id"), ...body }
  });
  return c.json({ ok: true, item: updated[0] });
});
platformRoutes.get("/audit", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const offset = Number(c.req.query("offset") ?? 0);
  const items = await db.select({
    id: platformAuditLogs.id,
    actorId: platformAuditLogs.actorId,
    actorName: users.name,
    action: platformAuditLogs.action,
    targetType: platformAuditLogs.targetType,
    targetId: platformAuditLogs.targetId,
    payload: platformAuditLogs.payload,
    createdAt: platformAuditLogs.createdAt
  }).from(platformAuditLogs).leftJoin(users, eq6(platformAuditLogs.actorId, users.id)).orderBy(desc3(platformAuditLogs.createdAt)).limit(limit).offset(offset);
  const total = await db.select({ c: count2() }).from(platformAuditLogs).then((r) => r[0].c);
  return c.json({ ok: true, items, total });
});

// src/features/subscription/routes.ts
import { and as and5, eq as eq7 } from "drizzle-orm";
import { Hono as Hono6 } from "hono";
import { z as z2 } from "zod";
var subscriptionRoutes = new Hono6();
subscriptionRoutes.use("*", authMiddleware);
subscriptionRoutes.get("/plans", async (c) => {
  const period = c.req.query("period");
  const conditions = [eq7(subscriptionPlans.isActive, true)];
  if (period === "monthly" || period === "yearly") {
    conditions.push(eq7(subscriptionPlans.billingPeriod, period));
  }
  const items = await db.select().from(subscriptionPlans).where(and5(...conditions)).orderBy(subscriptionPlans.monthlyPrice);
  return c.json({ ok: true, items });
});
subscriptionRoutes.get("/plans/:code", async (c) => {
  const code = c.req.param("code");
  const rows = await db.select().from(subscriptionPlans).where(and5(eq7(subscriptionPlans.code, code), eq7(subscriptionPlans.isActive, true)));
  if (rows.length === 0) return c.json({ ok: false, message: "Plan not found" }, 404);
  return c.json({ ok: true, item: rows[0] });
});
var subscribeSchema = z2.object({
  planCode: z2.string().min(1).max(40),
  billingPeriod: z2.enum(["monthly", "yearly"]).optional()
});
async function requireTenantOwnerOrAdmin(userId, tenantId) {
  const rows = await db.select({ role: tenantMembers.role }).from(tenantMembers).where(and5(eq7(tenantMembers.tenantId, tenantId), eq7(tenantMembers.userId, userId), eq7(tenantMembers.isActive, true)));
  const member = rows[0];
  if (!member || !["owner", "admin"].includes(member.role)) {
    return { ok: false, message: "Owner or admin only" };
  }
  return { ok: true, role: member.role };
}
subscriptionRoutes.post("/tenants/:tenantId/subscribe", async (c) => {
  const tenantId = c.req.param("tenantId");
  const userId = c.get("userId");
  const body = subscribeSchema.parse(await c.req.json());
  const planRows = await db.select().from(subscriptionPlans).where(and5(eq7(subscriptionPlans.code, body.planCode), eq7(subscriptionPlans.isActive, true)));
  const plan = planRows[0];
  if (!plan) return c.json({ ok: false, message: "Plan not found" }, 404);
  const billingPeriod = body.billingPeriod ?? plan.billingPeriod;
  const tenantRows = await db.select().from(tenants).where(eq7(tenants.id, tenantId));
  if (tenantRows.length === 0) return c.json({ ok: false, message: "Tenant not found" }, 404);
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId);
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403);
  const now = /* @__PURE__ */ new Date();
  const trialDays = plan.trialDays ?? 0;
  const subscriptionStatus = trialDays > 0 ? "trial" : "active";
  const planValidUntil = trialDays > 0 ? (() => {
    const date = new Date(now);
    date.setDate(date.getDate() + trialDays);
    return date;
  })() : plan.code.startsWith("free") ? null : (() => {
    const date = new Date(now);
    date.setDate(date.getDate() + plan.durationDays);
    return date;
  })();
  const [updated] = await db.update(tenants).set({
    planCode: plan.code,
    billingPeriod,
    subscriptionStatus,
    planValidUntil,
    storageLimitMb: plan.storageLimitMb,
    maxBranches: plan.maxBranches,
    isActive: true,
    updatedAt: now
  }).where(eq7(tenants.id, tenantId)).returning();
  await writeAuditLog({
    actorId: userId,
    action: "tenant.subscribed",
    targetType: "subscription",
    targetId: tenantId,
    payload: { planCode: plan.code, billingPeriod, subscriptionStatus }
  });
  return c.json({ ok: true, item: updated });
});
subscriptionRoutes.post("/tenants/:tenantId/cancel", async (c) => {
  const tenantId = c.req.param("tenantId");
  const userId = c.get("userId");
  const tenantRows = await db.select().from(tenants).where(eq7(tenants.id, tenantId));
  if (tenantRows.length === 0) return c.json({ ok: false, message: "Tenant not found" }, 404);
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId);
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403);
  const [updated] = await db.update(tenants).set({
    subscriptionStatus: "cancelled",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq7(tenants.id, tenantId)).returning();
  await writeAuditLog({
    actorId: userId,
    action: "tenant.cancelled",
    targetType: "subscription",
    targetId: tenantId,
    payload: { previousStatus: tenantRows[0].subscriptionStatus }
  });
  return c.json({ ok: true, item: updated });
});

// src/features/tenants/routes.ts
import { and as and6, eq as eq8 } from "drizzle-orm";
import { Hono as Hono7 } from "hono";
var tenantRoutes = new Hono7();
tenantRoutes.get("/default-branch", async (c) => {
  const tenantId = c.req.query("tenantId");
  if (!tenantId) {
    return c.json({ ok: false, message: "tenantId required" }, 400);
  }
  const branch = await db.query.branches.findFirst({
    where: and6(
      eq8(branches.tenantId, tenantId),
      eq8(branches.isDefault, true),
      eq8(branches.isActive, true)
    )
  });
  if (!branch) {
    return c.json({ ok: false, message: "No default branch found for this tenant" }, 404);
  }
  return c.json({ ok: true, id: branch.id, name: branch.name });
});

// src/features/updates/routes.ts
import { Hono as Hono8 } from "hono";

// src/features/updates/service.ts
var GITHUB_RELEASES_API_URL = process.env.GITHUB_RELEASES_API_URL ?? "https://api.github.com/repos/Yusufkotavom/VitPOS/releases/latest";
var PUBLIC_WEB_URL = process.env.PUBLIC_WEB_URL ?? "https://vit-pos-8vle.vercel.app";
function normalizeVersion(version) {
  return version.replace(/^v/i, "").trim();
}
function toSemverParts(version) {
  return normalizeVersion(version).split(".").map((part) => Number.parseInt(part, 10) || 0);
}
function isVersionNewer(currentVersion, nextVersion) {
  const current = toSemverParts(currentVersion);
  const next = toSemverParts(nextVersion);
  const max = Math.max(current.length, next.length);
  for (let index2 = 0; index2 < max; index2 += 1) {
    const currentPart = current[index2] || 0;
    const nextPart = next[index2] || 0;
    if (nextPart > currentPart) return true;
    if (nextPart < currentPart) return false;
  }
  return false;
}
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch release metadata: ${response.status}`);
  }
  return response.json();
}
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch release asset text: ${response.status}`);
  }
  return response.text();
}
async function fetchLatestRelease() {
  return fetchJson(GITHUB_RELEASES_API_URL);
}
function pickAsset(assets, matchers) {
  return assets.find((asset) => matchers.some((matcher) => matcher.test(asset.name)));
}
function desktopMatchers(target, arch) {
  if (target === "windows") {
    return [/\.msi$/i, new RegExp(`${arch}.*\\.exe$`, "i"), /setup.*\.exe$/i, /\.exe$/i];
  }
  if (target === "darwin") {
    return [/\.app\.tar\.gz$/i, /\.dmg$/i];
  }
  return [/\.AppImage$/i, /\.appimage$/i, /\.deb$/i];
}
async function resolveDesktopAsset(target, arch, assets) {
  const installer = pickAsset(assets, desktopMatchers(target, arch));
  if (!installer) return null;
  const signatureAsset = assets.find((asset) => asset.name === `${installer.name}.sig`);
  if (!signatureAsset) return null;
  return {
    installer,
    signature: (await fetchText(signatureAsset.browser_download_url)).trim()
  };
}
async function resolveAndroidUpdate(assets) {
  const apk = pickAsset(assets, [/release\.apk$/i, /app-release.*\.apk$/i]);
  if (!apk) return null;
  const checksumAsset = assets.find((asset) => asset.name === `${apk.name}.sha256`);
  return {
    apk,
    checksum: checksumAsset ? (await fetchText(checksumAsset.browser_download_url)).trim() : void 0
  };
}
async function resolveDesktopUpdate(target, arch, currentVersion) {
  const release = await fetchLatestRelease();
  const version = normalizeVersion(release.tag_name);
  if (!isVersionNewer(currentVersion, version)) {
    return null;
  }
  const desktop = await resolveDesktopAsset(target, arch, release.assets);
  if (!desktop) return null;
  return {
    version,
    notes: release.body || "",
    pub_date: release.published_at,
    url: desktop.installer.browser_download_url,
    signature: desktop.signature
  };
}
async function resolveAppUpdate(platform, currentVersion) {
  const release = await fetchLatestRelease();
  const version = normalizeVersion(release.tag_name);
  const baseResponse = {
    ok: true,
    available: isVersionNewer(currentVersion, version),
    version,
    notes: release.body || "",
    publishedAt: release.published_at || null,
    releaseUrl: release.html_url,
    webUrl: PUBLIC_WEB_URL
  };
  if (!baseResponse.available) {
    return {
      ...baseResponse,
      preferredChannel: "web",
      preferredUrl: PUBLIC_WEB_URL
    };
  }
  if (platform === "android-apk") {
    const android = await resolveAndroidUpdate(release.assets);
    return {
      ...baseResponse,
      apkUrl: android?.apk.browser_download_url,
      checksum: android?.checksum,
      preferredChannel: android ? "apk" : "web",
      preferredUrl: android?.apk.browser_download_url || PUBLIC_WEB_URL
    };
  }
  if (platform === "tauri-windows" || platform === "tauri-linux" || platform === "tauri-macos") {
    const target = platform === "tauri-windows" ? "windows" : platform === "tauri-macos" ? "darwin" : "linux";
    const desktop = await resolveDesktopAsset(target, "x86_64", release.assets);
    return {
      ...baseResponse,
      desktopUrl: desktop?.installer.browser_download_url,
      preferredChannel: desktop ? "desktop" : "web",
      preferredUrl: desktop?.installer.browser_download_url || PUBLIC_WEB_URL
    };
  }
  return {
    ...baseResponse,
    preferredChannel: "web",
    preferredUrl: PUBLIC_WEB_URL
  };
}

// src/features/updates/routes.ts
var updateRoutes = new Hono8();
updateRoutes.get("/latest", async (c) => {
  const platform = c.req.query("platform");
  const currentVersion = c.req.query("currentVersion");
  if (!platform || !currentVersion) {
    return c.json({ ok: false, message: "platform and currentVersion required" }, 400);
  }
  const payload = await resolveAppUpdate(platform, currentVersion);
  return c.json(payload);
});
updateRoutes.get("/desktop/:target/:arch/:currentVersion", async (c) => {
  const target = c.req.param("target");
  const arch = c.req.param("arch");
  const currentVersion = c.req.param("currentVersion");
  const payload = await resolveDesktopUpdate(target, arch, currentVersion);
  if (!payload) {
    return c.body(null, 204);
  }
  return c.json(payload);
});

// src/app.ts
function createApp() {
  const app2 = new Hono9();
  app2.use("*", cors());
  app2.get("/", (c) => c.json({ message: "VitPOS API is running!" }));
  app2.route("/health", healthRoutes);
  app2.route("/api/v1/health", healthRoutes);
  app2.route("/api/v1/auth", authRoutes);
  app2.route("/api/v1/sync", syncRoutes);
  app2.route("/api/v1/reports", reportRoutes);
  app2.route("/api/v1/platform", platformRoutes);
  app2.route("/api/v1/subscription", subscriptionRoutes);
  app2.route("/api/v1/tenants", tenantRoutes);
  app2.route("/api/v1/updates", updateRoutes);
  app2.onError((error, c) => {
    return c.json({ ok: false, message: error.message }, 500);
  });
  return app2;
}

// src/index.ts
import { handle } from "hono/vercel";
var app = createApp();
var handler = handle(app);
var GET = handler;
var POST = handler;
var PUT = handler;
var DELETE = handler;
var PATCH = handler;
var OPTIONS = handler;
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT
};
