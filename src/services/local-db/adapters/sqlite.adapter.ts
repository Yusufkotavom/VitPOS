import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

import type { LocalDbAdapter, AdapterTable, LocalDbAdapterMetadata, StorageTransactionMode } from '@/services/local-db/adapters';
import { LOCAL_DB_TABLES } from '@/services/local-db/adapters';

const DB_NAME = 'vitpos_db';
const DB_VERSION = 1;

class SqliteAdapterTable<T extends { id: string }> implements AdapterTable<T> {
  private db: SQLiteDBConnection;
  private tableName: string;

  constructor(db: SQLiteDBConnection, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  async toArray(): Promise<T[]> {
    const res = await this.db.query(`SELECT * FROM ${this.tableName}`);
    return res.values ? res.values.map(v => this.parseRow(v)) : [];
  }

  async get(id: string): Promise<T | undefined> {
    const res = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    if (res.values && res.values.length > 0) {
      return this.parseRow(res.values[0]);
    }
    return undefined;
  }

  // Minimal Dexie-like where emulation
  where(column: string) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      equals: (value: any) => {
        const executeQuery = async () => {
          // Handle compound index queries like '[tenantId+name]' -> ['t1', 'foo']
          if (column.startsWith('[') && column.endsWith(']') && Array.isArray(value)) {
            const cols = column.slice(1, -1).split('+');
            if (cols.length !== value.length) {
              throw new Error(`Compound index mismatch: ${column} vs values length`);
            }
            const whereClause = cols.map(c => `${c} = ?`).join(' AND ');
            const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
            const res = await this.db.query(query, value);
            return res.values ? res.values.map(v => this.parseRow(v)) : [];
          }
          
          const query = `SELECT * FROM ${this.tableName} WHERE ${column} = ?`;
          const res = await this.db.query(query, [value]);
          return res.values ? res.values.map(v => this.parseRow(v)) : [];
        };

        return {
          toArray: async () => await executeQuery(),
          first: async () => {
            const results = await executeQuery();
            return results.length > 0 ? results[0] : undefined;
          },
          count: async () => {
            const results = await executeQuery();
            return results.length;
          },
          delete: async () => {
             if (column.startsWith('[') && column.endsWith(']') && Array.isArray(value)) {
               const cols = column.slice(1, -1).split('+');
               const whereClause = cols.map(c => `${c} = ?`).join(' AND ');
               const delQuery = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
               await this.db.run(delQuery, value);
             } else {
               const delQuery = `DELETE FROM ${this.tableName} WHERE ${column} = ?`;
               await this.db.run(delQuery, [value]);
             }
          }
        };
      }
    };
  }

  async put(row: T): Promise<unknown> {
    const keys = Object.keys(row).filter(k => row[k as keyof T] !== undefined);
    const values = keys.map(k => {
      const val = row[k as keyof T];
      if (typeof val === 'boolean') return val ? 1 : 0;
      return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
    });
    
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    
    // SQLite upsert
    const updateAssignments = keys
      .filter(k => k !== 'id')
      .map(k => `${k} = EXCLUDED.${k}`)
      .join(', ');
      
    let query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    
    if (updateAssignments.length > 0) {
      query += ` ON CONFLICT(id) DO UPDATE SET ${updateAssignments}`;
    } else {
      query += ` ON CONFLICT(id) DO NOTHING`;
    }

    await this.db.run(query, values);
    return row.id;
  }

  async delete(id: string): Promise<void> {
    await this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  async update(id: string, changes: Partial<T>): Promise<unknown> {
    const keys = Object.keys(changes).filter(k => changes[k as keyof Partial<T>] !== undefined && k !== 'id');
    
    if (keys.length === 0) return id;

    const values = keys.map(k => {
      const val = changes[k as keyof Partial<T>];
      if (typeof val === 'boolean') return val ? 1 : 0;
      return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
    });
    
    // Add id to values for the WHERE clause
    values.push(id);
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    
    await this.db.run(query, values);
    return id;
  }

  async count(): Promise<number> {
    const res = await this.db.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    if (res.values && res.values.length > 0) {
      return res.values[0].count;
    }
    return 0;
  }

  async bulkPut(rows: T[]): Promise<unknown> {
    if (rows.length === 0) return undefined;
    
    // Create a transaction for bulk insert
    const keys = Object.keys(rows[0]).filter(k => rows[0][k as keyof T] !== undefined);
    const columns = keys.join(', ');
    
    const updateAssignments = keys
      .filter(k => k !== 'id')
      .map(k => `${k} = EXCLUDED.${k}`)
      .join(', ');
      
    let statement = `INSERT INTO ${this.tableName} (${columns}) VALUES (${keys.map(() => '?').join(', ')})`;
    if (updateAssignments.length > 0) {
      statement += ` ON CONFLICT(id) DO UPDATE SET ${updateAssignments}`;
    } else {
      statement += ` ON CONFLICT(id) DO NOTHING`;
    }

    const valuesArray = rows.map(row => {
      return keys.map(k => {
        const val = row[k as keyof T];
        if (typeof val === 'boolean') return val ? 1 : 0;
        return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
      });
    });

    await this.db.executeSet([
      {
        statement,
        values: valuesArray
      }
    ]);
    
    return rows.map(r => r.id);
  }

  async clear(): Promise<void> {
    await this.db.run(`DELETE FROM ${this.tableName}`);
  }

  // Helper to parse JSON strings and handle boolean conversions back to objects where needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseRow(row: any): T {
    const parsedRow = { ...row };
    // This is a naive implementation. In a real app, you'd need schema knowledge
    // to know which columns are JSON objects/arrays.
    for (const key in parsedRow) {
      if (typeof parsedRow[key] === 'string' && 
         (parsedRow[key].startsWith('{') || parsedRow[key].startsWith('['))) {
        try {
          parsedRow[key] = JSON.parse(parsedRow[key]);
        } catch {
          // Keep as string if parsing fails
        }
      }
      // Naive boolean check for numeric 1/0
      // If we had schema defs per table we would know exactly which cols are booleans
      else if (parsedRow[key] === 1 || parsedRow[key] === 0) {
          // In some cases we might misinterpret a 1/0 number as boolean
          // To be perfectly safe, we need schema maps. We'll leave it as number
          // unless the property specifically requires boolean. In JS true/false
          // truthiness often handles 1/0 correctly anyway.
      }
    }
    return parsedRow as T;
  }
}

class SqliteAdapterImpl implements LocalDbAdapter {
  readonly metadata: LocalDbAdapterMetadata = { name: 'sqlite', platform: 'mobile' };
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!Capacitor.isNativePlatform()) {
      console.warn('SQLite adapter requires native platform, running in web mode might not work correctly');
      // For web testing, could initialize a sql.js or wasm sqlite instance here
      // But usually we'd use Dexie on web instead
    }

    try {
      // Check if DB exists
      const dbExists = await this.sqlite.isDatabase(DB_NAME);
      
      if (!dbExists.result) {
        console.log(`Creating database ${DB_NAME}`);
      }

      // Create connection
      this.db = await this.sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        DB_VERSION,
        false
      );

      // Open database
      await this.db.open();

      // Initialize schema
      await this.initializeSchema();
      
      this.isInitialized = true;
      console.log('SQLite adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite adapter:', error);
      throw error;
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Define strict schemas for all tables
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
      syncRuns: `id TEXT PRIMARY KEY, tenantId TEXT, startedAt TEXT, finishedAt TEXT, status TEXT, processed INTEGER, failed INTEGER, pulled INTEGER`
    };

    const createTableStatements = LOCAL_DB_TABLES.map(tableName => {
      const schema = tableSchemas[tableName] || `id TEXT PRIMARY KEY, tenantId TEXT, data TEXT`;
      return `CREATE TABLE IF NOT EXISTS ${tableName} (${schema});`;
    });

    const schema = `
      ${createTableStatements.join('\n')}
    `;

    try {
      await this.db.execute(schema);
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(DB_NAME, false);
      this.db = null;
      this.isInitialized = false;
    }
  }

  storageTable<T extends { id: string }>(name: string): AdapterTable<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return new SqliteAdapterTable<T>(this.db, name);
  }

  async runInTransaction<T>(_mode: StorageTransactionMode, _tableNames: string[], scope: () => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Start transaction
      await this.db.execute('BEGIN TRANSACTION');
      
      // Execute the scope
      const result = await scope();
      
      // Commit transaction
      await this.db.execute('COMMIT');
      
      return result;
    } catch (error) {
      // Rollback on error
      if (this.db) {
        await this.db.execute('ROLLBACK');
      }
      throw error;
    }
  }
}

export const sqliteAdapter = new SqliteAdapterImpl();