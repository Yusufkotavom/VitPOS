import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db'
import { tenantMembers, tenants, users } from '../../../../../src/db/schema'

export const authRoutes = new Hono()

function readUserId(request: Request) {
  return request.headers.get('x-user-id')
}

authRoutes.get('/me', async (c) => {
  const userId = readUserId(c.req.raw)

  if (!userId) {
    return c.json({ ok: false, message: 'x-user-id header required' }, 401)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return c.json({ ok: false, message: 'User not found' }, 404)
  }

  return c.json({ ok: true, user })
})

authRoutes.get('/tenants', async (c) => {
  const userId = readUserId(c.req.raw)

  if (!userId) {
    return c.json({ ok: false, message: 'x-user-id header required' }, 401)
  }

  const memberships = await db
    .select({
      tenantId: tenantMembers.tenantId,
      role: tenantMembers.role,
      tenantName: tenants.name,
      tenantPlan: tenants.planCode,
    })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true), eq(tenants.isActive, true)))

  return c.json({ ok: true, items: memberships })
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()

  if (!email) {
    return c.json({ ok: false, message: 'email required' }, 400)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    return c.json({ ok: false, message: 'User not found' }, 404)
  }

  return c.json({
    ok: true,
    accessToken: `dev-${user.id}`,
    user,
  })
})
