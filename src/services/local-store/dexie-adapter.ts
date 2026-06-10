import type { LocalStoreAdapter, LocalStoreHealth, OutboxItem } from '@/services/local-store/adapter'
import { localDb } from '@/services/local-db/client'
import type { Table } from 'dexie'

export class DexieAdapter implements LocalStoreAdapter {
  async health(): Promise<LocalStoreHealth> {
    try {
      if (!localDb.isOpen()) {
        await localDb.open()
      }
      return {
        target: 'web',
        status: 'ready',
        message: 'IndexedDB siap'
      }
    } catch (error) {
      return {
        target: 'web',
        status: 'unavailable',
        message: `IndexedDB tidak tersedia: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async list<TRecord>(table: string): Promise<TRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbTable = (localDb as any)[table] as Table<TRecord, string> | undefined
    if (!dbTable) {
      throw new Error(`Table tidak ditemukan: ${table}`)
    }
    return await dbTable.toArray()
  }

  async get<TRecord>(table: string, id: string): Promise<TRecord | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbTable = (localDb as any)[table] as Table<TRecord, string> | undefined
    if (!dbTable) {
      throw new Error(`Table tidak ditemukan: ${table}`)
    }
    return await dbTable.get(id)
  }

  async put<TRecord extends { id: string }>(table: string, record: TRecord): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbTable = (localDb as any)[table] as Table<TRecord, string> | undefined
    if (!dbTable) {
      throw new Error(`Table tidak ditemukan: ${table}`)
    }
    await dbTable.put(record)
  }

  async delete(table: string, id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbTable = (localDb as any)[table] as Table<unknown, string> | undefined
    if (!dbTable) {
      throw new Error(`Table tidak ditemukan: ${table}`)
    }
    await dbTable.delete(id)
  }

  async enqueueOutbox(item: OutboxItem): Promise<void> {
    await localDb.outbox.put(item)
  }

  async runInTransaction<T>(scope: () => Promise<T>): Promise<T> {
    // Dexie transactions are handled at the repository level
    // For now, we just execute the scope directly
    return await scope()
  }
}

export const dexieAdapter = new DexieAdapter()