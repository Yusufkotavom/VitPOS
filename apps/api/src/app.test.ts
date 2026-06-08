import { describe, expect, it } from 'vitest'

import { createApp } from './app'

describe('createApp', () => {
  it('serves health route without database env', async () => {
    const previousUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    try {
      const app = createApp()
      const response = await app.request('/health')
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({ ok: true, service: 'kotacom-api', version: 'v1' })
    } finally {
      if (previousUrl) {
        process.env.DATABASE_URL = previousUrl
      } else {
        delete process.env.DATABASE_URL
      }
    }
  })
})
