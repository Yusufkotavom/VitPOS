import 'fake-indexeddb/auto'

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from 'dotenv'

import { createApp } from '../../../apps/api/src/app'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { DEMO_TENANT_ID, DEMO_USER_ID, seedLocalDemoData } from '@/services/local-db/seeds'
import { runSync } from '@/services/sync/sync-engine'

config({ path: '.env.local' })
config()

const app = createApp()

async function clearLocalDb() {
  await Promise.all([
    localDb.users.clear(),
    localDb.tenants.clear(),
    localDb.tenantMembers.clear(),
    localDb.products.clear(),
    localDb.customers.clear(),
    localDb.salesOrders.clear(),
    localDb.salesOrderItems.clear(),
    localDb.payments.clear(),
    localDb.stockMovements.clear(),
    localDb.inventory.clear(),
    localDb.cash.clear(),
    localDb.outbox.clear(),
    localDb.syncConflicts.clear(),
    localDb.syncRuns.clear(),
  ])
}

describe('runSync integration', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init)
      return app.request(request)
    })
  })

  beforeEach(async () => {
    localStorage.removeItem('kotacom-auth-store')
    await clearLocalDb()
    await seedLocalDemoData()
    const tenant = await localDb.tenants.get(DEMO_TENANT_ID)
    const user = await localDb.users.get(DEMO_USER_ID)
    useAuthStore.setState({ currentUser: user, activeTenant: { ...tenant, role: 'owner' } })
  })

  afterEach(async () => {
    await clearLocalDb()
    useAuthStore.setState({ currentUser: null, activeTenant: null })
  })

  it('pushes queued local mutations to the API and marks them synced', async () => {
    const result = await runSync()
    const outbox = await localDb.outbox.toArray()

    expect(result.processed).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.pulled).toBeGreaterThanOrEqual(0)
    expect(outbox).toHaveLength(2)
    expect(outbox.every((item) => item.status === 'synced')).toBe(true)
  }, 15000)
})
