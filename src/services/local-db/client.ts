import Dexie, { type EntityTable } from 'dexie'

import type {
  LocalCash,
  LocalCashCategory,
  LocalCustomer,
  LocalInventory,
  LocalPayment,
  LocalProduct,
  LocalProductCategory,
  LocalPurchase,
  LocalPurchaseItem,
  LocalReturn,
  LocalReturnItem,
  LocalSalesOrder,
  LocalSalesOrderItem,
  LocalServiceOrder,
  LocalSetting,
  LocalPaymentMethod,
  LocalShift,
  LocalStockMovement,
  LocalSupplier,
  LocalTenant,
  LocalTenantMember,
  LocalUser,
  OutboxItem,
  SyncConflict,
  SyncRun,
} from '@/services/local-db/schema'

export class VitposLocalDb extends Dexie {
  users!: EntityTable<LocalUser, 'id'>
  tenants!: EntityTable<LocalTenant, 'id'>
  tenantMembers!: EntityTable<LocalTenantMember, 'id'>
  products!: EntityTable<LocalProduct, 'id'>
  productCategories!: EntityTable<LocalProductCategory, 'id'>
  customers!: EntityTable<LocalCustomer, 'id'>
  salesOrders!: EntityTable<LocalSalesOrder, 'id'>
  salesOrderItems!: EntityTable<LocalSalesOrderItem, 'id'>
  payments!: EntityTable<LocalPayment, 'id'>
  stockMovements!: EntityTable<LocalStockMovement, 'id'>
  inventory!: EntityTable<LocalInventory, 'id'>
  cash!: EntityTable<LocalCash, 'id'>
  cashCategories!: EntityTable<LocalCashCategory, 'id'>
  settings!: EntityTable<LocalSetting, 'id'>
  paymentMethods!: EntityTable<LocalPaymentMethod, 'id'>
  shifts!: EntityTable<LocalShift, 'id'>
  suppliers!: EntityTable<LocalSupplier, 'id'>
  purchases!: EntityTable<LocalPurchase, 'id'>
  purchaseItems!: EntityTable<LocalPurchaseItem, 'id'>
  returns!: EntityTable<LocalReturn, 'id'>
  returnItems!: EntityTable<LocalReturnItem, 'id'>
  serviceOrders!: EntityTable<LocalServiceOrder, 'id'>
  outbox!: EntityTable<OutboxItem, 'id'>
  syncConflicts!: EntityTable<SyncConflict, 'id'>
  syncRuns!: EntityTable<SyncRun, 'id'>

  constructor() {
    super('kotacom-business-suite')

    this.version(1).stores({
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })

    this.version(2).stores({
      products: 'id, name, category, type, status',
      customers: 'id, name, phone, city, status',
      salesOrders: 'id, code, customer, date, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })

    this.version(3).stores({
      products: 'id, name, category, type, status',
      customers: 'id, name, phone, city, status',
      salesOrders: 'id, code, customer, date, status',
      payments: 'id, ref, source, method, date, status',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })

    this.version(4).stores({
      products: 'id, name, category, type, status',
      customers: 'id, name, phone, city, status',
      salesOrders: 'id, code, customer, date, status',
      payments: 'id, ref, source, method, date, status',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      settings: 'id, area, setting, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })

    this.version(5).stores({
      products: 'id, name, category, type, status',
      customers: 'id, name, phone, city, status',
      salesOrders: 'id, code, customer, date, status',
      payments: 'id, ref, source, method, date, status',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      settings: 'id, area, setting, status',
      paymentMethods: 'id, name, provider, type, status, updatedAt',
      shifts: 'id, cashierName, startTime, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })

    this.version(6).stores({
      products: 'id, name, category, type, status, syncStatus, updatedAt',
      customers: 'id, name, phone, city, status, syncStatus, updatedAt',
      salesOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      salesOrderItems: 'id, salesOrderId, productId',
      payments: 'id, ref, source, method, date, status, syncStatus, updatedAt, salesOrderId',
      stockMovements: 'id, productId, type, referenceId, syncStatus, updatedAt',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      settings: 'id, area, setting, status',
      paymentMethods: 'id, name, provider, type, status, updatedAt',
      shifts: 'id, cashierName, startTime, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })
    this.version(7).stores({
      products: 'id, name, category, type, status, syncStatus, updatedAt',
      productCategories: 'id, name, status, syncStatus, updatedAt',
      customers: 'id, name, phone, city, status, syncStatus, updatedAt',
      salesOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      salesOrderItems: 'id, salesOrderId, productId',
      payments: 'id, ref, source, method, date, status, syncStatus, updatedAt, salesOrderId',
      stockMovements: 'id, productId, type, referenceId, syncStatus, updatedAt',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      settings: 'id, area, setting, status',
      paymentMethods: 'id, name, provider, type, status, updatedAt',
      shifts: 'id, cashierName, startTime, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })
    this.version(8).stores({
      products: 'id, name, category, type, status, syncStatus, updatedAt',
      productCategories: 'id, name, status, syncStatus, updatedAt',
      customers: 'id, name, phone, city, status, syncStatus, updatedAt',
      salesOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      salesOrderItems: 'id, salesOrderId, productId',
      payments: 'id, ref, source, method, date, status, syncStatus, updatedAt, salesOrderId',
      stockMovements: 'id, productId, type, referenceId, syncStatus, updatedAt',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      settings: 'id, area, setting, status',
      paymentMethods: 'id, name, provider, type, status, updatedAt',
      shifts: 'id, cashierName, startTime, status',
      suppliers: 'id, name, phone, city, status, syncStatus, updatedAt',
      purchases: 'id, code, supplierName, date, status, syncStatus, updatedAt',
      purchaseItems: 'id, purchaseId, productId',
      returns: 'id, code, type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, returnId, productId',
      serviceOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })
    this.version(9).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, name, category, type, status, syncStatus, updatedAt',
      productCategories: 'id, name, status, syncStatus, updatedAt',
      customers: 'id, name, phone, city, status, syncStatus, updatedAt',
      salesOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      salesOrderItems: 'id, salesOrderId, productId',
      payments: 'id, ref, source, method, date, status, syncStatus, updatedAt, salesOrderId',
      stockMovements: 'id, productId, type, referenceId, syncStatus, updatedAt',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      settings: 'id, area, setting, status',
      paymentMethods: 'id, name, provider, type, status, updatedAt',
      shifts: 'id, cashierName, startTime, status',
      suppliers: 'id, name, phone, city, status, syncStatus, updatedAt',
      purchases: 'id, code, supplierName, date, status, syncStatus, updatedAt',
      purchaseItems: 'id, purchaseId, productId',
      returns: 'id, code, type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, returnId, productId',
      serviceOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })
    this.version(10).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, name, category, type, status, syncStatus, updatedAt',
      productCategories: 'id, name, status, syncStatus, updatedAt',
      customers: 'id, name, phone, city, status, syncStatus, updatedAt',
      salesOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      salesOrderItems: 'id, salesOrderId, productId',
      payments: 'id, ref, source, method, date, status, syncStatus, updatedAt, salesOrderId',
      stockMovements: 'id, productId, type, referenceId, syncStatus, updatedAt',
      inventory: 'id, product, warehouse, status',
      cash: 'id, ref, date, account, category, status',
      cashCategories: 'id, name, type, status, syncStatus, updatedAt',
      settings: 'id, area, setting, status',
      paymentMethods: 'id, name, provider, type, status, updatedAt',
      shifts: 'id, cashierName, startTime, status',
      suppliers: 'id, name, phone, city, status, syncStatus, updatedAt',
      purchases: 'id, code, supplierName, date, status, syncStatus, updatedAt',
      purchaseItems: 'id, purchaseId, productId',
      returns: 'id, code, type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, returnId, productId',
      serviceOrders: 'id, code, customerName, date, status, syncStatus, updatedAt',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })
  }
}

export const localDb = new VitposLocalDb()
