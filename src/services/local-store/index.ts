import { getRuntimeTarget } from '@/services/local-store/runtime'
import type { LocalStoreAdapter } from '@/services/local-store/adapter'
import { dexieAdapter } from '@/services/local-store/dexie-adapter'
import { sqliteAdapter } from '@/services/local-store/sqlite-adapter'

// Select the appropriate adapter based on the runtime target
export function getLocalStoreAdapter(): LocalStoreAdapter {
  const target = getRuntimeTarget()
  
  switch (target) {
    case 'desktop':
      return sqliteAdapter
    case 'web':
    default:
      return dexieAdapter
  }
}

// Export types for convenience
export type { 
  RuntimeTarget, 
  LocalStoreHealth, 
  LocalStoreAdapter,
  OutboxItem
} from '@/services/local-store/adapter'