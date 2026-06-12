import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { writeAuditLog } from './audit.js'
import { db } from '../../lib/db.js'
import {
  planChangeRequests,
  platformBillingSettings,
  subscriptionEvents,
  subscriptionInvoices,
  subscriptionPayments,
  subscriptionPlans,
  tenants,
} from '../../../../../src/db/schema/index.js'

type Env = {
  Variables: {
    userId: string
    platformAdminId: string
  }
}

export const platformBillingRoutes = new Hono<Env>()

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

async function writeSubscriptionEvent(input: { tenantId: string; actorUserId?: string; eventType: string; metadata?: Record<string, unknown> }) {
  await db.insert(subscriptionEvents).values({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    metadata: input.metadata ?? {},
  })
}

platformBillingRoutes.get('/billing/payments', async (c) => {
  const items = await db.select().from(subscriptionPayments).orderBy(desc(subscriptionPayments.createdAt))
  return c.json({ ok: true, items })
})

platformBillingRoutes.get('/billing/invoices', async (c) => {
  const items = await db.select().from(subscriptionInvoices).orderBy(desc(subscriptionInvoices.createdAt))
  return c.json({ ok: true, items })
})

platformBillingRoutes.get('/billing/events', async (c) => {
  const items = await db.select().from(subscriptionEvents).orderBy(desc(subscriptionEvents.createdAt))
  return c.json({ ok: true, items })
})

const billingSettingsSchema = z.object({
  supportWhatsapp: z.string().max(120).nullable().optional(),
  supportText: z.string().nullable().optional(),
  supportUrl: z.string().nullable().optional(),
  paymentInstructions: z.string().nullable().optional(),
  bankAccounts: z.array(z.object({ bankName: z.string(), accountName: z.string(), accountNumber: z.string() })).default([]),
})

platformBillingRoutes.patch('/billing/settings', async (c) => {
  const actorId = c.get('platformAdminId')
  const body = billingSettingsSchema.parse(await c.req.json())
  const existing = await db.select().from(platformBillingSettings)
  const now = new Date()

  const [item] = existing[0]
    ? await db.update(platformBillingSettings).set({ ...body, updatedAt: now }).where(eq(platformBillingSettings.id, existing[0].id)).returning()
    : await db.insert(platformBillingSettings).values(body).returning()

  await writeAuditLog({ actorId, action: 'platform.billing_settings_updated', targetType: 'billing_settings', targetId: item.id, payload: body })
  return c.json({ ok: true, item })
})

platformBillingRoutes.patch('/billing/payments/:paymentId/approve', async (c) => {
  const actorId = c.get('platformAdminId')
  const paymentId = c.req.param('paymentId')

  const [payment] = await db.select().from(subscriptionPayments).where(eq(subscriptionPayments.id, paymentId))
  if (!payment) return c.json({ ok: false, message: 'Payment not found' }, 404)

  const [invoice] = await db.select().from(subscriptionInvoices).where(eq(subscriptionInvoices.id, payment.invoiceId))
  if (!invoice) return c.json({ ok: false, message: 'Invoice not found' }, 404)

  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, invoice.planCode))
  if (!plan) return c.json({ ok: false, message: 'Plan not found' }, 404)

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, payment.tenantId))
  if (!tenant) return c.json({ ok: false, message: 'Tenant not found' }, 404)

  const now = new Date()
  const baseDate = tenant.planValidUntil && tenant.planValidUntil > now ? tenant.planValidUntil : now
  const validUntil = addDays(baseDate, plan.durationDays)

  const [updatedPayment] = await db.update(subscriptionPayments).set({ status: 'approved', reviewedByUserId: actorId, reviewedAt: now, updatedAt: now }).where(eq(subscriptionPayments.id, payment.id)).returning()
  await db.update(subscriptionInvoices).set({ status: 'paid', updatedAt: now }).where(eq(subscriptionInvoices.id, invoice.id)).returning()
  const [updatedTenant] = await db.update(tenants).set({
    planCode: plan.code,
    billingPeriod: invoice.billingPeriod,
    subscriptionStatus: 'active',
    planValidUntil: validUntil,
    storageLimitMb: plan.storageLimitMb,
    maxBranches: plan.maxBranches,
    isActive: true,
    updatedAt: now,
  }).where(eq(tenants.id, payment.tenantId)).returning()
  await db.update(planChangeRequests).set({ status: 'applied', reviewedByUserId: actorId, updatedAt: now }).where(eq(planChangeRequests.invoiceId, invoice.id)).returning()

  await writeSubscriptionEvent({ tenantId: payment.tenantId, actorUserId: actorId, eventType: 'payment.approved', metadata: { paymentId: payment.id, invoiceId: invoice.id, planCode: plan.code } })
  await writeAuditLog({ actorId, action: 'platform.payment_approved', targetType: 'subscription_payment', targetId: payment.id, payload: { invoiceId: invoice.id, tenantId: payment.tenantId } })

  return c.json({ ok: true, item: { payment: updatedPayment, tenant: updatedTenant } })
})

const rejectSchema = z.object({ reviewNote: z.string().min(3) })

platformBillingRoutes.patch('/billing/payments/:paymentId/reject', async (c) => {
  const actorId = c.get('platformAdminId')
  const paymentId = c.req.param('paymentId')
  const body = rejectSchema.parse(await c.req.json())
  const now = new Date()

  const [payment] = await db.update(subscriptionPayments).set({
    status: 'rejected',
    reviewedByUserId: actorId,
    reviewedAt: now,
    reviewNote: body.reviewNote,
    updatedAt: now,
  }).where(eq(subscriptionPayments.id, paymentId)).returning()

  if (!payment) return c.json({ ok: false, message: 'Payment not found' }, 404)

  await db.update(subscriptionInvoices).set({ status: 'pending_payment', updatedAt: now }).where(eq(subscriptionInvoices.id, payment.invoiceId)).returning()
  await writeSubscriptionEvent({ tenantId: payment.tenantId, actorUserId: actorId, eventType: 'payment.rejected', metadata: { paymentId, reviewNote: body.reviewNote } })
  await writeAuditLog({ actorId, action: 'platform.payment_rejected', targetType: 'subscription_payment', targetId: payment.id, payload: { reviewNote: body.reviewNote } })

  return c.json({ ok: true, item: payment })
})
