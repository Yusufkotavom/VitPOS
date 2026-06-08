import { seedLocalDemoData } from '@/services/local-db/seeds'

let bootstrapped = false

export async function bootstrapLocalDb() {
  if (bootstrapped) return

  bootstrapped = true
  await seedLocalDemoData()
}
