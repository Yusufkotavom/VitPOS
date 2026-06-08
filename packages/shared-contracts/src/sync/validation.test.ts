import { describe, expect, it } from 'vitest'

import {
  parseSyncPullQuery,
  parseSyncPushBody,
} from './index'

describe('sync contract validation', () => {
  it('validates sync push body tenant, device, and mutations', () => {
    const result = parseSyncPushBody({
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: null,
      deviceId: 'kasir-1',
      mutations: [
        {
          entityId: '22222222-2222-4222-8222-222222222222',
          entityType: 'product',
          mutationType: 'create',
          clientMutationId: 'm-1',
          payload: { name: 'Kopi' },
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.deviceId).toBe('kasir-1')
    expect(result.value.mutations).toHaveLength(1)
  })

  it('rejects sync push body with invalid mutation', () => {
    const result = parseSyncPushBody({
      tenantId: '11111111-1111-4111-8111-111111111111',
      deviceId: 'kasir-1',
      mutations: [{ entityId: 'bad', entityType: 'unknown', mutationType: 'create' }],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toContain('mutations')
  })

  it('validates pull query and normalizes since date', () => {
    const result = parseSyncPullQuery({
      tenantId: '11111111-1111-4111-8111-111111111111',
      branchId: '33333333-3333-4333-8333-333333333333',
      since: '2026-06-08T00:00:00.000Z',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.since?.toISOString()).toBe('2026-06-08T00:00:00.000Z')
  })

  it('accepts setting, shift, and product_category as valid entityTypes', () => {
    const types = ['setting', 'shift', 'product_category']
    for (const type of types) {
      const result = parseSyncPushBody({
        tenantId: '11111111-1111-4111-8111-111111111111',
        deviceId: 'kasir-1',
        mutations: [
          {
            entityId: '22222222-2222-4222-8222-222222222222',
            entityType: type,
            mutationType: 'create',
            payload: {},
          },
        ],
      })
      expect(result.ok).toBe(true)
    }
  })

})
