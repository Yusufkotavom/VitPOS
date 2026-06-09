import { describe, expect, it } from 'vitest'

import { localDb } from '@/services/local-db/client'

describe('local auth schema', () => {
  it('has users, tenants, and tenantMembers tables in version 11', () => {
    const authDb = localDb as typeof localDb & {
      users?: unknown
      tenants?: unknown
      tenantMembers?: unknown
    }

    expect(authDb.users).toBeDefined()
    expect(authDb.tenants).toBeDefined()
    expect(authDb.tenantMembers).toBeDefined()
  })
})
