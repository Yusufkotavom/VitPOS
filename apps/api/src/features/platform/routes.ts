import { count, desc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { authMiddleware } from '../auth/middleware.js'
import { platformAdminMiddleware } from './middleware.js'
import { platformBillingRoutes } from './billing-routes.js'
import { writeAuditLog } from './audit.js'
import { db } from '../../lib/db.js'
import {
  platformAuditLogs,
  subscriptionPlans,
  tenantMembers,
  tenants,
  users,
} from '../../../../../src/db/schema/index.js'

type PlatformEnv = {
  Variables: {
    userId: string
    platformAdminId: string
  }
}

export const platformRoutes = new Hono<PlatformEnv>()

platformRoutes.use('*', authMiddleware, platformAdminMiddleware)
platformRoutes.route('/', platformBillingRoutes)

// ---------- /tenants ----------

platformRoutes.get('/tenants', async (c) => {
  const result = await db
    .select({
      id: tenants.id,
      tenantName: tenants.name,
      ownerName: users.name,
      ownerEmail: users.email,
      city: tenants.address,
      packageName: tenants.planCode,
      subscriptionStatus: tenants.subscriptionStatus,
      planValidUntil: tenants.planValidUntil,
      storageLimitGb: sql<number>`${tenants.storageLimitMb} / 1024.0`,
      maxBranches: tenants.maxBranches,
      isActive: tenants.isActive,
    })
    .from(tenants)
    .leftJoin(tenantMembers, eq(tenants.id, tenantMembers.tenantId))
    .leftJoin(users, eq(tenantMembers.userId, users.id))
    .where(eq(tenantMembers.role, 'owner'))

  return c.json({ ok: true, items: result })
})

platformRoutes.get('/tenants/:id', async (c) => {
  const id = c.req.param('id')
  const tenant = await db.select().from(tenants).where(eq(tenants.id, id)).then((r) => r[0])
  if (!tenant) return c.json({ ok: false, message: 'Tenant not found' }, 404)

  const members = await db
    .select({
      id: tenantMembers.id,
      userId: tenantMembers.userId,
      role: tenantMembers.role,
      isActive: tenantMembers.isActive,
      name: users.name,
      email: users.email,
    })
    .from(tenantMembers)
    .leftJoin(users, eq(tenantMembers.userId, users.id))
    .where(eq(tenantMembers.tenantId, id))

  return c.json({ ok: true, item: tenant, members })
})

const updateTenantSchema = z.object({
  planCode: z.string().min(1).max(40).optional(),
  billingPeriod: z.enum(['monthly', 'yearly']).optional(),
  planValidUntil: z.string().datetime().nullable().optional(),
  storageLimitMb: z.number().int().min(0).optional(),
  maxBranches: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  subscriptionStatus: z
    .enum(['trial', 'active', 'past_due', 'suspended', 'cancelled'])
    .optional(),
})

platformRoutes.patch('/tenants/:id', async (c) => {
  const id = c.req.param('id')
  const body = updateTenantSchema.parse(await c.req.json())
  const actorId = c.get('platformAdminId')

  const dbSet: Record<string, unknown> = { updatedAt: new Date() }
  if (body.planCode !== undefined) dbSet.planCode = body.planCode
  if (body.billingPeriod !== undefined) dbSet.billingPeriod = body.billingPeriod
  if (body.storageLimitMb !== undefined) dbSet.storageLimitMb = body.storageLimitMb
  if (body.maxBranches !== undefined) dbSet.maxBranches = body.maxBranches
  if (body.isActive !== undefined) dbSet.isActive = body.isActive
  if (body.subscriptionStatus !== undefined) dbSet.subscriptionStatus = body.subscriptionStatus
  if (body.planValidUntil !== undefined) {
    dbSet.planValidUntil = body.planValidUntil === null ? null : new Date(body.planValidUntil)
  }

  const updated = await db
    .update(tenants)
    .set(dbSet)
    .where(eq(tenants.id, id))
    .returning()

  if (updated.length === 0) return c.json({ ok: false, message: 'Tenant not found' }, 404)

  await writeAuditLog({
    actorId,
    action: 'tenant.updated',
    targetType: 'tenant',
    targetId: id,
    payload: body as Record<string, unknown>,
  })

  return c.json({ ok: true, item: updated[0] })
})

platformRoutes.post('/tenants/:id/suspend', async (c) => {
  const id = c.req.param('id')
  const actorId = c.get('platformAdminId')
  await db
    .update(tenants)
    .set({ isActive: false, subscriptionStatus: 'suspended', updatedAt: new Date() })
    .where(eq(tenants.id, id))

  await writeAuditLog({ actorId, action: 'tenant.suspended', targetType: 'tenant', targetId: id })
  return c.json({ ok: true })
})

platformRoutes.post('/tenants/:id/reactivate', async (c) => {
  const id = c.req.param('id')
  const actorId = c.get('platformAdminId')
  await db
    .update(tenants)
    .set({ isActive: true, subscriptionStatus: 'active', updatedAt: new Date() })
    .where(eq(tenants.id, id))

  await writeAuditLog({ actorId, action: 'tenant.reactivated', targetType: 'tenant', targetId: id })
  return c.json({ ok: true })
})

// ---------- /plans ----------

platformRoutes.get('/plans', async (c) => {
  const includeInactive = c.req.query('includeInactive') === 'true'
  const condition = includeInactive ? undefined : eq(subscriptionPlans.isActive, true)
  const items = await db
    .select()
    .from(subscriptionPlans)
    .where(condition)
    .orderBy(subscriptionPlans.monthlyPrice)
  return c.json({ ok: true, items })
})

const planSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  billingPeriod: z.enum(['monthly', 'yearly']).optional(),
  durationDays: z.number().int().min(1).optional(),
  trialDays: z.number().int().min(0).optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0).nullable().optional(),
  storageLimitMb: z.number().int().min(0),
  maxBranches: z.number().int().min(1),
  maxUsers: z.number().int().min(1),
  features: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

platformRoutes.post('/plans', async (c) => {
  const body = planSchema.parse(await c.req.json())
  const actorId = c.get('platformAdminId')

  const inserted = await db
    .insert(subscriptionPlans)
    .values({
      code: body.code,
      name: body.name,
      billingPeriod: body.billingPeriod ?? 'monthly',
      durationDays: body.durationDays ?? 30,
      trialDays: body.trialDays ?? 0,
      monthlyPrice: String(body.monthlyPrice),
      yearlyPrice: body.yearlyPrice === null || body.yearlyPrice === undefined ? null : String(body.yearlyPrice),
      storageLimitMb: body.storageLimitMb,
      maxBranches: body.maxBranches,
      maxUsers: body.maxUsers,
      features: body.features ?? {},
      isActive: body.isActive ?? true,
      updatedAt: new Date(),
    })
    .returning()

  await writeAuditLog({
    actorId,
    action: 'plan.created',
    targetType: 'plan',
    targetId: inserted[0].id,
    payload: body as Record<string, unknown>,
  })

  return c.json({ ok: true, item: inserted[0] })
})

const planUpdateSchema = planSchema.partial()

platformRoutes.patch('/plans/:id', async (c) => {
  const id = c.req.param('id')
  const body = planUpdateSchema.parse(await c.req.json())
  const actorId = c.get('platformAdminId')

  const dbSet: Record<string, unknown> = { updatedAt: new Date() }
  if (body.code !== undefined) dbSet.code = body.code
  if (body.name !== undefined) dbSet.name = body.name
  if (body.billingPeriod !== undefined) dbSet.billingPeriod = body.billingPeriod
  if (body.durationDays !== undefined) dbSet.durationDays = body.durationDays
  if (body.trialDays !== undefined) dbSet.trialDays = body.trialDays
  if (body.monthlyPrice !== undefined) dbSet.monthlyPrice = String(body.monthlyPrice)
  if (body.yearlyPrice !== undefined) {
    dbSet.yearlyPrice = body.yearlyPrice === null ? null : String(body.yearlyPrice)
  }
  if (body.storageLimitMb !== undefined) dbSet.storageLimitMb = body.storageLimitMb
  if (body.maxBranches !== undefined) dbSet.maxBranches = body.maxBranches
  if (body.maxUsers !== undefined) dbSet.maxUsers = body.maxUsers
  if (body.features !== undefined) dbSet.features = body.features
  if (body.isActive !== undefined) dbSet.isActive = body.isActive

  const updated = await db
    .update(subscriptionPlans)
    .set(dbSet)
    .where(eq(subscriptionPlans.id, id))
    .returning()

  if (updated.length === 0) return c.json({ ok: false, message: 'Plan not found' }, 404)

  await writeAuditLog({
    actorId,
    action: 'plan.updated',
    targetType: 'plan',
    targetId: id,
    payload: body as Record<string, unknown>,
  })

  return c.json({ ok: true, item: updated[0] })
})

platformRoutes.delete('/plans/:id', async (c) => {
  const id = c.req.param('id')
  const actorId = c.get('platformAdminId')

  const updated = await db
    .update(subscriptionPlans)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, id))
    .returning()

  if (updated.length === 0) return c.json({ ok: false, message: 'Plan not found' }, 404)

  await writeAuditLog({ actorId, action: 'plan.deleted', targetType: 'plan', targetId: id })
  return c.json({ ok: true })
})

// ---------- /users ----------

platformRoutes.get('/users', async (c) => {
  const items = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      membershipCount: count(tenantMembers.id),
    })
    .from(users)
    .leftJoin(tenantMembers, eq(users.id, tenantMembers.userId))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
  return c.json({ ok: true, items })
})

platformRoutes.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.select().from(users).where(eq(users.id, id)).then((r) => r[0])
  if (!user) return c.json({ ok: false, message: 'User not found' }, 404)

  const memberships = await db
    .select({
      id: tenantMembers.id,
      tenantId: tenantMembers.tenantId,
      role: tenantMembers.role,
      isActive: tenantMembers.isActive,
      tenantName: tenants.name,
    })
    .from(tenantMembers)
    .leftJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(eq(tenantMembers.userId, id))

  return c.json({ ok: true, item: user, memberships })
})

const updateUserSchema = z.object({
  role: z.enum(['user', 'platform_admin']).optional(),
})

platformRoutes.patch('/users/:id', async (c) => {
  const id = c.req.param('id')
  const body = updateUserSchema.parse(await c.req.json())
  const actorId = c.get('platformAdminId')

  if (id === actorId && body.role && body.role !== 'platform_admin') {
    return c.json({ ok: false, message: 'Cannot demote yourself' }, 400)
  }

  const updated = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()

  if (updated.length === 0) return c.json({ ok: false, message: 'User not found' }, 404)

  await writeAuditLog({
    actorId,
    action: 'user.role_changed',
    targetType: 'user',
    targetId: id,
    payload: body as Record<string, unknown>,
  })

  return c.json({ ok: true, item: updated[0] })
})

const updateMembershipSchema = z.object({
  role: z.enum(['owner', 'admin', 'cashier', 'staff']),
})

platformRoutes.patch('/users/:id/memberships/:memberId', async (c) => {
  const memberId = c.req.param('memberId')
  const body = updateMembershipSchema.parse(await c.req.json())
  const actorId = c.get('platformAdminId')

  const updated = await db
    .update(tenantMembers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(tenantMembers.id, memberId))
    .returning()

  if (updated.length === 0) return c.json({ ok: false, message: 'Membership not found' }, 404)

  await writeAuditLog({
    actorId,
    action: 'membership.role_changed',
    targetType: 'membership',
    targetId: memberId,
    payload: { userId: c.req.param('id'), ...body } as Record<string, unknown>,
  })

  return c.json({ ok: true, item: updated[0] })
})

// ---------- /audit ----------

platformRoutes.get('/audit', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)
  const offset = Number(c.req.query('offset') ?? 0)

  const items = await db
    .select({
      id: platformAuditLogs.id,
      actorId: platformAuditLogs.actorId,
      actorName: users.name,
      action: platformAuditLogs.action,
      targetType: platformAuditLogs.targetType,
      targetId: platformAuditLogs.targetId,
      payload: platformAuditLogs.payload,
      createdAt: platformAuditLogs.createdAt,
    })
    .from(platformAuditLogs)
    .leftJoin(users, eq(platformAuditLogs.actorId, users.id))
    .orderBy(desc(platformAuditLogs.createdAt))
    .limit(limit)
    .offset(offset)

  const total = await db.select({ c: count() }).from(platformAuditLogs).then((r) => r[0].c)

  return c.json({ ok: true, items, total })
})
