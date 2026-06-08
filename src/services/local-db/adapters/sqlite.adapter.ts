import { type LocalDbAdapter } from '@/services/local-db/adapters'

export const sqliteAdapter: LocalDbAdapter = {
  name: 'sqlite',
  platform: 'mobile',
}
