import { config } from 'dotenv'
import { afterEach, describe, expect, it, vi } from 'vitest'

config({ path: '.env.local' })
config()

import { createApp } from './app'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

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
      const response = await app.request('/api/v1/sync/pull', {
        headers: { 'x-user-id': 'test-user' },
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'tenantId required' })
    })

    it('rejects /api/v1/sync/pull when branchId invalid', async () => {
      const app = createApp()
      const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
      const response = await app.request(`/api/v1/sync/pull?tenantId=${validTenantId}&branchId=not-a-uuid`, {
        headers: { 'x-user-id': 'test-user' },
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'branchId invalid' })
    })

    it('rejects /api/v1/sync/push when body is empty', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user' },
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
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user' },
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

    it('returns service order items and timeline in pull payload after sync push', async () => {
      const app = createApp()
      const tenantId = 'bc84f249-78f6-4b62-a9a9-b5f84ca98c11'
      const branchId = 'eda41760-b27e-4eeb-a625-814719c58c6c'
      const serviceOrderId = crypto.randomUUID()
      const customerId = '881d6bfd-4c1e-4201-aef3-d40c15a2b92b'

      const pushResponse = await app.request('/api/v1/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user' },
        body: JSON.stringify({
          tenantId,
          branchId,
          deviceId: 'test-device',
          mutations: [
            {
              clientMutationId: crypto.randomUUID(),
              entityType: 'service_order',
              entityId: serviceOrderId,
              mutationType: 'create',
              payload: {
                id: serviceOrderId,
                code: 'SRV-TDD-0001',
                customerId,
                customerName: 'Yusuf Bahtiyar',
                description: 'Tes sync service order',
                date: '2026-06-12T00:00:00.000Z',
                cost: 12345,
                paidTotal: 12345,
                status: 'Diterima',
                items: [
                  { id: crypto.randomUUID(), productId: '384ba7fe-7061-4cd7-9c56-e0aea9580615', name: 'Jasa Bongkar', qty: 1, price: 12345, subtotal: 12345 },
                ],
                timeline: [
                  { id: crypto.randomUUID(), status: 'Diterima', date: '2026-06-12T00:00:00.000Z', note: 'Service order dibuat' },
                ],
              },
            },
          ],
        }),
      })

      expect(pushResponse.status).toBe(200)

      const pullResponse = await app.request(`/api/v1/sync/pull?tenantId=${tenantId}&branchId=${branchId}`, {
        headers: { 'x-user-id': 'test-user' },
      })
      const pullBody = await pullResponse.json() as { items?: Array<{ entityType: string; entityId: string; payload: { items?: unknown[]; timeline?: unknown[] } }>; message?: string }

      expect(pullResponse.status).toBe(200)
      expect(pullBody).not.toEqual(expect.objectContaining({ ok: false }))
      expect(pullBody.items).toBeDefined()
      const serviceOrder = pullBody.items?.find((item) => item.entityType === 'service_order' && item.entityId === serviceOrderId)
      expect(serviceOrder?.payload.items).toEqual([
        expect.objectContaining({ name: 'Jasa Bongkar', qty: 1, subtotal: 12345 }),
      ])
      expect(serviceOrder?.payload.timeline).toEqual([
        expect.objectContaining({ status: 'Diterima', note: 'Service order dibuat' }),
      ])
    }, 15000)
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
      expect(body).toEqual({ ok: false, message: 'email and password required' })
    })

    it('rejects /api/v1/auth/register without password', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Owner',
          email: 'owner@example.com',
          tenantName: 'Usaha Baru',
        }),
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'name, email, password, and tenantName required' })
    })

    it('rejects /api/v1/auth/login without password', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@example.com' }),
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'email and password required' })
    })

    it('rejects /api/v1/auth/reset-password without required fields', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@example.com' }),
      })
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'email and newPassword required' })
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

  describe('update endpoints', () => {
    it('returns 400 when update platform or version is missing', async () => {
      const app = createApp()
      const response = await app.request('/api/v1/updates/latest')
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ ok: false, message: 'platform and currentVersion required' })
    })

    it('returns signed desktop update payload for tauri updater route', async () => {
      global.fetch = vi.fn(async (input) => {
        const url = String(input)
        if (url.endsWith('.sig')) {
          return new Response('desktop-signature', { status: 200 })
        }

        return new Response(JSON.stringify({
          tag_name: 'v1.2.3',
          html_url: 'https://github.com/Yusufkotavom/VitPOS/releases/tag/v1.2.3',
          body: 'Desktop updater ready',
          published_at: '2026-06-10T00:00:00Z',
          assets: [
            {
              name: 'vitpos_1.2.3_x64-setup.exe',
              browser_download_url: 'https://example.com/vitpos_1.2.3_x64-setup.exe',
            },
            {
              name: 'vitpos_1.2.3_x64-setup.exe.sig',
              browser_download_url: 'https://example.com/vitpos_1.2.3_x64-setup.exe.sig',
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }) as typeof fetch

      const app = createApp()
      const response = await app.request('/api/v1/updates/desktop/windows/x86_64/1.0.0')
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({
        version: '1.2.3',
        notes: 'Desktop updater ready',
        pub_date: '2026-06-10T00:00:00Z',
        url: 'https://example.com/vitpos_1.2.3_x64-setup.exe',
        signature: 'desktop-signature',
      })
    })

    it('returns unified android update metadata when a newer apk release exists', async () => {
      global.fetch = vi.fn(async (input) => {
        const url = String(input)
        if (url.endsWith('.sha256')) {
          return new Response('apk-checksum', { status: 200 })
        }

        return new Response(JSON.stringify({
          tag_name: 'v1.2.3',
          html_url: 'https://github.com/Yusufkotavom/VitPOS/releases/tag/v1.2.3',
          body: 'Android release ready',
          published_at: '2026-06-10T00:00:00Z',
          assets: [
            {
              name: 'app-release.apk',
              browser_download_url: 'https://example.com/app-release.apk',
            },
            {
              name: 'app-release.apk.sha256',
              browser_download_url: 'https://example.com/app-release.apk.sha256',
            },
          ],
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }) as typeof fetch

      const app = createApp()
      const response = await app.request('/api/v1/updates/latest?platform=android-apk&currentVersion=1.0.0')
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({
        ok: true,
        available: true,
        version: '1.2.3',
        notes: 'Android release ready',
        publishedAt: '2026-06-10T00:00:00Z',
        releaseUrl: 'https://github.com/Yusufkotavom/VitPOS/releases/tag/v1.2.3',
        webUrl: 'https://vit-pos-8vle.vercel.app',
        apkUrl: 'https://example.com/app-release.apk',
        checksum: 'apk-checksum',
        preferredChannel: 'apk',
        preferredUrl: 'https://example.com/app-release.apk',
      })
    })
  })
})
