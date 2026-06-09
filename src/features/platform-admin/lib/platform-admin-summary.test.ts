import { describe, expect, it } from 'vitest'

import { getPlatformAdminSummary } from '@/features/platform-admin/lib/platform-admin-summary'
import type { PlatformTenant } from '@/services/api/platform-admin.service'

const mockTenants: PlatformTenant[] = [
  {
    id: '1',
    tenantName: 'Toko A',
    ownerName: 'A',
    city: 'Jakarta',
    packageName: 'pro',
    subscriptionStatus: 'active',
    planValidUntil: '2026-06-08T09:10:00Z',
    storageLimitGb: 80,
    isActive: true,
  },
  {
    id: '2',
    tenantName: 'Toko B',
    ownerName: 'B',
    city: 'Bandung',
    packageName: 'starter',
    subscriptionStatus: 'active',
    planValidUntil: '2026-06-08T09:10:00Z',
    storageLimitGb: 30,
    isActive: true,
  },
  {
    id: '3',
    tenantName: 'Toko C',
    ownerName: 'C',
    city: 'Surabaya',
    packageName: 'enterprise',
    subscriptionStatus: 'suspended',
    planValidUntil: '2026-06-08T09:10:00Z',
    storageLimitGb: 150,
    isActive: false,
  }
]

describe('getPlatformAdminSummary', () => {
  it('summarizes tenants, billing, storage, and sync health', () => {
    const summary = getPlatformAdminSummary(mockTenants)

    expect(summary.totalTenants).toBe(3)
    expect(summary.activeTenants).toBe(2) // 2 active
    // pro (1.490.000) + starter (1.250.000) + enterprise (2.700.000) = 5.440.000
    expect(summary.monthlyRecurringRevenue).toBe('Rp 5.440.000') 
    expect(summary.storageUsed).toBe('0 GB / 260 GB') // 80 + 30 + 150 = 260
    expect(summary.tenantsNeedingSyncReview).toBe(0)
  })
})
