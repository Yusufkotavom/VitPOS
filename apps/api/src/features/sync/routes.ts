import { and, desc, eq, gte } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db'
import { buildSyncPushResponse, toApiSyncItemStatus, type SyncMutationInput, type SyncPushItemResult } from '../../lib/contracts'
import { outboxLogs } from '../../../../../src/db/schema'

export const syncRoutes = new Hono()

syncRoutes.get('/pull', async (c) => {
  const tenantId = c.req.query('tenantId')
  const branchId = c.req.query('branchId')
  const since = c.req.query('since')

  if (!tenantId) {
    return c.json({ ok: false, message: 'tenantId required' }, 400)
  }

  const filters = [eq(outboxLogs.tenantId, tenantId)]
  if (branchId) filters.push(eq(outboxLogs.branchId, branchId))
  if (since) filters.push(gte(outboxLogs.updatedAt, new Date(since)))

  const items = await db.query.outboxLogs.findMany({
    where: and(...filters),
    orderBy: [desc(outboxLogs.updatedAt)],
    limit: 100,
  })

  return c.json({
    ok: true,
    cursor: items.at(0)?.updatedAt?.toISOString() ?? since ?? null,
    items: items.map((item) => ({
      id: item.id,
      entityId: item.entityId,
      entityType: item.entityType,
      mutationType: item.mutationType,
      payload: item.payload,
      transportStatus: toApiSyncItemStatus(item.status === 'pending' ? 'queued' : item.status === 'synced' ? 'synced' : 'failed'),
      updatedAt: item.updatedAt.toISOString(),
    })),
  })
})

syncRoutes.post('/push', async (c) => {
  const body = await c.req.json().catch(() => null) as {
    tenantId?: string
    branchId?: string | null
    deviceId?: string
    mutations?: SyncMutationInput[]
  } | null

  if (!body?.tenantId || !body?.deviceId || !Array.isArray(body.mutations)) {
    return c.json({ ok: false, message: 'tenantId, deviceId, mutations required' }, 400)
  }

  const now = new Date()
  const items: SyncPushItemResult[] = []

  for (const mutation of body.mutations) {
    const itemStatus = mutation.payload ? 'applied' : 'rejected'
    const payload = mutation.payload ?? { message: 'payload missing' }

    await db.insert(outboxLogs).values({
      tenantId: body.tenantId,
      branchId: body.branchId ?? null,
      deviceId: body.deviceId,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      mutationType: mutation.mutationType,
      payload,
      status: itemStatus === 'applied' ? 'synced' : 'failed',
      attempts: 1,
      errorMessage: itemStatus === 'rejected' ? 'payload missing' : null,
      createdAt: now,
      updatedAt: now,
    })

    items.push({
      entityId: mutation.entityId,
      entityType: mutation.entityType,
      mutationType: mutation.mutationType,
      status: itemStatus,
      message: itemStatus === 'rejected' ? 'payload missing' : undefined,
    })
  }

  return c.json(buildSyncPushResponse(items))
})
