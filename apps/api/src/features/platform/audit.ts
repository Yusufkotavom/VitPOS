import { db } from '../../lib/db.js'
import { platformAuditLogs } from '../../../../../src/db/schema/index.js'

export type PlatformAuditAction =
  | 'plan.created' | 'plan.updated' | 'plan.deleted'
  | 'tenant.updated' | 'tenant.suspended' | 'tenant.reactivated'
  | 'user.role_changed' | 'user.suspended' | 'user.reactivated'
  | 'membership.role_changed'

export type PlatformAuditTargetType = 'plan' | 'tenant' | 'user' | 'membership'

export async function writeAuditLog(input: {
  actorId: string
  action: PlatformAuditAction
  targetType: PlatformAuditTargetType
  targetId?: string | null
  payload?: Record<string, unknown>
}) {
  await db.insert(platformAuditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    payload: input.payload ?? {},
    updatedAt: new Date(),
  })
}
