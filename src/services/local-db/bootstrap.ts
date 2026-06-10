import { clearLocalDemoData, seedLocalDemoData } from '@/services/local-db/seeds'
import { initLocalDb } from '@/services/local-db/adapters/factory'

let bootstrapped = false

export async function bootstrapLocalDb() {
  if (bootstrapped) return

  bootstrapped = true

  await initLocalDb()

  if (import.meta.env.VITE_ENABLE_DEMO_SEED === 'true') {
    await seedLocalDemoData()
    return
  }

  await clearLocalDemoData()
}
