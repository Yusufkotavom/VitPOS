import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db, type AppDb } from '../../lib/db'
import { tenantMembers, tenants, users } from '../../../../../src/db/schema'

export const authRoutes = new Hono()

type AuthUser = typeof users.$inferSelect

function readUserId(request: Request) {
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
