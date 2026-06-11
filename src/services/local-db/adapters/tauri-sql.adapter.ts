import Database from '@tauri-apps/plugin-sql'

import type { LocalDbAdapter, AdapterTable, LocalDbAdapterMetadata, StorageTransactionMode } from '@/services/local-db/adapters'
import { LOCAL_DB_TABLES } from '@/services/local-db/adapters'

const DB_PATH = 'sqlite:vitpos.db'

class TauriSqlAdapterTable<T extends { id: string }> implements AdapterTable<T> {
  private db: Database
  private tableName: string

  constructor(db: Database, tableName: string) {
    this.db = db
    this.tableName = tableName
  }

  async toArray(): Promise<T[]> {
    return this.db.select<T[]>(`SELECT * FROM ${this.tableName}`)
  }

  async get(id: string): Promise<T | undefined> {
    const rows = await this.db.select<T[]>(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id])
    return rows.length > 0 ? rows[0] : undefined
  }

  async bulkGet(ids: string[]): Promise<(T | undefined)[]> {
    if (ids.length === 0) return []
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    const rows = await this.db.select<T[]>(`SELECT * FROM ${this.tableName} WHERE id IN (${placeholders})`, ids)
    const map = new Map(rows.map(r => [r.id, r]))
    return ids.map(id => map.get(id))
  }

  async put(row: T): Promise<unknown> {
    const keys = Object.keys(row).filter(k => row[k as keyof T] !== undefined)
    const values = keys.map(k => {
      const val = row[k as keyof T]
      if (typeof val === 'boolean') return val ? 1 : 0
      return typeof val === 'object' && val !== null ? JSON.stringify(val) : val
    })
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const columns = keys.join(', ')
    const updateAssignments = keys
      .filter(k => k !== 'id')
      .map(k => `${k} = EXCLUDED.${k}`)
      .join(', ')

    let query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`
    if (updateAssignments.length > 0) {
      query += ` ON CONFLICT(id) DO UPDATE SET ${updateAssignments}`
    } else {
      query += ` ON CONFLICT(id) DO NOTHING`
    }

    await this.db.execute(query, values)
    return row.id
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM ${this.tableName} WHERE id = $1`, [id])
  }

  async update(id: string, changes: Partial<T>): Promise<unknown> {
    const keys = Object.keys(changes).filter(k => changes[k as keyof Partial<T>] !== undefined && k !== 'id')
    if (keys.length === 0) return id

    const values = keys.map(k => {
      const val = changes[k as keyof Partial<T>]
      if (typeof val === 'boolean') return val ? 1 : 0
      return typeof val === 'object' && val !== null ? JSON.stringify(val) : val
    })
    values.push(id)

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${keys.length + 1}`
    await this.db.execute(query, values)
    return id
  }

  async count(): Promise<number> {
    const rows = await this.db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM ${this.tableName}`)
    return rows[0]?.count ?? 0
  }

  async bulkPut(rows: T[]): Promise<unknown> {
    if (rows.length === 0) return undefined
    for (const row of rows) {
      await this.put(row)
    }
    return rows.map(r => r.id)
  }

  async clear(): Promise<void> {
    await this.db.execute(`DELETE FROM ${this.tableName}`)
  }

  where(column: string) {
    return {
      equals: (value: unknown) => {
        const executeQuery = async () => {
          if (column.startsWith('[') && column.endsWith(']') && Array.isArray(value)) {
            const cols = column.slice(1, -1).split('+')
            if (cols.length !== value.length) {
              throw new Error(`Compound index mismatch: ${column} vs values length`)
            }
            const whereClause = cols.map((_, i) => `${cols[i]} = $${i + 1}`).join(' AND ')
            const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`
            return this.db.select<T[]>(query, value)
          }
          const query = `SELECT * FROM ${this.tableName} WHERE ${column} = $1`
          return this.db.select<T[]>(query, [value])
        }

        return {
          toArray: async () => await executeQuery(),
          first: async () => {
            const results = await executeQuery()
            return results.length > 0 ? results[0] : undefined
          },
          count: async () => {
            const results = await executeQuery()
            return results.length
          },
          delete: async () => {
            if (column.startsWith('[') && column.endsWith(']') && Array.isArray(value)) {
              const cols = column.slice(1, -1).split('+')
              const whereClause = cols.map((_, i) => `${cols[i]} = $${i + 1}`).join(' AND ')
              await this.db.execute(`DELETE FROM ${this.tableName} WHERE ${whereClause}`, value)
            } else {
              await this.db.execute(`DELETE FROM ${this.tableName} WHERE ${column} = $1`, [value])
            }
          },
          filter: (fn: (item: T) => boolean) => ({
            toArray: async () => {
              const results = await executeQuery()
              return results.filter(fn)
            },
            first: async () => {
              const results = await executeQuery()
              return results.find(fn)
            },
            count: async () => {
              const results = await executeQuery()
              return results.filter(fn).length
            },
          }),
        }
      },
    }
  }
}

class TauriSqlAdapterImpl implements LocalDbAdapter {
  readonly metadata: LocalDbAdapterMetadata = { name: 'tauri-sql', platform: 'desktop' }
  private db: Database | null = null
  private isInitialized = false

  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.db = await Database.load(DB_PATH)
      await this.initializeSchema()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Tauri SQL adapter:', error)
      throw error
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not connected')

    const tableSchemas: Record<string, string> = {
      users: `id TEXT PRIMARY KEY, email TEXT, name TEXT, passwordHash TEXT, role TEXT, avatarUrl TEXT, createdAt TEXT, updatedAt TEXT`,
      tenants: `id TEXT PRIMARY KEY, name TEXT, type TEXT, phone TEXT, planCode TEXT, billingPeriod TEXT, subscriptionStatus TEXT, planValidUntil TEXT, storageLimitMb INTEGER, maxBranches INTEGER, isActive INTEGER, createdAt TEXT, updatedAt TEXT`,
      tenantMembers: `id TEXT PRIMARY KEY, tenantId TEXT, userId TEXT, role TEXT, isActive INTEGER, createdAt TEXT, updatedAt TEXT`,
      products: `id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, category TEXT, type TEXT, price REAL, costPrice REAL, wholesalePrice REAL, wholesaleTiers TEXT, stock REAL, manageStock INTEGER, sku TEXT, barcode TEXT, imageUrl TEXT, icon TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      productCategories: `id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, description TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      customers: `id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, phone TEXT, city TEXT, receivable REAL, orders INTEGER, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      salesOrders: `id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, customerId TEXT, customerName TEXT, date TEXT, subtotal REAL, discountTotal REAL, taxTotal REAL, grandTotal REAL, paidTotal REAL, notes TEXT, status TEXT, items TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      salesOrderItems: `id TEXT PRIMARY KEY, tenantId TEXT, salesOrderId TEXT, productId TEXT, name TEXT, qty REAL, unitPrice REAL, subtotal REAL`,
      payments: `id TEXT PRIMARY KEY, tenantId TEXT, ref TEXT, salesOrderId TEXT, serviceOrderId TEXT, purchaseId TEXT, source TEXT, method TEXT, amount REAL, date TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      stockMovements: `id TEXT PRIMARY KEY, tenantId TEXT, productId TEXT, productName TEXT, warehouseId TEXT, warehouseName TEXT, type TEXT, qty REAL, referenceType TEXT, referenceId TEXT, notes TEXT, syncStatus TEXT, updatedAt TEXT`,
      inventory: `id TEXT PRIMARY KEY, tenantId TEXT, product TEXT, warehouse TEXT, stockSystem REAL, stockSafe REAL, movement TEXT, status TEXT`,
      cash: `id TEXT PRIMARY KEY, tenantId TEXT, ref TEXT, date TEXT, account TEXT, category TEXT, income REAL, expense REAL, status TEXT`,
      cashCategories: `id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, type TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      settings: `id TEXT PRIMARY KEY, tenantId TEXT, area TEXT, setting TEXT, value TEXT, status TEXT, updatedAt TEXT`,
      paymentMethods: `id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, provider TEXT, type TEXT, accountNumber TEXT, accountName TEXT, qrImageUrl TEXT, instructions TEXT, status TEXT, updatedAt TEXT`,
      shifts: `id TEXT PRIMARY KEY, tenantId TEXT, cashierName TEXT, startTime TEXT, endTime TEXT, startCash REAL, expectedCash REAL, actualCash REAL, difference REAL, status TEXT`,
      suppliers: `id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, phone TEXT, city TEXT, payable REAL, orders INTEGER, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      purchases: `id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, supplierId TEXT, supplierName TEXT, date TEXT, subtotal REAL, grandTotal REAL, paidTotal REAL, status TEXT, items TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      purchaseItems: `id TEXT PRIMARY KEY, tenantId TEXT, purchaseId TEXT, productId TEXT, name TEXT, qty REAL, unitPrice REAL, subtotal REAL`,
      returns: `id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, type TEXT, referenceCode TEXT, date TEXT, total REAL, status TEXT, items TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      returnItems: `id TEXT PRIMARY KEY, tenantId TEXT, returnId TEXT, productId TEXT, name TEXT, qty REAL, unitPrice REAL, subtotal REAL`,
      serviceOrders: `id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, customerId TEXT, customerName TEXT, description TEXT, date TEXT, estimatedCompletion TEXT, cost REAL, paidTotal REAL, status TEXT, items TEXT, notes TEXT, timeline TEXT, hasWarranty INTEGER, warrantyValue INTEGER, warrantyUnit TEXT, warrantyStartDate TEXT, warrantyEndDate TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      recipes: `id TEXT PRIMARY KEY, tenantId TEXT, productId TEXT, productName TEXT, name TEXT, batchYield REAL, items TEXT, status TEXT, updatedAt TEXT`,
      productionBatches: `id TEXT PRIMARY KEY, tenantId TEXT, recipeId TEXT, recipeName TEXT, productId TEXT, productName TEXT, batchQty REAL, date TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT`,
      outbox: `id TEXT PRIMARY KEY, tenantId TEXT, entityType TEXT, entityId TEXT, mutationType TEXT, status TEXT, createdAt TEXT, updatedAt TEXT, syncedAt TEXT, payload TEXT`,
      syncConflicts: `id TEXT PRIMARY KEY, tenantId TEXT, entityType TEXT, entityId TEXT, localValue TEXT, cloudValue TEXT, reason TEXT, status TEXT, resolution TEXT, createdAt TEXT, resolvedAt TEXT`,
      syncRuns: `id TEXT PRIMARY KEY, tenantId TEXT, startedAt TEXT, finishedAt TEXT, status TEXT, processed INTEGER, failed INTEGER, pulled INTEGER`,
    }

    const statements = LOCAL_DB_TABLES.map(name => {
      const schema = tableSchemas[name] || `id TEXT PRIMARY KEY, tenantId TEXT, data TEXT`
      return `CREATE TABLE IF NOT EXISTS ${name} (${schema});`
    })

    await this.db.execute(statements.join('\n'))
  }

  async teardown(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }

  storageTable<T extends { id: string }>(name: string): AdapterTable<T> {
    if (!this.db) throw new Error('Database not initialized')
    return new TauriSqlAdapterTable<T>(this.db, name)
  }

  async runInTransaction<T>(_mode: StorageTransactionMode, _tableNames: string[], scope: () => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not initialized')
    try {
      await this.db.execute('BEGIN TRANSACTION')
      const result = await scope()
      await this.db.execute('COMMIT')
      return result
    } catch (error) {
      if (this.db) {
        await this.db.execute('ROLLBACK')
      }
      throw error
    }
  }
}

export const tauriSqlAdapter = new TauriSqlAdapterImpl()
