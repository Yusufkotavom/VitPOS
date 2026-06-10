import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import { branches } from '../../../../../src/db/schema/index.js'

export const tenantRoutes = new Hono()

tenantRoutes.get('/default-branch', async (c) => {
  const tenantId = c.req.query('tenantId')
  if (!tenantId) {
    return c.json({ ok: false, message: 'tenantId required' }, 400)
  }

  const branch = await db.query.branches.findFirst({
    where: and(
      eq(branches.tenantId, tenantId),
      eq(branches.isDefault, true),
      eq(branches.isActive, true),
    ),
  })

  if (!branch) {
    return c.json({ ok: false, message: 'No default branch found for this tenant' }, 404)
  }

  return c.json({ ok: true, id: branch.id, name: branch.name })
})
