import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'

const { dbMock } = vi.hoisted(() => {
  const makeChain = (initial: unknown[] = []) => {
    const chain = Object.assign(Promise.resolve(initial), {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      offset: vi.fn(),
      leftJoin: vi.fn(),
      groupBy: vi.fn(),
      returning: vi.fn(),
      values: vi.fn(),
      set: vi.fn(),
    }) as Promise<unknown[]> & Record<string, ReturnType<typeof vi.fn>>
    for (const key of ['from', 'where', 'orderBy', 'limit', 'offset', 'leftJoin', 'groupBy', 'returning', 'values', 'set']) {
      chain[key].mockReturnValue(chain)
    }
    return chain
  }

  return {
    dbMock: {
      select: vi.fn(() => makeChain([])),
      insert: vi.fn(() => makeChain([])),
      update: vi.fn(() => makeChain([])),
    },
  }
})

vi.mock('../../lib/db.js', () => ({ db: dbMock }))

import { platformRoutes } from './routes'

function buildApp() {
  const app = new Hono<{ Variables: { userId: string } }>()

  app.use('*', async (c, next) => {
    const userId = c.req.header('x-user-id')
    if (!userId) return c.json({ ok: false, message: 'Authentication required' }, 401)
    c.set('userId', userId)
    await next()
  })

  app.route('/api/v1/platform', platformRoutes)
  return app
}

describe('platform routes guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no x-user-id header', async () => {
    const app = buildApp()
    const response = await app.request('/api/v1/platform/tenants')
    expect(response.status).toBe(401)
  })

  it('returns 403 when user is not platform_admin', async () => {
    dbMock.select.mockReturnValueOnce(
      Object.assign(Promise.resolve([{ id: 'regular-user-id', role: 'user' }]), {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      })
    )
    const app = buildApp()
    const response = await app.request('/api/v1/platform/tenants', {
      headers: { 'x-user-id': 'regular-user-id' },
    })
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.message).toBe('Platform admin only')
  })

  it('allows platform_admin to list tenants', async () => {
    // 1st select: middleware user lookup
    dbMock.select.mockReturnValueOnce(
      Object.assign(Promise.resolve([{ id: 'admin-id', role: 'platform_admin' }]), {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      })
    )
    // 2nd select: /tenants handler
    dbMock.select.mockReturnValueOnce(
      Object.assign(Promise.resolve([]), {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      })
    )

    const app = buildApp()
    const response = await app.request('/api/v1/platform/tenants', {
      headers: { 'x-user-id': 'admin-id' },
    })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.items)).toBe(true)
  })
})
