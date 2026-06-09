import type { Context, Next } from 'hono'
import { readUserId } from './routes.js'

export async function authMiddleware(c: Context, next: Next) {
  const userId = readUserId(c.req.raw)

  if (!userId) {
    return c.json({ ok: false, message: 'Authentication required' }, 401)
  }

  c.set('userId', userId)
  await next()
}
