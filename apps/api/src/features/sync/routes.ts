import { and, desc, eq, gte } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../../lib/db'
import {
  buildSyncPushResponse,
  serverSyncStatusToApiItemStatus,
  parseSyncPullQuery,
  parseSyncPushBody,
  type SyncPushItemResult,
} from '../../lib/contracts'
import { outboxLogs } from '../../../../../src/db/schema'

export const syncRoutes = new Hono()

syncRoutes.get('/pull', async (c) => {
  const parsed = parseSyncPullQuery({
    tenantId: c.req.query('tenantId'),
    branchId: c.req.query('branchId'),
    since: c.req.query('since'),
  })

  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400)
  }

  const filters = [eq(outboxLogs.tenantId, parsed.value.tenantId)]
  if (parsed.value.branchId) filters.push(eq(outboxLogs.branchId, parsed.value.branchId))
  if (parsed.value.since) filters.push(gte(outboxLogs.updatedAt, parsed.value.since))

  const items = await db.query.outboxLogs.findMany({
    where: and(...filters),
    orderBy: [desc(outboxLogs.updatedAt)],
    limit: 100,
  })

  return c.json({
    ok: true,
    cursor: items.at(0)?.updatedAt?.toISOString() ?? parsed.value.since?.toISOString() ?? null,
    items: items.map((item) => ({
      id: item.id,
      entityId: item.entityId,
      entityType: item.entityType,
      mutationType: item.mutationType,
      payload: item.payload,
      transportStatus: serverSyncStatusToApiItemStatus(item.status),
      updatedAt: item.updatedAt.toISOString(),
    })),
  })
})

syncRoutes.post('/push', async (c) => {
  const parsed = parseSyncPushBody(await c.req.json().catch(() => null))

  if (!parsed.ok) {
    return c.json({ ok: false, message: parsed.message }, 400)
  }

  const now = new Date()
  const items: SyncPushItemResult[] = []

  for (const mutation of parsed.value.mutations) {
    const itemStatus = mutation.payload === undefined ? 'rejected' : 'applied'
    const payload = mutation.payload ?? { message: 'payload missing' }

    await db.insert(outboxLogs).values({
      tenantId: parsed.value.tenantId,
      branchId: parsed.value.branchId ?? null,
      deviceId: parsed.value.deviceId,
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
