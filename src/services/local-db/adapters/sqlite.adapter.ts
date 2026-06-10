import { type LocalDbAdapter, type AdapterTable, type LocalDbAdapterMetadata, LOCAL_DB_TABLES } from '@/services/local-db/adapters'
import TauriDatabase from '@tauri-apps/plugin-sql'
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'
import { getRuntimeTarget } from '../runtime'

type SqliteRow = { data: string; count?: number }
type SqliteBindValue = string | number | boolean

interface DBConnection {
  execute(sql: string, binds?: SqliteBindValue[]): Promise<void>
  select<T>(sql: string, binds?: SqliteBindValue[]): Promise<T[]>
  close(): Promise<void>
}

class TauriDB implements DBConnection {
  private db: TauriDatabase
  constructor(db: TauriDatabase) { this.db = db }
  async execute(sql: string, binds?: SqliteBindValue[]) {
    await this.db.execute(sql, binds)
  }
  async select<T>(sql: string, binds?: SqliteBindValue[]) {
    return await this.db.select<T[]>(sql, binds)
  }
  async close() {
    await this.db.close()
  }
}

class CapacitorDB implements DBConnection {
  private db: SQLiteDBConnection
  constructor(db: SQLiteDBConnection) { this.db = db }
  async execute(sql: string, binds?: SqliteBindValue[]) {
    await this.db.run(sql, binds)
  }
  async select<T>(sql: string, binds?: SqliteBindValue[]) {
    const result = await this.db.query(sql, binds)
    return (result.values || []) as T[]
  }
  async close() {
    await this.db.close()
  }
}

class SqliteAdapterImpl implements LocalDbAdapter {
  readonly metadata: LocalDbAdapterMetadata = { name: 'sqlite', platform: 'desktop' } // Platform might be updated in init
  private db: DBConnection | null = null

  async init(): Promise<void> { 
    try {
      const runtime = getRuntimeTarget()
      
      if (runtime === 'desktop') {
        this.metadata.platform = 'desktop'
        const tauriDb = await TauriDatabase.load('sqlite:vitpos.db')
        this.db = new TauriDB(tauriDb)
        console.log('SQLite adapter initialized via Tauri')
      } else if (runtime === 'mobile') {
        this.metadata.platform = 'mobile'
        const sqlite = new SQLiteConnection(CapacitorSQLite)
        const capDb = await sqlite.createConnection('vitpos', false, 'no-encryption', 1, false)
        await capDb.open()
        this.db = new CapacitorDB(capDb)
        console.log('SQLite adapter initialized via Capacitor')
      } else {
        throw new Error('SQLite adapter cannot run on web. Fallback to Dexie.')
      }
      
      // Auto-provision tables for JSON storage
      for (const table of LOCAL_DB_TABLES) {
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS ${table} (
            id TEXT PRIMARY KEY,
            data TEXT
          )
        `)
      }
    } catch (e) {
      console.error(`Failed to load sqlite db via ${this.metadata.platform}`, e)
    }
  }

  async teardown(): Promise<void> { 
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }

  storageTable<T extends { id: string }>(name: string): AdapterTable<T> { 
    return {
      toArray: async () => {
        if (!this.db) return []
        const rows = await this.db.select<SqliteRow>(`SELECT data FROM ${name}`)
        return rows.map((row) => JSON.parse(row.data) as T)
      },
      get: async (id: string) => {
        if (!this.db) return undefined
        const rows = await this.db.select<SqliteRow>(`SELECT data FROM ${name} WHERE id = ?`, [id])
        if (rows.length > 0) return JSON.parse(rows[0].data) as T
        return undefined
      },
      put: async (row: T) => {
        if (!this.db) return undefined
        await this.db.execute(
          `INSERT OR REPLACE INTO ${name} (id, data) VALUES (?, ?)`, 
          [row.id, JSON.stringify(row)]
        )
      },
      delete: async (id: string) => {
        if (!this.db) return
        await this.db.execute(`DELETE FROM ${name} WHERE id = ?`, [id])
      },
      update: async (id: string, changes: Partial<T>) => {
        if (!this.db) return
        const existingRows = await this.db.select<SqliteRow>(`SELECT data FROM ${name} WHERE id = ?`, [id])
        if (existingRows.length === 0) return
        const existing = JSON.parse(existingRows[0].data) as T
        const updated = { ...existing, ...changes }
        await this.db.execute(
          `INSERT OR REPLACE INTO ${name} (id, data) VALUES (?, ?)`, 
          [id, JSON.stringify(updated)]
        )
      },
      count: async () => {
        if (!this.db) return 0
        const rows = await this.db.select<SqliteRow>(`SELECT COUNT(*) as count FROM ${name}`)
        return rows[0].count || 0
      },
      bulkPut: async (rows: T[]) => {
        if (!this.db) return
        for (const row of rows) {
          await this.db.execute(
            `INSERT OR REPLACE INTO ${name} (id, data) VALUES (?, ?)`, 
            [row.id, JSON.stringify(row)]
          )
        }
      },
      clear: async () => {
        if (!this.db) return
        await this.db.execute(`DELETE FROM ${name}`)
      },
      findBy: async (key: string, value: string | number | boolean) => {
         if (!this.db) return []
         const rows = await this.db.select<SqliteRow>(
            `SELECT data FROM ${name} WHERE json_extract(data, '$.${key}') = ?`,
            [value]
          )
         return rows.map((row) => JSON.parse(row.data) as T)
      },
      orderBy: async (key: string, direction: 'asc' | 'desc') => {
         if (!this.db) return []
         const rows = await this.db.select<SqliteRow>(
            `SELECT data FROM ${name} ORDER BY json_extract(data, '$.${key}') ${direction.toUpperCase()}`
          )
         return rows.map((row) => JSON.parse(row.data) as T)
      }
    }
  }

  async runInTransaction<T>(): Promise<T> { 
    throw new Error('SQLite transactions not fully implemented yet')
  }
}

export const sqliteAdapter = new SqliteAdapterImpl()
