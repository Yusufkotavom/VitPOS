import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { authRoutes } from './features/auth/routes.js'
import { healthRoutes } from './features/health/routes.js'
import { reportRoutes } from './features/reports/routes.js'
import { syncRoutes } from './features/sync/routes.js'
import { platformRoutes } from './features/platform/routes.js'
import { subscriptionRoutes } from './features/subscription/routes.js'
import { tenantRoutes } from './features/tenants/routes.js'
import { updateRoutes } from './features/updates/routes.js'

export function createApp() {
  const app = new Hono()

  app.use('*', cors())

  app.get('/', (c) => c.json({ message: 'VitPOS API is running!' }))

  app.route('/health', healthRoutes)
  app.route('/api/v1/health', healthRoutes)
  app.route('/api/v1/auth', authRoutes)
  app.route('/api/v1/sync', syncRoutes)
  app.route('/api/v1/reports', reportRoutes)
  app.route('/api/v1/platform', platformRoutes)
  app.route('/api/v1/subscription', subscriptionRoutes)
  app.route('/api/v1/tenants', tenantRoutes)
  app.route('/api/v1/updates', updateRoutes)

  app.onError((error, c) => {
    return c.json({ ok: false, message: error.message }, 500)
  })

  return app
}
