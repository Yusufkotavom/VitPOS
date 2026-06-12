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
vi.mock('../platform/audit.js', () => ({ writeAuditLog: vi.fn() }))

import { subscriptionRoutes } from './routes'

function buildApp() {
  const app = new Hono<{ Variables: { userId: string } }>()
  app.route('/api/v1/subscription', subscriptionRoutes)
  return app
}

describe('tenant subscription billing API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns billing settings for authenticated tenant user', async () => {
    dbMock.select.mockReturnValueOnce(
      makeChain([{ id: 'settings-id', supportWhatsapp: '6281234567890', paymentInstructions: 'Transfer ke rekening resmi.' }]),
    )

    const response = await buildApp().request('/api/v1/subscription/billing-settings', {
      headers: { 'x-user-id': 'user-id' },
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.item.supportWhatsapp).toBe('6281234567890')
  })

  it('creates renewal invoice instead of activating paid plan immediately', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ role: 'owner' }]))
      .mockReturnValueOnce(makeChain([{ code: 'pro', monthlyPrice: '99000', yearlyPrice: null, durationDays: 30, isActive: true }]))
    dbMock.insert.mockReturnValueOnce(makeChain([{ id: 'invoice-id', tenantId: 'tenant-id', status: 'pending_payment', planCode: 'pro' }]))

    const response = await buildApp().request('/api/v1/subscription/tenants/tenant-id/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-id' },
      body: JSON.stringify({ type: 'renewal', planCode: 'pro', billingPeriod: 'monthly' }),
    })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.item.status).toBe('pending_payment')
    expect(dbMock.update).toHaveBeenCalled()
  })

  it('submits manual transfer payment proof and marks invoice submitted', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ role: 'owner' }]))
      .mockReturnValueOnce(makeChain([{ id: 'invoice-id', tenantId: 'tenant-id', status: 'pending_payment' }]))
    dbMock.insert.mockReturnValueOnce(makeChain([{ id: 'payment-id', invoiceId: 'invoice-id', status: 'submitted' }]))

    const response = await buildApp().request('/api/v1/subscription/tenants/tenant-id/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-id' },
      body: JSON.stringify({ invoiceId: '550e8400-e29b-41d4-a716-446655440000', amount: '99000', proofText: 'Sudah transfer via BCA.' }),
    })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.item.status).toBe('submitted')
    expect(dbMock.update).toHaveBeenCalled()
  })

  it('creates scheduled downgrade request without payment', async () => {
    dbMock.select
      .mockReturnValueOnce(makeChain([{ role: 'owner' }]))
      .mockReturnValueOnce(makeChain([{ id: 'tenant-id', planCode: 'pro', planValidUntil: new Date('2026-07-01') }]))
      .mockReturnValueOnce(makeChain([{ code: 'starter', monthlyPrice: '49000', yearlyPrice: null, durationDays: 30, isActive: true }]))
    dbMock.insert.mockReturnValueOnce(makeChain([{ id: 'request-id', changeType: 'downgrade', status: 'scheduled' }]))

    const response = await buildApp().request('/api/v1/subscription/tenants/tenant-id/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-id' },
      body: JSON.stringify({ toPlanCode: 'starter', changeType: 'downgrade', billingPeriod: 'monthly' }),
    })
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.item.status).toBe('scheduled')
  })
})
