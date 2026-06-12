import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { writeAuditLog } from '../platform/audit.js'
import { db } from '../../lib/db.js'
import {
  planChangeRequests,
  platformBillingSettings,
  subscriptionEvents,
  subscriptionInvoices,
  subscriptionPayments,
  subscriptionPlans,
  tenantMembers,
  tenants,
} from '../../../../../src/db/schema/index.js'

type Env = { Variables: { userId: string } }

export const subscriptionBillingRoutes = new Hono<Env>()

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

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function invoiceNumber() {
  return `INV-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function writeSubscriptionEvent(input: { tenantId: string; actorUserId?: string; eventType: string; metadata?: Record<string, unknown> }) {
  await db.insert(subscriptionEvents).values({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    metadata: input.metadata ?? {},
  })
}

subscriptionBillingRoutes.get('/billing-settings', async (c) => {
  const rows = await db.select().from(platformBillingSettings)
  return c.json({ ok: true, item: rows[0] ?? null })
})

subscriptionBillingRoutes.get('/tenants/:tenantId/invoices', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const items = await db
    .select()
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.tenantId, tenantId))
    .orderBy(desc(subscriptionInvoices.createdAt))

  return c.json({ ok: true, items })
})

subscriptionBillingRoutes.get('/tenants/:tenantId/events', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const items = await db
    .select()
    .from(subscriptionEvents)
    .where(eq(subscriptionEvents.tenantId, tenantId))
    .orderBy(desc(subscriptionEvents.createdAt))

  return c.json({ ok: true, items })
})

const createInvoiceSchema = z.object({
  type: z.enum(['new_subscription', 'renewal', 'upgrade', 'downgrade', 'manual_adjustment']).default('renewal'),
  planCode: z.string().min(1).max(40),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
})

subscriptionBillingRoutes.post('/tenants/:tenantId/invoices', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')
  const body = createInvoiceSchema.parse(await c.req.json())

  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const [plan] = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.code, body.planCode), eq(subscriptionPlans.isActive, true)))
  if (!plan) return c.json({ ok: false, message: 'Plan not found' }, 404)

  const now = new Date()
  const amount = body.billingPeriod === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice
  const [invoice] = await db.insert(subscriptionInvoices).values({
    tenantId,
    invoiceNumber: invoiceNumber(),
    type: body.type,
    planCode: plan.code,
    billingPeriod: body.billingPeriod,
    amount,
    status: 'pending_payment',
    periodStart: now,
    periodEnd: addDays(now, plan.durationDays),
    dueAt: addDays(now, 7),
  }).returning()

  await db.update(tenants).set({ subscriptionStatus: 'pending_payment', updatedAt: now }).where(eq(tenants.id, tenantId))
  await writeSubscriptionEvent({ tenantId, actorUserId: userId, eventType: 'invoice.created', metadata: { invoiceId: invoice.id, planCode: plan.code } })
  await writeAuditLog({ actorId: userId, action: 'subscription.invoice_created', targetType: 'subscription', targetId: tenantId, payload: { invoiceId: invoice.id } })

  return c.json({ ok: true, item: invoice }, 201)
})

const submitPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().min(1),
  bankName: z.string().max(120).optional(),
  accountName: z.string().max(160).optional(),
  referenceNumber: z.string().max(120).optional(),
  proofImageUrl: z.string().url().optional(),
  proofText: z.string().min(3).optional(),
}).refine((value) => value.proofImageUrl || value.proofText, { message: 'Isi catatan bukti bayar atau unggah bukti transfer.' })

subscriptionBillingRoutes.post('/tenants/:tenantId/payments', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')
  const body = submitPaymentSchema.parse(await c.req.json())

  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const [invoice] = await db.select().from(subscriptionInvoices).where(and(eq(subscriptionInvoices.id, body.invoiceId), eq(subscriptionInvoices.tenantId, tenantId)))
  if (!invoice) return c.json({ ok: false, message: 'Invoice not found' }, 404)

  const now = new Date()
  const [payment] = await db.insert(subscriptionPayments).values({
    tenantId,
    invoiceId: body.invoiceId,
    amount: body.amount,
    method: 'manual_transfer',
    bankName: body.bankName,
    accountName: body.accountName,
    referenceNumber: body.referenceNumber,
    proofImageUrl: body.proofImageUrl,
    proofText: body.proofText,
    status: 'submitted',
    submittedByUserId: userId,
  }).returning()

  await db.update(subscriptionInvoices).set({ status: 'submitted', updatedAt: now }).where(eq(subscriptionInvoices.id, body.invoiceId))
  await db.update(tenants).set({ subscriptionStatus: 'pending_approval', updatedAt: now }).where(eq(tenants.id, tenantId))
  await writeSubscriptionEvent({ tenantId, actorUserId: userId, eventType: 'payment.submitted', metadata: { paymentId: payment.id, invoiceId: invoice.id } })
  await writeAuditLog({ actorId: userId, action: 'subscription.payment_submitted', targetType: 'subscription', targetId: tenantId, payload: { paymentId: payment.id, invoiceId: invoice.id } })

  return c.json({ ok: true, item: payment }, 201)
})

const changePlanSchema = z.object({
  toPlanCode: z.string().min(1).max(40),
  changeType: z.enum(['upgrade', 'downgrade', 'renewal']),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
})

subscriptionBillingRoutes.post('/tenants/:tenantId/change-plan', async (c) => {
  const tenantId = c.req.param('tenantId')
  const userId = c.get('userId')
  const body = changePlanSchema.parse(await c.req.json())
  const auth = await requireTenantOwnerOrAdmin(userId, tenantId)
  if (!auth.ok) return c.json({ ok: false, message: auth.message }, 403)

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId))
  if (!tenant) return c.json({ ok: false, message: 'Tenant not found' }, 404)

  const [plan] = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.code, body.toPlanCode), eq(subscriptionPlans.isActive, true)))
  if (!plan) return c.json({ ok: false, message: 'Plan not found' }, 404)

  const now = new Date()
  let invoiceId: string | null = null
  let status: 'pending_payment' | 'scheduled' = 'pending_payment'

  if (body.changeType === 'downgrade') {
    status = 'scheduled'
  } else {
    const amount = body.billingPeriod === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice
    const [invoice] = await db.insert(subscriptionInvoices).values({
      tenantId,
      invoiceNumber: invoiceNumber(),
      type: body.changeType,
      planCode: plan.code,
      billingPeriod: body.billingPeriod,
      amount,
      status: 'pending_payment',
      periodStart: now,
      periodEnd: addDays(now, plan.durationDays),
      dueAt: addDays(now, 7),
    }).returning()
    invoiceId = invoice.id
  }

  const [request] = await db.insert(planChangeRequests).values({
    tenantId,
    fromPlanCode: tenant.planCode,
    toPlanCode: plan.code,
    changeType: body.changeType,
    status,
    effectiveAt: body.changeType === 'downgrade' ? tenant.planValidUntil : null,
    invoiceId,
    requestedByUserId: userId,
  }).returning()

  await writeSubscriptionEvent({ tenantId, actorUserId: userId, eventType: 'plan_change.requested', metadata: { requestId: request.id, changeType: body.changeType } })
  return c.json({ ok: true, item: request }, 201)
})
