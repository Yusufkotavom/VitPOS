import Dexie, { type EntityTable } from 'dexie'

import type {
  LocalCash,
  LocalCashCategory,
  LocalCustomer,
  LocalInventory,
  LocalPayment,
  LocalProduct,
  LocalProductCategory,
  LocalProductionBatch,
  LocalPurchase,
  LocalPurchaseItem,
  LocalReturn,
  LocalReturnItem,
  LocalRecipe,
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
  recipes!: EntityTable<LocalRecipe, 'id'>
  productionBatches!: EntityTable<LocalProductionBatch, 'id'>
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
    this.version(11).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt',
      productCategories: 'id, tenantId, [tenantId+name], [tenantId+status], syncStatus, updatedAt',
      customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt',
      salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt',
      salesOrderItems: 'id, tenantId, salesOrderId, productId',
      payments: 'id, tenantId, [tenantId+salesOrderId], ref, source, method, date, status, syncStatus, updatedAt',
      stockMovements: 'id, tenantId, [tenantId+productId], type, referenceId, syncStatus, updatedAt',
      inventory: 'id, tenantId, [tenantId+product], [tenantId+warehouse], status',
      cash: 'id, tenantId, [tenantId+ref], [tenantId+date], [tenantId+account], category, status',
      cashCategories: 'id, tenantId, [tenantId+name], type, status, syncStatus, updatedAt',
      settings: 'id, tenantId, [tenantId+area], [tenantId+setting], status',
      paymentMethods: 'id, tenantId, [tenantId+name], provider, type, status, updatedAt',
      shifts: 'id, tenantId, cashierName, startTime, status',
      suppliers: 'id, tenantId, [tenantId+name], [tenantId+phone], status, syncStatus, updatedAt',
      purchases: 'id, tenantId, [tenantId+code], [tenantId+supplierName], [tenantId+date], status, syncStatus, updatedAt',
      purchaseItems: 'id, tenantId, purchaseId, productId',
      returns: 'id, tenantId, [tenantId+code], type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, tenantId, returnId, productId',
      serviceOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], status, syncStatus, updatedAt',
      outbox: 'id, tenantId, [tenantId+entityType+entityId], mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, tenantId, [tenantId+entityType+entityId], status, createdAt, resolvedAt',
      syncRuns: 'id, tenantId, status, startedAt, finishedAt',
    })

    this.version(12).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt',
      productCategories: 'id, tenantId, [tenantId+name], [tenantId+status], syncStatus, updatedAt',
      customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt',
      salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt',
      salesOrderItems: 'id, tenantId, salesOrderId, productId',
      payments: 'id, tenantId, [tenantId+salesOrderId], ref, source, method, date, status, syncStatus, updatedAt',
      stockMovements: 'id, tenantId, [tenantId+productId], type, referenceId, syncStatus, updatedAt',
      inventory: 'id, tenantId, [tenantId+product], [tenantId+warehouse], status',
      cash: 'id, tenantId, [tenantId+ref], [tenantId+date], [tenantId+account], category, status',
      cashCategories: 'id, tenantId, [tenantId+name], type, status, syncStatus, updatedAt',
      settings: 'id, tenantId, [tenantId+area], [tenantId+setting], status',
      paymentMethods: 'id, tenantId, [tenantId+name], provider, type, status, updatedAt',
      shifts: 'id, tenantId, cashierName, startTime, status',
      suppliers: 'id, tenantId, [tenantId+name], [tenantId+phone], status, syncStatus, updatedAt',
      purchases: 'id, tenantId, [tenantId+code], [tenantId+supplierName], [tenantId+date], status, syncStatus, updatedAt',
      purchaseItems: 'id, tenantId, purchaseId, productId',
      returns: 'id, tenantId, [tenantId+code], type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, tenantId, returnId, productId',
      serviceOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], status, syncStatus, updatedAt',
      recipes: 'id, tenantId, [tenantId+name], [tenantId+productName], status, updatedAt',
      outbox: 'id, tenantId, [tenantId+entityType+entityId], mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, tenantId, [tenantId+entityType+entityId], status, createdAt, resolvedAt',
      syncRuns: 'id, tenantId, status, startedAt, finishedAt',
    })
    this.version(13).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt',
      productCategories: 'id, tenantId, [tenantId+name], [tenantId+status], syncStatus, updatedAt',
      customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt',
      salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt',
      salesOrderItems: 'id, tenantId, salesOrderId, productId',
      payments: 'id, tenantId, [tenantId+salesOrderId], [tenantId+serviceOrderId], [tenantId+purchaseId], ref, source, method, date, status, syncStatus, updatedAt',
      stockMovements: 'id, tenantId, [tenantId+productId], type, referenceId, syncStatus, updatedAt',
      inventory: 'id, tenantId, [tenantId+product], [tenantId+warehouse], status',
      cash: 'id, tenantId, [tenantId+ref], [tenantId+date], [tenantId+account], category, status',
      cashCategories: 'id, tenantId, [tenantId+name], type, status, syncStatus, updatedAt',
      settings: 'id, tenantId, [tenantId+area], [tenantId+setting], status',
      paymentMethods: 'id, tenantId, [tenantId+name], provider, type, status, updatedAt',
      shifts: 'id, tenantId, cashierName, startTime, status',
      suppliers: 'id, tenantId, [tenantId+name], [tenantId+phone], status, syncStatus, updatedAt',
      purchases: 'id, tenantId, [tenantId+code], [tenantId+supplierName], [tenantId+date], status, syncStatus, updatedAt',
      purchaseItems: 'id, tenantId, purchaseId, productId',
      returns: 'id, tenantId, [tenantId+code], type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, tenantId, returnId, productId',
      serviceOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], status, syncStatus, updatedAt',
      recipes: 'id, tenantId, [tenantId+name], [tenantId+productName], status, updatedAt',
      outbox: 'id, tenantId, [tenantId+entityType+entityId], mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, tenantId, [tenantId+entityType+entityId], status, createdAt, resolvedAt',
      syncRuns: 'id, tenantId, status, startedAt, finishedAt',
    })
    this.version(14).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt',
      productCategories: 'id, tenantId, [tenantId+name], [tenantId+status], syncStatus, updatedAt',
      customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt',
      salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt',
      salesOrderItems: 'id, tenantId, salesOrderId, productId',
      payments: 'id, tenantId, [tenantId+salesOrderId], [tenantId+serviceOrderId], [tenantId+purchaseId], ref, source, method, date, status, syncStatus, updatedAt',
      stockMovements: 'id, tenantId, [tenantId+productId], type, referenceId, syncStatus, updatedAt',
      inventory: 'id, tenantId, [tenantId+product], [tenantId+warehouse], status',
      cash: 'id, tenantId, [tenantId+ref], [tenantId+date], [tenantId+account], category, status',
      cashCategories: 'id, tenantId, [tenantId+name], type, status, syncStatus, updatedAt',
      settings: 'id, tenantId, [tenantId+area], [tenantId+setting], status',
      paymentMethods: 'id, tenantId, [tenantId+name], provider, type, status, updatedAt',
      shifts: 'id, tenantId, cashierName, startTime, status',
      suppliers: 'id, tenantId, [tenantId+name], [tenantId+phone], status, syncStatus, updatedAt',
      purchases: 'id, tenantId, [tenantId+code], [tenantId+supplierName], [tenantId+date], status, syncStatus, updatedAt',
      purchaseItems: 'id, tenantId, purchaseId, productId',
      returns: 'id, tenantId, [tenantId+code], type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, tenantId, returnId, productId',
      serviceOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], status, syncStatus, updatedAt',
      recipes: 'id, tenantId, [tenantId+name], [tenantId+productName], status, updatedAt',
      productionBatches: 'id, tenantId, [tenantId+recipeId], [tenantId+productId], date, syncStatus, updatedAt',
      outbox: 'id, tenantId, [tenantId+entityType+entityId], mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, tenantId, [tenantId+entityType+entityId], status, createdAt, resolvedAt',
      syncRuns: 'id, tenantId, status, startedAt, finishedAt',
    })
    this.version(15).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt',
      productCategories: 'id, tenantId, [tenantId+name], [tenantId+status], syncStatus, updatedAt',
      customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt',
      salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt',
      salesOrderItems: 'id, tenantId, salesOrderId, productId',
      payments: 'id, tenantId, salesOrderId, serviceOrderId, purchaseId, [tenantId+salesOrderId], [tenantId+serviceOrderId], [tenantId+purchaseId], ref, source, method, date, status, syncStatus, updatedAt',
      stockMovements: 'id, tenantId, [tenantId+productId], type, referenceId, syncStatus, updatedAt',
      inventory: 'id, tenantId, [tenantId+product], [tenantId+warehouse], status',
      cash: 'id, tenantId, [tenantId+ref], [tenantId+date], [tenantId+account], category, status',
      cashCategories: 'id, tenantId, [tenantId+name], type, status, syncStatus, updatedAt',
      settings: 'id, tenantId, [tenantId+area], [tenantId+setting], status',
      paymentMethods: 'id, tenantId, [tenantId+name], provider, type, status, updatedAt',
      shifts: 'id, tenantId, cashierName, startTime, status',
      suppliers: 'id, tenantId, [tenantId+name], [tenantId+phone], status, syncStatus, updatedAt',
      purchases: 'id, tenantId, [tenantId+code], [tenantId+supplierName], [tenantId+date], status, syncStatus, updatedAt',
      purchaseItems: 'id, tenantId, purchaseId, productId',
      returns: 'id, tenantId, [tenantId+code], type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, tenantId, returnId, productId',
      serviceOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], status, syncStatus, updatedAt',
      recipes: 'id, tenantId, [tenantId+name], [tenantId+productName], status, updatedAt',
      productionBatches: 'id, tenantId, [tenantId+recipeId], [tenantId+productId], date, syncStatus, updatedAt',
      outbox: 'id, tenantId, [tenantId+entityType+entityId], mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, tenantId, [tenantId+entityType+entityId], status, createdAt, resolvedAt',
      syncRuns: 'id, tenantId, status, startedAt, finishedAt',
    })
  }
}

import { getLocalDbAdapter } from './adapters/factory'
import { LOCAL_DB_TABLES } from './adapters'

// Create the adapter first
const adapter = getLocalDbAdapter()

export const localDb = new Proxy(adapter, {
  get(target, prop) {
    if (typeof prop === 'string' && LOCAL_DB_TABLES.includes(prop as unknown as typeof LOCAL_DB_TABLES[number])) {
      // It's a table access!
      const table = target.storageTable(prop)
      
      // We wrap the table to make it Dexie compatible enough for existing code
      return new Proxy(table, {
        get(tbl, tblProp) {
          if (tblProp in tbl) {
             const val = (tbl as Record<string, unknown>)[tblProp as string];
             if (typeof val === 'function') {
               return val.bind(tbl)
             }
             return val
          }
          
          if (tblProp === 'add') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (item: unknown) => tbl.put(item as any)
          }
          
          // Fake Dexie where() emulation fallback if not implemented natively on adapter
          if (tblProp === 'where' && !('where' in tbl)) {
             return (column: string) => ({
                equals: (val: unknown) => {
                  return {
                     toArray: async () => {
                       const all = await tbl.toArray()
                       return all.filter((item: Record<string, unknown>) => item[column] === val)
                     },
                     first: async () => {
                       const all = await tbl.toArray()
                       return all.find((item: Record<string, unknown>) => item[column] === val)
                     },
                     count: async () => {
                       const all = await tbl.toArray()
                       return all.filter((item: Record<string, unknown>) => item[column] === val).length
                     },
                     delete: async () => {
                       const all = await tbl.toArray()
                       const toDelete = all.filter((item: Record<string, unknown>) => item[column] === val)
                       for (const item of toDelete) {
                         await tbl.delete((item as { id: string }).id)
                       }
                     }
                  }
                }
             })
          }
          return undefined
        }
      })
    }
    
    if (prop === 'transaction') {
      return async (mode: string, tables: unknown, scope: () => Promise<unknown>) => {
         let dexieMode = 'readonly'
         if (mode === 'rw' || mode === 'readwrite') dexieMode = 'readwrite'
         
         // extract table names from array of proxies
         const tableNames = Array.isArray(tables) 
           ? tables.map(t => typeof t === 'string' ? t : (t as { name?: string }).name || 'unknown')
           : typeof tables === 'string' ? [tables] : [(tables as { name?: string })?.name || 'unknown']
           
         return target.runInTransaction(dexieMode as 'readonly' | 'readwrite', tableNames, scope)
      }
    }
    
    if (prop === 'open') return async () => target.init()
    if (prop === 'close') return async () => target.teardown()
    if (prop === 'isOpen') return () => true
    
    // Fallback to adapter method
    if (prop in target) {
      const val = (target as unknown as Record<string, unknown>)[prop as string]
      return typeof val === 'function' ? val.bind(target) : val
    }
  }
}) as unknown as VitposLocalDb

