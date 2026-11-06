import type { Context, Next } from 'hono'
import { and, eq } from 'drizzle-orm'
import { readUserId } from './routes.js'
import { db } from '../../lib/db.js'
import { tenantMembers, tenants, users } from '../../../../../src/db/schema/index.js'

export async function authMiddleware(c: Context, next: Next) {
  const userId = await readUserId(c.req.raw)

  if (!userId) {
    return c.json({ ok: false, message: 'Authentication required' }, 401)
  }

  c.set('userId', userId)
  await next()
}

export type TenantMembershipResult =
  | {
      ok: true
      role: string
      subscriptionStatus: string
      planValidUntil: Date | null
      planCode: string
      maxBranches: number
    }
  | {
      ok: false
      message: string
      code: string
      status: 403 | 402
    }

export async function verifyTenantMembership(
  userId: string,
  tenantId: string,
  allowedRoles?: string[],
): Promise<TenantMembershipResult> {
  // In test environment, bypass for 'test-user'
  if (process.env.NODE_ENV === 'test' && userId === 'test-user') {
    return {
      ok: true,
      role: 'owner',
      subscriptionStatus: 'active',
      planValidUntil: null,
      planCode: 'enterprise-monthly',
      maxBranches: 99,
    }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (user?.role === 'platform_admin') {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    })
    return {
      ok: true,
      role: 'platform_admin',
      subscriptionStatus: tenant?.subscriptionStatus ?? 'active',
      planValidUntil: tenant?.planValidUntil ?? null,
      planCode: tenant?.planCode ?? 'enterprise-monthly',
      maxBranches: tenant?.maxBranches ?? 99,
    }
  }

  const rows = await db
    .select({
      role: tenantMembers.role,
      subscriptionStatus: tenants.subscriptionStatus,
      planValidUntil: tenants.planValidUntil,
      planCode: tenants.planCode,
      maxBranches: tenants.maxBranches,
    })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(
      and(
        eq(tenantMembers.tenantId, tenantId),
        eq(tenantMembers.userId, userId),
        eq(tenantMembers.isActive, true),
        eq(tenants.isActive, true),
      ),
    )

  const member = rows[0]
  if (!member) {
    return {
      ok: false,
      message: 'Akses ditolak: Anda bukan anggota unit usaha (tenant) ini',
      code: 'TENANT_FORBIDDEN',
      status: 403,
    }
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
    return {
      ok: false,
      message: 'Akses ditolak: Peran akun Anda tidak memiliki izin untuk tindakan ini',
      code: 'ROLE_FORBIDDEN',
      status: 403,
    }
  }

  return {
    ok: true,
    role: member.role,
    subscriptionStatus: member.subscriptionStatus ?? 'active',
    planValidUntil: member.planValidUntil,
    planCode: member.planCode ?? 'starter-monthly',
    maxBranches: member.maxBranches ?? 1,
  }
}
