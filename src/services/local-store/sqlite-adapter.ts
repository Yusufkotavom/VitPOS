import { invoke } from '@tauri-apps/api/core'
import type { LocalStoreAdapter, LocalStoreHealth, OutboxItem } from '@/services/local-store/adapter'

export class SqliteAdapter implements LocalStoreAdapter {
  async health(): Promise<LocalStoreHealth> {
    try {
      const message: string = await invoke('sqlite_health')
      return {
        target: 'desktop',
        status: 'ready',
        message
      }
    } catch (error) {
      return {
        target: 'desktop',
        status: 'unavailable',
        message: `SQLite tidak tersedia: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async list<TRecord>(table: string): Promise<TRecord[]> {
    try {
      return await invoke('sqlite_list', { table })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Gagal membaca tabel ${table}: ${msg}`, { cause: error })
    }
  }

  async get<TRecord>(table: string, id: string): Promise<TRecord | undefined> {
    try {
      return await invoke('sqlite_get', { table, id })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Gagal membaca data dari tabel ${table} dengan id ${id}: ${msg}`, { cause: error })
    }
  }

  async put<TRecord extends { id: string }>(table: string, record: TRecord): Promise<void> {
    try {
      await invoke('sqlite_put', { table, record })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Gagal menyimpan data ke tabel ${table}: ${msg}`, { cause: error })
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      await invoke('sqlite_delete', { table, id })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Gagal menghapus data dari tabel ${table} dengan id ${id}: ${msg}`, { cause: error })
    }
  }

  async enqueueOutbox(item: OutboxItem): Promise<void> {
    try {
      await invoke('sqlite_enqueue_outbox', { item })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Gagal mendaftarkan outbox item: ${msg}`, { cause: error })
    }
  }

  async runInTransaction<T>(scope: () => Promise<T>): Promise<T> {
    try {
      // For now, we'll execute the scope directly
      // In the future, we might want to implement proper transaction support
      return await scope()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Gagal menjalankan transaksi: ${msg}`, { cause: error })
    }
  }
}

export const sqliteAdapter = new SqliteAdapter()