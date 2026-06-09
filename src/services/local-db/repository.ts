import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import type {
  LocalCash,
  LocalCashCategory,
  LocalCustomer,
  LocalInventory,
  LocalPayment,
  LocalProduct,
  LocalProductCategory,
  LocalPurchase,
  LocalRecipe,
  LocalReturn,
  LocalSalesOrder,
  LocalServiceOrder,
  LocalSetting,
  LocalPaymentMethod,
  LocalShift,
  LocalStockMovement,
  LocalSupplier,
  OutboxItem,
  SyncEntityType,
  SyncMutationType,
} from '@/services/local-db/schema'

type RepositoryTable<T extends { id: string; tenantId: string }> = {
  toArray: () => Promise<T[]>
  get: (id: string) => Promise<T | undefined>
  put: (row: T) => Promise<unknown>
  delete: (id: string) => Promise<void>
  where?: (key: string) => { equals: (val: string) => { toArray: () => Promise<T[]> } }
}

type OutboxTable = {
  put: (row: OutboxItem & { tenantId?: string }) => Promise<unknown>
}

type RepositoryOptions<T extends { id: string; tenantId: string }> = {
  table: RepositoryTable<T>
  outboxTable: OutboxTable
  entityType: SyncEntityType
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

async function enqueueMutation<T extends { id: string; tenantId: string }>(outboxTable: OutboxTable, entityType: SyncEntityType, mutationType: SyncMutationType, row: T) {
  const now = new Date().toISOString()
  const item: OutboxItem & { tenantId?: string } = {
    id: createId('outbox'),
    tenantId: row.tenantId,
    entityType,
    entityId: row.id,
    mutationType,
    payload: row,
    status: 'queued',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }

  await outboxTable.put(item)
  return item
}

export function createRepository<T extends { id: string; tenantId: string }>({ table, outboxTable, entityType }: RepositoryOptions<T>) {
  return {
    async list(tenantId: string = requireActiveTenantId()) {
      if (table.where) {
        return table.where('tenantId').equals(tenantId).toArray()
      }
      const rows = await table.toArray()
      return rows.filter((row) => row.tenantId === tenantId)
    },
    async get(id: string, tenantId: string = requireActiveTenantId()) {
      const item = await table.get(id)
      if (item && item.tenantId === tenantId) return item
      return undefined
    },
    async upsert(row: T) {
      if (!row.tenantId) throw new Error('tenantId is required for upsert')
      const existing = await table.get(row.id)
      await table.put(row)
      await enqueueMutation(outboxTable, entityType, existing ? 'update' : 'create', row)
      return row
    },
    async remove(id: string, tenantId: string = requireActiveTenantId()) {
      const existing = await this.get(id, tenantId)
      if (existing) {
        await table.delete(id)
        await enqueueMutation(outboxTable, entityType, 'delete', existing)
      }
    },
  }
}

export const productRepository = createRepository<LocalProduct>({ table: localDb.products, outboxTable: localDb.outbox, entityType: 'product' })
export const customerRepository = createRepository<LocalCustomer>({ table: localDb.customers, outboxTable: localDb.outbox, entityType: 'customer' })
export const salesOrderRepository = createRepository<LocalSalesOrder>({ table: localDb.salesOrders, outboxTable: localDb.outbox, entityType: 'sale' })
export const paymentRepository = createRepository<LocalPayment>({ table: localDb.payments, outboxTable: localDb.outbox, entityType: 'payment' })
export const stockMovementRepository = createRepository<LocalStockMovement>({ table: localDb.stockMovements, outboxTable: localDb.outbox, entityType: 'stock_movement' })
export const cashRepository = createRepository<LocalCash>({ table: localDb.cash, outboxTable: localDb.outbox, entityType: 'cash' })
export const cashCategoryRepository = createRepository<LocalCashCategory>({ table: localDb.cashCategories, outboxTable: localDb.outbox, entityType: 'cash_category' })
export const inventoryRepository = createRepository<LocalInventory>({ table: localDb.inventory, outboxTable: localDb.outbox, entityType: 'stock_movement' })
export const settingRepository = createRepository<LocalSetting>({ table: localDb.settings, outboxTable: localDb.outbox, entityType: 'setting' })
export const shiftRepository = createRepository<LocalShift>({ table: localDb.shifts, outboxTable: localDb.outbox, entityType: 'shift' })
export const productCategoryRepository = createRepository<LocalProductCategory>({ table: localDb.productCategories, outboxTable: localDb.outbox, entityType: 'product_category' })
export const supplierRepository = createRepository<LocalSupplier>({ table: localDb.suppliers, outboxTable: localDb.outbox, entityType: 'supplier' })
export const purchaseRepository = createRepository<LocalPurchase>({ table: localDb.purchases, outboxTable: localDb.outbox, entityType: 'purchase' })
export const returnRepository = createRepository<LocalReturn>({ table: localDb.returns, outboxTable: localDb.outbox, entityType: 'return' })
export const serviceOrderRepository = createRepository<LocalServiceOrder>({ table: localDb.serviceOrders, outboxTable: localDb.outbox, entityType: 'service_order' })
export const paymentMethodRepository = createRepository<LocalPaymentMethod>({ table: localDb.paymentMethods, outboxTable: localDb.outbox, entityType: 'payment_method' })
export const recipeRepository = createRepository<LocalRecipe>({ table: localDb.recipes, outboxTable: localDb.outbox, entityType: 'recipe' })
