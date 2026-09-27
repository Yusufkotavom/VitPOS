import { describe, expect, it } from 'vitest'
import { router } from '@/app/router'

describe('router configuration', () => {
  it('registers redirect from /dashboard to /', () => {
    // Check top-level routes
    const topLevelDashboard = router.routes.find((r) => r.path === '/dashboard')
    expect(topLevelDashboard).toBeDefined()

    // Check children under /
    const rootRoute = router.routes.find((r) => r.path === '/')
    const childDashboard = rootRoute?.children?.find((r) => r.path === 'dashboard')
    expect(childDashboard).toBeDefined()
  })
})
