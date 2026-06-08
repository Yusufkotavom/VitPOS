import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import { getInventoryMovementSummary, getPaymentSummary, getSalesSummary } from './service.js'

export const reportRoutes = new Hono()

reportRoutes.get('/sales/summary', async (c) => {
  const tenantId = c.req.query('tenantId')

  if (!tenantId) {
    return c.json({ ok: false, message: 'tenantId required' }, 400)
  }

  const summary = await getSalesSummary(db, {
    tenantId,
    branchId: c.req.query('branchId') ?? undefined,
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  })

  return c.json({ ok: true, summary })
})

reportRoutes.get('/payments/summary', async (c) => {
  const tenantId = c.req.query('tenantId')

  if (!tenantId) {
    return c.json({ ok: false, message: 'tenantId required' }, 400)
  }

  const items = await getPaymentSummary(db, {
    tenantId,
    branchId: c.req.query('branchId') ?? undefined,
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  })

  return c.json({ ok: true, items })
})

reportRoutes.get('/inventory/movements', async (c) => {
  const tenantId = c.req.query('tenantId')

  if (!tenantId) {
    return c.json({ ok: false, message: 'tenantId required' }, 400)
  }

  const items = await getInventoryMovementSummary(db, {
    tenantId,
    branchId: c.req.query('branchId') ?? undefined,
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  })

  return c.json({ ok: true, items })
})
