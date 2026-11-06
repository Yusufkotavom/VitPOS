import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db.js'
import { branches, tenantMembers, tenants, warehouses } from '../../../../../src/db/schema/index.js'
import { authMiddleware, verifyTenantMembership } from '../auth/middleware.js'

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

tenantRoutes.post('/:tenantId/branches', async (c) => {
  const userId = c.get('userId')
  const tenantId = c.req.param('tenantId')

  const authResult = await verifyTenantMembership(userId, tenantId, ['owner', 'admin'])
  if (!authResult.ok) {
    return c.json({ ok: false, message: authResult.message, code: authResult.code }, authResult.status)
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  if (!tenant) {
    return c.json({ ok: false, message: 'Unit usaha tidak ditemukan' }, 404)
  }

  const existingBranches = await db.query.branches.findMany({
    where: and(eq(branches.tenantId, tenantId), eq(branches.isActive, true)),
  })

  const maxBranches = tenant.maxBranches ?? 1
  if (existingBranches.length >= maxBranches) {
    return c.json({
      ok: false,
      code: 'PLAN_LIMIT_REACHED',
      message: `Batas maksimum cabang (${maxBranches} cabang) untuk paket ini telah tercapai. Silakan tingkatkan paket langganan Anda.`,
    }, 403)
  }

  const body = (await c.req.json().catch(() => null)) as { name?: string; address?: string; phone?: string } | null
  const branchName = body?.name?.trim()
  if (!branchName) {
    return c.json({ ok: false, message: 'Nama cabang wajib diisi' }, 400)
  }

  const branchId = crypto.randomUUID()
  const warehouseId = crypto.randomUUID()
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.insert(branches).values({
      id: branchId,
      tenantId,
      name: branchName,
      address: body?.address?.trim() ?? null,
      phone: body?.phone?.trim() ?? null,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    await tx.insert(warehouses).values({
      id: warehouseId,
      tenantId,
      branchId,
      name: `Gudang ${branchName}`,
      isDefault: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  })

  return c.json({ ok: true, id: branchId, name: branchName, warehouseId })
})

