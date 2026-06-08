import Dexie, { type EntityTable } from 'dexie'

import {
  type LocalCash,
  type LocalCustomer,
  type LocalInventory,
  type LocalPayment,
  type LocalProduct,
  type LocalSalesOrder,
  type OutboxItem,
  type SyncConflict,
  type SyncRun,
} from '@/services/local-db/schema'

export class VitposLocalDb extends Dexie {
  products!: EntityTable<LocalProduct, 'id'>
  customers!: EntityTable<LocalCustomer, 'id'>
  salesOrders!: EntityTable<LocalSalesOrder, 'id'>
  payments!: EntityTable<LocalPayment, 'id'>
  inventory!: EntityTable<LocalInventory, 'id'>
  cash!: EntityTable<LocalCash, 'id'>
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
  }
}

export const localDb = new VitposLocalDb()
