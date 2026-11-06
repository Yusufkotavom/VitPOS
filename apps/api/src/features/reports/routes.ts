import type { Context } from 'hono'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import { readUserId } from '../auth/routes.js'
import { verifyTenantMembership } from '../auth/middleware.js'
import {
  getBalanceSheet,
  getInventoryMovementSummary,
  getInventoryReport,
  getPaymentReport,
  getPaymentSummary,
  getProfitLoss,
  getSalesReport,
  getSalesSummary,
} from './service.js'

export const reportRoutes = new Hono()

function getInput(c: Context) {
  return {
    tenantId: c.req.query('tenantId') ?? '',
    branchId: c.req.query('branchId') ?? undefined,
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  }
}

async function authorizeTenant(c: Context, tenantId: string) {
  if (!tenantId) {
    return { ok: false as const, response: c.json({ ok: false, message: 'tenantId required' }, 400) }
  }
  const userId = await readUserId(c.req.raw)
  if (!userId) {
    return { ok: false as const, response: c.json({ ok: false, message: 'Authentication required' }, 401) }
  }
  const authResult = await verifyTenantMembership(userId, tenantId)
  if (!authResult.ok) {
    return { ok: false as const, response: c.json({ ok: false, message: authResult.message, code: authResult.code }, authResult.status) }
  }
  return { ok: true as const }
}

reportRoutes.get('/sales/summary', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const summary = await getSalesSummary(db, input)
  return c.json({ ok: true, summary })
})

reportRoutes.get('/payments/summary', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const items = await getPaymentSummary(db, input)
  return c.json({ ok: true, items })
})

reportRoutes.get('/inventory/movements', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const items = await getInventoryMovementSummary(db, input)
  return c.json({ ok: true, items })
})

reportRoutes.get('/profit-loss', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const data = await getProfitLoss(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/balance-sheet', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const data = await getBalanceSheet(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/sales', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const data = await getSalesReport(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/payments', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const data = await getPaymentReport(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/inventory', async (c) => {
  const input = getInput(c)
  const auth = await authorizeTenant(c, input.tenantId)
  if (!auth.ok) return auth.response
  const data = await getInventoryReport(db, input)
  return c.json({ ok: true, data })
})
