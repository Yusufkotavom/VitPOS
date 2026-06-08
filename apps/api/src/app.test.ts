import { describe, expect, it } from 'vitest'

import { createApp } from './app'

describe('createApp', () => {
  it('serves health route without database env', async () => {
    const previousUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    try {
      const app = createApp()
      const response = await app.request('/health')
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({ ok: true, service: 'kotacom-api', version: 'v1' })
    } finally {
      if (previousUrl) {
        process.env.DATABASE_URL = previousUrl
      } else {
        delete process.env.DATABASE_URL
      }
    }
  })

  describe('sync endpoints', () => {
    it('rejects /api/v1/sync/pull when tenantId missing', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/sync/pull')
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'tenantId required' })
    })

    it('rejects /api/v1/sync/pull when branchId invalid', async () => {
      const app = createApp()
      const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
      const response = await app.request(`/api/v1/sync/pull?tenantId=${validTenantId}&branchId=not-a-uuid`)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'branchId invalid' })
    })

    it('rejects /api/v1/sync/push when body is empty', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null),
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'body invalid' })
    })

    it('rejects /api/v1/sync/push when mutations array is empty', async () => {
      const app = createApp()
      const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
      const response = await app.request('/api/v1/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: validTenantId,
          deviceId: 'test-device',
          mutations: [],
        }),
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'mutations required' })
    })
  })

  describe('auth endpoints', () => {
    it('rejects /api/v1/auth/me without authentication header', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/auth/me')
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body).toEqual({ ok: false, message: 'x-user-id header or dev token required' })
    })

    it('rejects /api/v1/auth/login without email', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'email required' })
    })
  })

  describe('report endpoints', () => {
    it('rejects /api/v1/reports/sales/summary without tenantId', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/reports/sales/summary')
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'tenantId required' })
    })
  })
})
