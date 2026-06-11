import { dexieAdapter } from '@/services/local-db/adapters/indexeddb.adapter'
import { sqliteAdapter } from '@/services/local-db/adapters/sqlite.adapter'
import { tauriSqlAdapter } from '@/services/local-db/adapters/tauri-sql.adapter'
import type { LocalDbAdapter } from '@/services/local-db/adapters'
import { Capacitor } from '@capacitor/core'

function isTauri(): boolean {
  return typeof window !== 'undefined' && (
    '__TAURI__' in window || '__TAURI_INTERNALS__' in window
  )
}

/**
 * Gets the appropriate local database adapter based on the current platform
 */
export function getLocalDbAdapter(): LocalDbAdapter {
  if (isTauri()) {
    return tauriSqlAdapter
  }
  if (Capacitor.isNativePlatform()) {
    return sqliteAdapter
  }
  return dexieAdapter
}

/**
 * Initializes the appropriate local database adapter
 */
export async function initLocalDb(): Promise<void> {
  const adapter = getLocalDbAdapter()
  await adapter.init()
}

/**
 * Provides access to the active database adapter instance
 */
export const activeDb = getLocalDbAdapter()
