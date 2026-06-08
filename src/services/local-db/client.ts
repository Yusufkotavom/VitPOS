import Dexie, { type EntityTable } from 'dexie'

import type {
  LocalCash,
  LocalCustomer,
  LocalInventory,
  LocalPayment,
  LocalProduct,
  LocalProductCategory,
  LocalSalesOrder,
  LocalSalesOrderItem,
  LocalSetting,
  LocalShift,
  LocalStockMovement,
  OutboxItem,
  SyncConflict,
  SyncRun,
} from '@/services/local-db/schema'

export class VitposLocalDb extends Dexie {
  products!: EntityTable<LocalProduct, 'id'>
  productCategories!: EntityTable<LocalProductCategory, 'id'>
  customers!: EntityTable<LocalCustomer, 'id'>
  salesOrders!: EntityTable<LocalSalesOrder, 'id'>
  salesOrderItems!: EntityTable<LocalSalesOrderItem, 'id'>
  payments!: EntityTable<LocalPayment, 'id'>
  stockMovements!: EntityTable<LocalStockMovement, 'id'>
  inventory!: EntityTable<LocalInventory, 'id'>
  cash!: EntityTable<LocalCash, 'id'>
  settings!: EntityTable<LocalSetting, 'id'>
  shifts!: EntityTable<LocalShift, 'id'>
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
      shifts: 'id, cashierName, startTime, status',
      outbox: 'id, entityType, entityId, mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, entityType, entityId, status, createdAt, resolvedAt',
      syncRuns: 'id, status, startedAt, finishedAt',
    })
  }
}

export const localDb = new VitposLocalDb()
