import { dexieAdapter } from '@/services/local-db/adapters/indexeddb.adapter'
import { sqliteAdapter } from '@/services/local-db/adapters/sqlite.adapter'
import type { LocalDbAdapter } from '@/services/local-db/adapters'
import { Capacitor } from '@capacitor/core'

/**
 * Gets the appropriate local database adapter based on the current platform
 */
export function getLocalDbAdapter(): LocalDbAdapter {
  if (Capacitor.isNativePlatform()) {
    // Return SQLite for Android and iOS
    return sqliteAdapter
  } else {
    // Return Dexie for Web
    return dexieAdapter
  }
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