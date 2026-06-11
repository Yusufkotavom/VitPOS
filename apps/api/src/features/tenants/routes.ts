import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import { branches } from '../../../../../src/db/schema/index.js'
import { authMiddleware } from '../auth/middleware.js'

type Env = { Variables: { userId: string } }
export const tenantRoutes = new Hono<Env>()

tenantRoutes.use('*', authMiddleware)

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

import { tenants, tenantMembers, warehouses } from '../../../../../src/db/schema/index.js'

tenantRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null) as {
    id?: string
    name?: string
  } | null

  const tenantId = body?.id || crypto.randomUUID()
  const tenantName = body?.name?.trim()

  if (!tenantName) {
    return c.json({ ok: false, message: 'name required' }, 400)
  }

  const branchId = crypto.randomUUID()
  const warehouseId = crypto.randomUUID()
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(tenants).values({
      id: tenantId,
      name: tenantName,
      planCode: 'trial-monthly',
      billingPeriod: 'monthly',
      subscriptionStatus: 'trial',
      planValidUntil: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      storageLimitMb: 1024,
      maxBranches: 1,
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

  return c.json({
    ok: true,
    tenantId,
    defaultBranchId: branchId,
    defaultWarehouseId: warehouseId,
  })
})

