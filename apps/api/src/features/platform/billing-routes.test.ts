import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'

const { dbMock, makeChain } = vi.hoisted(() => {
  const makeChain = (initial: unknown[] = []) => {
    const chain = Object.assign(Promise.resolve(initial), {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      returning: vi.fn(),
      values: vi.fn(),
      set: vi.fn(),
    }) as Promise<unknown[]> & Record<string, ReturnType<typeof vi.fn>>
    for (const key of ['from', 'where', 'orderBy', 'returning', 'values', 'set']) {
      chain[key].mockReturnValue(chain)
    }
    return chain
  }

  return {
    makeChain,
    dbMock: {
      select: vi.fn(() => makeChain([])),
      insert: vi.fn(() => makeChain([])),
      update: vi.fn(() => makeChain([])),
    },
  }
})

vi.mock('../../lib/db.js', () => ({ db: dbMock }))
vi.mock('./audit.js', () => ({ writeAuditLog: vi.fn() }))

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

describe('platform billing API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists submitted payments for platform admin', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 'admin-id', role: 'platform_admin' }]))
      .mockReturnValueOnce(makeChain([{ id: 'payment-id', status: 'submitted' }]))

    const response = await buildApp().request('/api/v1/platform/billing/payments', {
      headers: { 'x-user-id': 'admin-id' },
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items[0].status).toBe('submitted')
  })

  it('approves payment and applies tenant subscription', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 'admin-id', role: 'platform_admin' }]))
      .mockReturnValueOnce(makeChain([{ id: 'payment-id', tenantId: 'tenant-id', invoiceId: 'invoice-id' }]))
      .mockReturnValueOnce(makeChain([{ id: 'invoice-id', planCode: 'pro', billingPeriod: 'monthly' }]))
      .mockReturnValueOnce(makeChain([{ code: 'pro', durationDays: 30, storageLimitMb: 2048, maxBranches: 3 }]))
      .mockReturnValueOnce(makeChain([{ id: 'tenant-id', planValidUntil: null }]))
    dbMock.update
      .mockReturnValueOnce(makeChain([{ id: 'payment-id', status: 'approved' }]))
      .mockReturnValueOnce(makeChain([{ id: 'invoice-id', status: 'paid' }]))
      .mockReturnValueOnce(makeChain([{ id: 'tenant-id', subscriptionStatus: 'active' }]))
      .mockReturnValueOnce(makeChain([{ id: 'request-id', status: 'applied' }]))

    const response = await buildApp().request('/api/v1/platform/billing/payments/payment-id/approve', {
      method: 'PATCH',
      headers: { 'x-user-id': 'admin-id' },
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.item.payment.status).toBe('approved')
    expect(body.item.tenant.subscriptionStatus).toBe('active')
  })

  it('rejects payment with review note', async () => {
    dbMock.select.mockReturnValueOnce(makeChain([{ id: 'admin-id', role: 'platform_admin' }]))
    dbMock.update
      .mockReturnValueOnce(makeChain([{ id: 'payment-id', tenantId: 'tenant-id', invoiceId: 'invoice-id', status: 'rejected' }]))
      .mockReturnValueOnce(makeChain([{ id: 'invoice-id', status: 'pending_payment' }]))

    const response = await buildApp().request('/api/v1/platform/billing/payments/payment-id/reject', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-id' },
      body: JSON.stringify({ reviewNote: 'Nominal tidak cocok.' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.item.status).toBe('rejected')
  })

  it('updates billing settings', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ id: 'admin-id', role: 'platform_admin' }]))
      .mockReturnValueOnce(makeChain([{ id: 'settings-id' }]))
    dbMock.update.mockReturnValueOnce(makeChain([{ id: 'settings-id', supportWhatsapp: '6281234567890' }]))

    const response = await buildApp().request('/api/v1/platform/billing/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'admin-id' },
      body: JSON.stringify({ supportWhatsapp: '6281234567890', paymentInstructions: 'Transfer ke BCA', bankAccounts: [] }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.item.supportWhatsapp).toBe('6281234567890')
  })
})
