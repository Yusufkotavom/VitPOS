import { type LocalDbAdapter, type AdapterTable, type LocalDbAdapterMetadata } from '@/services/local-db/adapters'

class SqliteAdapterStub implements LocalDbAdapter {
  readonly metadata: LocalDbAdapterMetadata = { name: 'sqlite', platform: 'mobile' }

  async init(): Promise<void> { 
    // Capacitor sqlite plugin initialization would go here
    console.log('SQLite adapter init via Capacitor (stub)')
  }

  async teardown(): Promise<void> { 
    console.log('SQLite adapter teardown')
  }

  storageTable<T extends { id: string }>(): AdapterTable<T> { 
    return {
      toArray: async () => [],
      get: async () => undefined,
      put: async () => undefined,
      delete: async () => undefined,
      update: async () => undefined,
      count: async () => 0,
      bulkPut: async () => undefined,
      clear: async () => undefined
    }
  }

  async runInTransaction<T>(): Promise<T> { 
    throw new Error('SQLite transactions not fully implemented yet')
  }
}

export const sqliteAdapter = new SqliteAdapterStub()
