import { type LocalDbAdapter } from '@/services/local-db/adapters'

export const indexedDbAdapter: LocalDbAdapter = {
  name: 'indexeddb',
  platform: 'web',
}
