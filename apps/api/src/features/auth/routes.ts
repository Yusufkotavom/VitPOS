import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'

import { db, type AppDb } from '../../lib/db.js'
import { getApiEnv } from '../../lib/env.js'
import { branches, subscriptionPlans, tenantMembers, tenants, users, warehouses } from '../../../../../src/db/schema/index.js'
import { hashPassword } from '../../../../../src/lib/crypto.js'

export const authRoutes = new Hono()

type AuthUser = typeof users.$inferSelect

export async function createAccessToken(user: { id: string; email: string; role?: string }): Promise<string> {
  const env = getApiEnv()
  return sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role ?? 'user',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    },
    env.jwtSecret,
    'HS256',
  )
}

export async function readUserId(request: Request): Promise<string | null> {
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim()
    if (token.startsWith('dev-')) {
      if (process.env.NODE_ENV !== 'production') {
        return token.slice('dev-'.length)
      }
      return null
    }

    try {
      const env = getApiEnv()
      const payload = (await verify(token, env.jwtSecret, 'HS256')) as { sub?: string }
      if (payload?.sub) return payload.sub
    } catch {
      return null
    }
  }

  // Fallback to x-user-id only in non-production
  if (process.env.NODE_ENV !== 'production') {
    const userId = request.headers.get('x-user-id')
    if (userId) return userId
  }

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
      tenantBillingPeriod: tenants.billingPeriod,
      tenantSubscriptionStatus: tenants.subscriptionStatus,
      tenantPlanValidUntil: tenants.planValidUntil,
      tenantStorageLimitMb: tenants.storageLimitMb,
      tenantMaxBranches: tenants.maxBranches,
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
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}

authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null) as {
    name?: string
    email?: string
    password?: string
    tenantName?: string
    planCode?: string
    billingPeriod?: 'monthly' | 'yearly'
  } | null

  const name = body?.name?.trim()
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password?.trim()
  const tenantName = body?.tenantName?.trim()
  const planCode = body?.planCode?.trim() || 'trial-monthly'
  const billingPeriod = body?.billingPeriod === 'yearly' ? 'yearly' : 'monthly'

  if (!name || !email || !password || !tenantName) {
    return c.json({ ok: false, message: 'name, email, password, and tenantName required' }, 400)
  }

  const existingUser = await findUserByEmail(db, email)
  if (existingUser) {
    return c.json({ ok: false, message: 'Email already registered' }, 409)
  }

  const planRows = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.code, planCode), eq(subscriptionPlans.isActive, true)))
  const plan = planRows[0]

  const now = new Date()
  let planValidUntil: Date | null = null
  let subscriptionStatus: 'trial' | 'active' | 'pending_payment' = 'trial'
  let storageLimitMb = 1024
  let maxBranches = 1

  if (plan) {
    storageLimitMb = plan.storageLimitMb
    maxBranches = plan.maxBranches
    if (plan.trialDays > 0) {
      subscriptionStatus = 'trial'
      planValidUntil = new Date(now)
      planValidUntil.setDate(planValidUntil.getDate() + plan.trialDays)
    } else if (plan.code.startsWith('free')) {
      subscriptionStatus = 'active'
      planValidUntil = null
    } else {
      subscriptionStatus = 'pending_payment'
      planValidUntil = new Date(now)
      planValidUntil.setDate(planValidUntil.getDate() + plan.durationDays)
    }
  } else {
    subscriptionStatus = 'trial'
    planValidUntil = new Date(now)
    planValidUntil.setDate(planValidUntil.getDate() + 14)
  }

  const userId = crypto.randomUUID()
  const tenantId = crypto.randomUUID()
  const branchId = crypto.randomUUID()
  const warehouseId = crypto.randomUUID()
  const passwordHash = await hashPassword(password)

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })

    await tx.insert(tenants).values({
      id: tenantId,
      name: tenantName,
      planCode,
      billingPeriod,
      subscriptionStatus,
      planValidUntil,
      storageLimitMb,
      maxBranches,
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
  const tokenUser = { id: userId, email, role: 'user' }
  const accessToken = await createAccessToken(tokenUser)

  return c.json({
    ok: true,
    accessToken,
    user: tokenUser,
    defaultBranchId: branchId,
    defaultWarehouseId: warehouseId,
    memberships,
  })
})

authRoutes.get('/me', async (c) => {
  const userId = await readUserId(c.req.raw)

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
  const userId = await readUserId(c.req.raw)

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
  const body = await c.req.json().catch(() => null) as { email?: string; password?: string } | null
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password?.trim()

  if (!email || !password) {
    return c.json({ ok: false, message: 'email and password required' }, 400)
  }

  const user = await findUserByEmail(db, email)

  if (!user) {
    return c.json({ ok: false, message: 'User not found' }, 404)
  }

  const passwordHash = await hashPassword(password)
  if (user.passwordHash !== passwordHash) {
    return c.json({ ok: false, message: 'Email tidak terdaftar atau kata sandi salah' }, 401)
  }

  const memberships = await listActiveMemberships(db, user.id)

  if (memberships.length === 0 && user.role !== 'platform_admin') {
    return c.json({ ok: false, message: 'Active tenant membership required' }, 403)
  }

  const accessToken = await createAccessToken(user)

  return c.json({
    ok: true,
    accessToken,
    user: userResponse(user),
    memberships,
  })
})

authRoutes.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => null) as { email?: string; newPassword?: string } | null
  const email = body?.email?.trim().toLowerCase()
  const newPassword = body?.newPassword?.trim()

  if (!email || !newPassword) {
    return c.json({ ok: false, message: 'email and newPassword required' }, 400)
  }

  const user = await findUserByEmail(db, email)
  if (!user) {
    return c.json({ ok: false, message: 'Email tidak ditemukan' }, 404)
  }

  await db.update(users).set({
    passwordHash: await hashPassword(newPassword),
    updatedAt: new Date(),
  }).where(eq(users.id, user.id))

  return c.json({ ok: true })
})
