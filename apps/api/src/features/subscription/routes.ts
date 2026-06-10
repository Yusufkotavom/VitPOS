import { and, eq } from '../../lib/drizzle.js'
import { Hono } from 'hono'
import { z } from 'zod'

import { authMiddleware } from '../auth/middleware.js'
import { writeAuditLog } from '../platform/audit.js'
import { db } from '../../lib/db.js'
import {
  subscriptionPlans,
  tenantMembers,
  tenants,
} from '../../../../../src/db/schema/index.js'

type Env = { Variables: { userId: string } }

export const subscriptionRoutes = new Hono<Env>()

subscriptionRoutes.use('*', authMiddleware)

subscriptionRoutes.get('/plans', async (c) => {
  const period = c.req.query('period')
  const conditions = [eq(subscriptionPlans.isActive, true)]
  if (period === 'monthly' || period === 'yearly') {
    conditions.push(eq(subscriptionPlans.billingPeriod, period))
  }

  const items = await db
    .select()
    .from(subscriptionPlans)
    .where(and(...conditions))
    .orderBy(subscriptionPlans.monthlyPrice)

  return c.json({ ok: true, items })
})

subscriptionRoutes.get('/plans/:code', async (c) => {
  const code = c.req.param('code')
  const rows = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.code, code), eq(subscriptionPlans.isActive, true)))
  if (rows.length === 0) return c.json({ ok: false, message: 'Plan not found' }, 404)
  return c.json({ ok: true, item: rows[0] })
})

const subscribeSchema = z.object({
  planCode: z.string().min(1).max(40),
  billingPeriod: z.enum(['monthly', 'yearly']).optional(),
})

async function requireTenantOwnerOrAdmin(userId: string, tenantId: string) {
  const rows = await db
    .select({ role: tenantMembers.role })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId), eq(tenantMembers.isActive, true)))
  const member = rows[0]
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { ok: false, message: 'Owner or admin only' } as const
  }
  return { ok: true, role: member.role } as const
}

subscriptionRoutes.post('/tenants/:tenantId/subscribe', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')
  const body = subscribeSchema.parse(await c.req.json())

  const planRows = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.code, body.planCode), eq(subscriptionPlans.isActive, true)))
  const plan = planRows[0]
  if (!plan) return c.json({ ok: false, message: 'Plan not found' }, 404)

  const billingPeriod = body.billingPeriod ?? plan.billingPeriod

  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, tenantId))
  if (tenantRows.length === 0) return c.json({ ok: false, message: 'Tenant not found' }, 404)

  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const now = new Date()
  const trialDays = plan.trialDays ?? 0

  const subscriptionStatus: 'trial' | 'active' = trialDays > 0 ? 'trial' : 'active'
  const planValidUntil = trialDays > 0
    ? (() => {
        const date = new Date(now)
        date.setDate(date.getDate() + trialDays)
        return date
      })()
    : plan.code.startsWith('free')
      ? null
      : (() => {
          const date = new Date(now)
          date.setDate(date.getDate() + plan.durationDays)
          return date
        })()

  const [updated] = await db
    .update(tenants)
    .set({
      planCode: plan.code,
      billingPeriod,
      subscriptionStatus,
      planValidUntil,
      storageLimitMb: plan.storageLimitMb,
      maxBranches: plan.maxBranches,
      isActive: true,
      updatedAt: now,
    })
    .where(eq(tenants.id, tenantId))
    .returning()

  await writeAuditLog({
    actorId: userId,
    action: 'tenant.subscribed',
    targetType: 'subscription',
    targetId: tenantId,
    payload: { planCode: plan.code, billingPeriod, subscriptionStatus },
  })

  return c.json({ ok: true, item: updated })
})

subscriptionRoutes.post('/tenants/:tenantId/cancel', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')

  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, tenantId))
  if (tenantRows.length === 0) return c.json({ ok: false, message: 'Tenant not found' }, 404)

  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const [updated] = await db
    .update(tenants)
    .set({
      subscriptionStatus: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning()

  await writeAuditLog({
    actorId: userId,
    action: 'tenant.cancelled',
    targetType: 'subscription',
    targetId: tenantId,
    payload: { previousStatus: tenantRows[0].subscriptionStatus },
  })

  return c.json({ ok: true, item: updated })
})
