import type { Context } from 'hono'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
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

reportRoutes.get('/sales/summary', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const summary = await getSalesSummary(db, input)
  return c.json({ ok: true, summary })
})

reportRoutes.get('/payments/summary', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const items = await getPaymentSummary(db, input)
  return c.json({ ok: true, items })
})

reportRoutes.get('/inventory/movements', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const items = await getInventoryMovementSummary(db, input)
  return c.json({ ok: true, items })
})

reportRoutes.get('/profit-loss', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const data = await getProfitLoss(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/balance-sheet', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const data = await getBalanceSheet(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/sales', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const data = await getSalesReport(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/payments', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const data = await getPaymentReport(db, input)
  return c.json({ ok: true, data })
})

reportRoutes.get('/inventory', async (c) => {
  const input = getInput(c)
  if (!input.tenantId) return c.json({ ok: false, message: 'tenantId required' }, 400)
  const data = await getInventoryReport(db, input)
  return c.json({ ok: true, data })
})
