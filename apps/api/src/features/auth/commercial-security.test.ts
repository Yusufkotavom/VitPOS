import { config } from 'dotenv'
import { describe, expect, it } from 'vitest'

config({ path: '.env.local' })
config()

import { createApp } from '../../app.js'
import { createAccessToken } from './routes.js'
import { db } from '../../lib/db.js'
import { branches, tenants, users, tenantMembers } from '../../../../../src/db/schema/index.js'

describe('Commercial Security & Multi-tenant Gating', () => {
  const app = createApp()

  it('signs and verifies real JWT tokens', async () => {
    const id = crypto.randomUUID()
    const fakeUser = {
      id,
      email: `sec-${id}@kotacom.id`,
      role: 'user',
    }

    const token = await createAccessToken(fakeUser)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    // Seed test user so /auth/me can resolve
    const now = new Date()
    await db.insert(users).values({
      id: fakeUser.id,
      email: fakeUser.email,
      name: 'Security Test',
      passwordHash: 'dummy',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    })

    const res = await app.request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.user.email).toBe(fakeUser.email)
  })

  it('rejects forged JWT tokens with 401', async () => {
    const res = await app.request('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer forged.token.signature' },
    })
    expect(res.status).toBe(401)
  })

  it('enforces branch limits according to tenant maxBranches', async () => {
    const tenantId = crypto.randomUUID()
    const userId = crypto.randomUUID()
    const now = new Date()

    await db.insert(users).values({
      id: userId,
      email: `limit-${userId}@test.id`,
      name: 'Branch Limit Test User',
      passwordHash: 'hash',
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(tenants).values({
      id: tenantId,
      name: 'Branch Limit Tenant',
      planCode: 'starter-monthly',
      maxBranches: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(tenantMembers).values({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      role: 'owner',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(branches).values({
      id: crypto.randomUUID(),
      tenantId,
      name: 'Cabang Utama',
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const token = await createAccessToken({ id: userId, email: `limit-${userId}@test.id` })

    // Trying to create a second branch when maxBranches = 1 must be rejected
    const branchRes = await app.request(`/api/v1/tenants/${tenantId}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Cabang Kedua' }),
    })

    expect(branchRes.status).toBe(403)
    const branchBody = await branchRes.json()
    expect(branchBody.ok).toBe(false)
    expect(branchBody.code).toBe('PLAN_LIMIT_REACHED')
  })

  it('blocks sync push when tenant subscription is suspended (402)', async () => {
    const tenantId = crypto.randomUUID()
    const userId = crypto.randomUUID()
    const now = new Date()

    await db.insert(users).values({
      id: userId,
      email: `suspended-${userId}@test.id`,
      name: 'Suspended Test User',
      passwordHash: 'hash',
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(tenants).values({
      id: tenantId,
      name: 'Suspended Tenant',
      planCode: 'starter-monthly',
      subscriptionStatus: 'suspended',
      maxBranches: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(tenantMembers).values({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      role: 'owner',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    const token = await createAccessToken({ id: userId, email: `suspended-${userId}@test.id` })

    const pushRes = await app.request('/api/v1/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenantId,
        deviceId: 'dev-1',
        mutations: [
          {
            clientMutationId: crypto.randomUUID(),
            entityType: 'customer',
            entityId: crypto.randomUUID(),
            mutationType: 'create',
            payload: { name: 'Budi' },
          },
        ],
      }),
    })

    expect(pushRes.status).toBe(402)
    const pushBody = await pushRes.json()
    expect(pushBody.ok).toBe(false)
    expect(pushBody.code).toBe('SUBSCRIPTION_EXPIRED')
  })
})
