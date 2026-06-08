import { describe, expect, it } from 'vitest'

import { getPlatformAdminSummary } from '@/features/platform-admin/lib/platform-admin-summary'
import { platformAdminTenants } from '@/features/platform-admin/mocks/platform-admin-data'

describe('getPlatformAdminSummary', () => {
  it('summarizes tenants, billing, storage, and sync health in Indonesian admin terms', () => {
    const summary = getPlatformAdminSummary(platformAdminTenants)

    expect(summary.totalTenants).toBe(4)
    expect(summary.activeTenants).toBe(3)
    expect(summary.monthlyRecurringRevenue).toBe('Rp 5.440.000')
    expect(summary.storageUsed).toBe('135 GB / 260 GB')
    expect(summary.tenantsNeedingSyncReview).toBe(2)
  })
})
