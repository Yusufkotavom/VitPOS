import type { Context, Next } from 'hono'
import { eq } from 'drizzle-orm'

import { db } from '../../lib/db.js'
import { users } from '../../../../../src/db/schema/index.js'

export async function platformAdminMiddleware(c: Context<any>, next: Next) {
  const userId = c.get('userId') as string | undefined

  if (!userId) {
    return c.json({ ok: false, message: 'Authentication required' }, 401)
  }

  const rows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
  const user = rows[0]

  if (!user || user.role !== 'platform_admin') {
    return c.json({ ok: false, message: 'Platform admin only' }, 403)
  }

  c.set('platformAdminId', user.id)
  await next()
}
