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

import { VirtualTableWrapper } from './virtual-table'
import { getRuntimeTarget } from './runtime'

export const baseLocalDb = new VitposLocalDb()

export const LOCAL_DB_TABLES = [
  'users',
  'tenants',
  'tenantMembers',
  'products',
  'productCategories',
  'customers',
  'salesOrders',
  'salesOrderItems',
  'payments',
  'stockMovements',
  'inventory',
  'cash',
  'cashCategories',
  'settings',
  'paymentMethods',
  'shifts',
  'suppliers',
  'purchases',
  'purchaseItems',
  'returns',
  'returnItems',
  'serviceOrders',
  'recipes',
  'productionBatches',
  'outbox',
  'syncConflicts',
  'syncRuns'
]


type WrapperCache = Record<string, unknown>

export const localDb = new Proxy(baseLocalDb, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver)
    if (typeof prop === 'string' && LOCAL_DB_TABLES.includes(prop)) {
      const wrapperKey = `__wrapper_${String(prop)}`
      const targetRecord = target as unknown as WrapperCache
      if (!targetRecord[wrapperKey]) {
        if (getRuntimeTarget() === 'web') {
          targetRecord[wrapperKey] = target.table(prop)
        } else {
          targetRecord[wrapperKey] = new VirtualTableWrapper(target.table(prop), prop)
        }
      }
      return targetRecord[wrapperKey]
    }
    return value
  }
}) as VitposLocalDb
