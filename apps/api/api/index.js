var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { Hono as Hono5 } from "hono";
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
  branches: () => branches,
  branchesRelations: () => branchesRelations,
  customers: () => customers,
  memberRoleEnum: () => memberRoleEnum,
  orderStatusEnum: () => orderStatusEnum,
  outboxLogs: () => outboxLogs,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentStatusEnum: () => paymentStatusEnum,
  payments: () => payments,
  productCategories: () => productCategories,
  productTypeEnum: () => productTypeEnum,
  products: () => products,
  salesOrderItems: () => salesOrderItems,
  salesOrders: () => salesOrders,
  salesOrdersRelations: () => salesOrdersRelations,
  stockMovementTypeEnum: () => stockMovementTypeEnum,
  stockMovements: () => stockMovements,
  syncStatusEnum: () => syncStatusEnum,
  tenantMembers: () => tenantMembers,
  tenants: () => tenants,
  tenantsRelations: () => tenantsRelations,
  users: () => users,
  warehouses: () => warehouses
});

// ../../src/db/schema/core.ts
import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
var memberRoleEnum = pgEnum("member_role", ["owner", "admin", "cashier", "staff"]);
var orderStatusEnum = pgEnum("order_status", ["draft", "confirmed", "unpaid", "partial", "paid", "receivable", "cancelled", "refunded"]);
var paymentMethodEnum = pgEnum("payment_method", ["cash", "qris", "card", "transfer", "ewallet", "receivable"]);
var paymentStatusEnum = pgEnum("payment_status", ["success", "pending", "failed", "refunded", "partial_refund"]);
var productTypeEnum = pgEnum("product_type", ["physical", "service"]);
var stockMovementTypeEnum = pgEnum("stock_movement_type", ["sale", "purchase", "return", "adjustment", "transfer_in", "transfer_out", "damage_lost"]);
var syncStatusEnum = pgEnum("sync_status", ["synced", "pending", "failed", "conflict"]);
var timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
};
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
  avatarUrl: text("avatar_url"),
  ...timestamps
});
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
  paymentNumber: varchar("payment_number", { length: 80 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 120 }),
  status: paymentStatusEnum("status").default("pending").notNull(),
  syncStatus: syncStatusEnum("sync_status").default("pending").notNull(),
  ...timestamps
}, (table) => [index("payments_tenant_id_idx").on(table.tenantId), index("payments_branch_id_idx").on(table.branchId), index("payments_order_id_idx").on(table.salesOrderId)]);
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
var outboxLogs = pgTable("outbox_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  branchId: uuid("branch_id").references(() => branches.id),
  deviceId: varchar("device_id", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id").notNull(),
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
    tenantPlan: tenants.planCode
  }).from(tenantMembers).innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id)).where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true), eq(tenants.isActive, true)));
}
function userResponse(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl
  };
}
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
  if (!email) {
    return c.json({ ok: false, message: "email required" }, 400);
  }
  const user = await findUserByEmail(db, email);
  if (!user) {
    return c.json({ ok: false, message: "User not found" }, 404);
  }
  const memberships = await listActiveMemberships(db, user.id);
  if (memberships.length === 0) {
    return c.json({ ok: false, message: "Active tenant membership required" }, 403);
  }
  return c.json({
    ok: true,
    accessToken: `dev-${user.id}`,
    user: userResponse(user),
    memberships
  });
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
import { and as and2, count, eq as eq2, gte, lte, sum } from "drizzle-orm";
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

// src/features/reports/routes.ts
var reportRoutes = new Hono3();
reportRoutes.get("/sales/summary", async (c) => {
  const tenantId = c.req.query("tenantId");
  if (!tenantId) {
    return c.json({ ok: false, message: "tenantId required" }, 400);
  }
  const summary = await getSalesSummary(db, {
    tenantId,
    branchId: c.req.query("branchId") ?? void 0,
    from: c.req.query("from") ?? void 0,
    to: c.req.query("to") ?? void 0
  });
  return c.json({ ok: true, summary });
});
reportRoutes.get("/payments/summary", async (c) => {
  const tenantId = c.req.query("tenantId");
  if (!tenantId) {
    return c.json({ ok: false, message: "tenantId required" }, 400);
  }
  const items = await getPaymentSummary(db, {
    tenantId,
    branchId: c.req.query("branchId") ?? void 0,
    from: c.req.query("from") ?? void 0,
    to: c.req.query("to") ?? void 0
  });
  return c.json({ ok: true, items });
});
reportRoutes.get("/inventory/movements", async (c) => {
  const tenantId = c.req.query("tenantId");
  if (!tenantId) {
    return c.json({ ok: false, message: "tenantId required" }, 400);
  }
  const items = await getInventoryMovementSummary(db, {
    tenantId,
    branchId: c.req.query("branchId") ?? void 0,
    from: c.req.query("from") ?? void 0,
    to: c.req.query("to") ?? void 0
  });
  return c.json({ ok: true, items });
});

// src/features/sync/routes.ts
import { and as and3, desc, eq as eq4, gte as gte2, isNull } from "drizzle-orm";
import { Hono as Hono4 } from "hono";

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
var syncEntityTypes = /* @__PURE__ */ new Set(["product", "customer", "sale", "payment", "stock_movement", "cash", "setting", "shift", "product_category", "supplier", "purchase", "return", "service_order"]);
var syncMutationTypes = /* @__PURE__ */ new Set(["create", "update", "delete"]);
var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
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
    if (!isUuid(mutation.entityId)) {
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
import { eq as eq3 } from "drizzle-orm";
function toNumeric(value) {
  if (value === void 0 || value === null) return "0";
  if (typeof value === "number") return String(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}
function toNullableUuid(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
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
          id: item.id ?? crypto.randomUUID(),
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
    paymentNumber: payload.paymentNumber ?? payload.ref ?? entityId,
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
  const now = /* @__PURE__ */ new Date();
  await db2.insert(stockMovements).values({
    id: entityId,
    tenantId: ctx.tenantId,
    branchId: toNullableUuid(ctx.branchId),
    warehouseId: ctx.branchId ?? "",
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
}

// src/features/sync/routes.ts
var syncRoutes = new Hono4();
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
    where: and3(eq4(products.tenantId, parsed.value.tenantId), isNull(products.deletedAt), branchFilter, sinceFilter),
    orderBy: [desc(products.updatedAt)],
    limit: 100
  });
  const saleBranchFilter = parsed.value.branchId ? eq4(salesOrders.branchId, parsed.value.branchId) : void 0;
  const saleSinceFilter = parsed.value.since ? gte2(salesOrders.updatedAt, parsed.value.since) : void 0;
  const saleRows = await db.query.salesOrders.findMany({
    where: and3(eq4(salesOrders.tenantId, parsed.value.tenantId), isNull(salesOrders.deletedAt), saleBranchFilter, saleSinceFilter),
    orderBy: [desc(salesOrders.updatedAt)],
    limit: 100
  });
  const paymentBranchFilter = parsed.value.branchId ? eq4(payments.branchId, parsed.value.branchId) : void 0;
  const paymentSinceFilter = parsed.value.since ? gte2(payments.updatedAt, parsed.value.since) : void 0;
  const paymentRows = await db.query.payments.findMany({
    where: and3(eq4(payments.tenantId, parsed.value.tenantId), isNull(payments.deletedAt), paymentBranchFilter, paymentSinceFilter),
    orderBy: [desc(payments.updatedAt)],
    limit: 100
  });
  const stockBranchFilter = parsed.value.branchId ? eq4(stockMovements.branchId, parsed.value.branchId) : void 0;
  const stockSinceFilter = parsed.value.since ? gte2(stockMovements.updatedAt, parsed.value.since) : void 0;
  const stockRows = await db.query.stockMovements.findMany({
    where: and3(eq4(stockMovements.tenantId, parsed.value.tenantId), isNull(stockMovements.deletedAt), stockBranchFilter, stockSinceFilter),
    orderBy: [desc(stockMovements.updatedAt)],
    limit: 100
  });
  const customerSinceFilter = parsed.value.since ? gte2(customers.updatedAt, parsed.value.since) : void 0;
  const customerRows = await db.query.customers.findMany({
    where: and3(eq4(customers.tenantId, parsed.value.tenantId), isNull(customers.deletedAt), customerSinceFilter),
    orderBy: [desc(customers.updatedAt)],
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
        stock: 0,
        status: row.isActive ? "Aktif" : "Arsip",
        isActive: row.isActive,
        salePrice: Number(row.salePrice),
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
        status: row.isActive ? "Aktif" : "Nonaktif"
      },
      transportStatus: serverSyncStatusToApiItemStatus(row.syncStatus),
      serverSyncStatus: row.syncStatus,
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

// src/app.ts
function createApp() {
  const app2 = new Hono5();
  app2.use("*", cors());
  app2.get("/", (c) => c.json({ message: "VitPOS API is running!" }));
  app2.route("/health", healthRoutes);
  app2.route("/api/v1/health", healthRoutes);
  app2.route("/api/v1/auth", authRoutes);
  app2.route("/api/v1/sync", syncRoutes);
  app2.route("/api/v1/reports", reportRoutes);
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
