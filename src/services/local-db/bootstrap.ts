import { clearLocalDemoData, seedLocalDemoData } from '@/services/local-db/seeds'

let bootstrapped = false

export async function bootstrapLocalDb() {
  if (bootstrapped) return

  bootstrapped = true

  if (import.meta.env.VITE_ENABLE_DEMO_SEED === 'true') {
    await seedLocalDemoData()
    return
  }

  await clearLocalDemoData()
}
