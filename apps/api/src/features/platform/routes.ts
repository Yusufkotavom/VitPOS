import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../lib/db.js'
import { tenantMembers, tenants, users } from '../../../../../src/db/schema/index.js'

export const platformRoutes = new Hono()

platformRoutes.get('/tenants', async (c) => {
  const result = await db.select({
    id: tenants.id,
    tenantName: tenants.name,
    ownerName: users.name,
    city: tenants.address,
    packageName: tenants.planCode,
    subscriptionStatus: tenants.subscriptionStatus,
    planValidUntil: tenants.planValidUntil,
    storageLimitGb: sql<number>`${tenants.storageLimitMb} / 1024.0`,
    isActive: tenants.isActive
  })
  .from(tenants)
  .leftJoin(tenantMembers, eq(tenants.id, tenantMembers.tenantId))
  .leftJoin(users, eq(tenantMembers.userId, users.id))
  .where(eq(tenantMembers.role, 'owner'))

  return c.json({ ok: true, items: result })
})
