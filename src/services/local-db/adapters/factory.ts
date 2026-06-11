import { dexieAdapter } from '@/services/local-db/adapters/indexeddb.adapter'
import { sqliteAdapter } from '@/services/local-db/adapters/sqlite.adapter'
import type { LocalDbAdapter } from '@/services/local-db/adapters'
import { Capacitor } from '@capacitor/core'

function isTauri(): boolean {
  return typeof window !== 'undefined' && (
    '__TAURI__' in window || '__TAURI_INTERNALS__' in window
  )
}

let _tauriAdapter: LocalDbAdapter | null = null

export function getLocalDbAdapter(): LocalDbAdapter {
  if (_tauriAdapter) return _tauriAdapter
  if (Capacitor.isNativePlatform()) return sqliteAdapter
  return dexieAdapter
}

export async function initLocalDb(): Promise<void> {
  let adapter: LocalDbAdapter
  if (isTauri()) {
    const { tauriSqlAdapter } = await import('@/services/local-db/adapters/tauri-sql.adapter')
    _tauriAdapter = tauriSqlAdapter
    adapter = tauriSqlAdapter
  } else {
    adapter = getLocalDbAdapter()
  }
  await adapter.init()
}
