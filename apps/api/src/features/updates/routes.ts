import { Hono } from 'hono'

import { resolveAppUpdate, resolveDesktopUpdate, type AppUpdatePlatform } from './service.js'

export const updateRoutes = new Hono()

updateRoutes.get('/latest', async (c) => {
  const platform = c.req.query('platform') as AppUpdatePlatform | undefined
  const currentVersion = c.req.query('currentVersion')

  if (!platform || !currentVersion) {
    return c.json({ ok: false, message: 'platform and currentVersion required' }, 400)
  }

  const payload = await resolveAppUpdate(platform, currentVersion)
  return c.json(payload)
})

updateRoutes.get('/desktop/:target/:arch/:currentVersion', async (c) => {
  const target = c.req.param('target')
  const arch = c.req.param('arch')
  const currentVersion = c.req.param('currentVersion')

  const payload = await resolveDesktopUpdate(target, arch, currentVersion)
  if (!payload) {
    return c.body(null, 204)
  }

  return c.json(payload)
})
