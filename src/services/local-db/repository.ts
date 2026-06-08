import { localDb } from '@/services/local-db/client'
import type {
  LocalCash,
  LocalCustomer,
  LocalInventory,
  LocalPayment,
  LocalProduct,
  LocalProductCategory,
  LocalSalesOrder,
  LocalSetting,
  LocalShift,
  LocalStockMovement,
  OutboxItem,
  SyncEntityType,
  SyncMutationType,
} from '@/services/local-db/schema'

type RepositoryTable<T extends { id: string }> = {
  toArray: () => Promise<T[]>
  get: (id: string) => Promise<T | undefined>
  put: (row: T) => Promise<unknown>
  delete: (id: string) => Promise<void>
}

type OutboxTable = {
  put: (row: OutboxItem) => Promise<unknown>
}

type RepositoryOptions<T extends { id: string }> = {
  table: RepositoryTable<T>
  outboxTable: OutboxTable
  entityType: SyncEntityType
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

async function enqueueMutation<T extends { id: string }>(outboxTable: OutboxTable, entityType: SyncEntityType, mutationType: SyncMutationType, row: T) {
  const now = new Date().toISOString()
  const item: OutboxItem = {
    id: createId('outbox'),
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

export function createRepository<T extends { id: string }>({ table, outboxTable, entityType }: RepositoryOptions<T>) {
  return {
    list() {
      return table.toArray()
    },
    get(id: string) {
      return table.get(id)
    },
    async upsert(row: T) {
      const existing = await table.get(row.id)
      await table.put(row)
      await enqueueMutation(outboxTable, entityType, existing ? 'update' : 'create', row)
      return row
    },
    async remove(id: string) {
      const existing = await table.get(id)
      await table.delete(id)

      if (existing) {
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
export const inventoryRepository = createRepository<LocalInventory>({ table: localDb.inventory, outboxTable: localDb.outbox, entityType: 'stock_movement' })
export const settingRepository = createRepository<LocalSetting>({ table: localDb.settings, outboxTable: localDb.outbox, entityType: 'setting' })
export const shiftRepository = createRepository<LocalShift>({ table: localDb.shifts, outboxTable: localDb.outbox, entityType: 'shift' })
export const productCategoryRepository = createRepository<LocalProductCategory>({ table: localDb.productCategories, outboxTable: localDb.outbox, entityType: 'product_category' })
