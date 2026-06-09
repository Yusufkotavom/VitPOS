import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db, type AppDb } from '../../lib/db.js'
import { branches, tenantMembers, tenants, users, warehouses } from '../../../../../src/db/schema/index.js'

export const authRoutes = new Hono()

type AuthUser = typeof users.$inferSelect

export function readUserId(request: Request) {
  const userId = request.headers.get('x-user-id')
  const authorization = request.headers.get('authorization')

  if (userId) return userId
  if (authorization?.startsWith('Bearer dev-')) return authorization.slice('Bearer dev-'.length)
  return null
}

async function findUserById(appDb: AppDb, userId: string) {
  return appDb.query.users.findFirst({
    where: eq(users.id, userId),
  })
}

async function findUserByEmail(appDb: AppDb, email: string) {
  return appDb.query.users.findFirst({
    where: eq(users.email, email),
  })
}

async function listActiveMemberships(appDb: AppDb, userId: string) {
  return appDb
    .select({
      tenantId: tenantMembers.tenantId,
      role: tenantMembers.role,
      tenantName: tenants.name,
      tenantPlan: tenants.planCode,
    })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true), eq(tenants.isActive, true)))
}

function userResponse(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  }
}

authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null) as { name?: string; email?: string; password?: string; tenantName?: string } | null

  const name = body?.name?.trim()
  const email = body?.email?.trim().toLowerCase()
  const tenantName = body?.tenantName?.trim()

  if (!name || !email || !tenantName) {
    return c.json({ ok: false, message: 'name, email, and tenantName required' }, 400)
  }

  const existingUser = await findUserByEmail(db, email)
  if (existingUser) {
    return c.json({ ok: false, message: 'Email already registered' }, 409)
  }

  const userId = crypto.randomUUID()
  const tenantId = crypto.randomUUID()
  const branchId = crypto.randomUUID()
  const warehouseId = crypto.randomUUID()
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email,
      name,
      createdAt: now,
      updatedAt: now,
    })

    const planValidUntil = new Date(now)
    planValidUntil.setDate(planValidUntil.getDate() + 14)

    await tx.insert(tenants).values({
      id: tenantId,
      name: tenantName,
      planCode: 'trial',
      subscriptionStatus: 'trial',
      planValidUntil,
      storageLimitMb: 1024,
      maxBranches: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await tx.insert(branches).values({
      id: branchId,
      tenantId,
      name: 'Cabang Utama',
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await tx.insert(warehouses).values({
      id: warehouseId,
      tenantId,
      branchId,
      name: 'Gudang Utama',
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await tx.insert(tenantMembers).values({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      role: 'owner',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  })

  const memberships = await listActiveMemberships(db, userId)

  return c.json({
    ok: true,
    accessToken: `dev-${userId}`,
    user: { id: userId, email, name },
    memberships,
  })
})

authRoutes.get('/me', async (c) => {
  const userId = readUserId(c.req.raw)

  if (!userId) {
    return c.json({ ok: false, message: 'x-user-id header or dev token required' }, 401)
  }

  const user = await findUserById(db, userId)

  if (!user) {
    return c.json({ ok: false, message: 'User not found' }, 404)
  }

  const memberships = await listActiveMemberships(db, user.id)

  return c.json({ ok: true, user: userResponse(user), memberships })
})

authRoutes.get('/tenants', async (c) => {
  const userId = readUserId(c.req.raw)

  if (!userId) {
    return c.json({ ok: false, message: 'x-user-id header or dev token required' }, 401)
  }

  const user = await findUserById(db, userId)

  if (!user) {
    return c.json({ ok: false, message: 'User not found' }, 404)
  }

  const memberships = await listActiveMemberships(db, user.id)

  return c.json({ ok: true, items: memberships })
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()

  if (!email) {
    return c.json({ ok: false, message: 'email required' }, 400)
  }

  const user = await findUserByEmail(db, email)

  if (!user) {
    return c.json({ ok: false, message: 'User not found' }, 404)
  }

  const memberships = await listActiveMemberships(db, user.id)

  if (memberships.length === 0) {
    return c.json({ ok: false, message: 'Active tenant membership required' }, 403)
  }

  return c.json({
    ok: true,
    accessToken: `dev-${user.id}`,
    user: userResponse(user),
    memberships,
  })
})
