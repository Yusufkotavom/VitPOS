import { type LocalDbAdapter, type AdapterTable, type LocalDbAdapterMetadata } from '@/services/local-db/adapters'

class SqliteAdapterStub implements LocalDbAdapter {
  readonly metadata: LocalDbAdapterMetadata = { name: 'sqlite', platform: 'mobile' }

  async init(): Promise<void> { throw new Error('SQLite adapter not yet implemented') }
  async teardown(): Promise<void> { throw new Error('SQLite adapter not yet implemented') }
  storageTable<T extends { id: string }>(): AdapterTable<T> { throw new Error('SQLite adapter not yet implemented') }
  async runInTransaction<T>(): Promise<T> { throw new Error('SQLite adapter not yet implemented') }
}

export const sqliteAdapter = new SqliteAdapterStub()
