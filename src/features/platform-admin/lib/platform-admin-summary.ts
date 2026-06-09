import { formatCurrency } from '@/lib/format-currency'
import type { PlatformTenant } from '@/services/api/platform-admin.service'

export function getPlatformAdminSummary(tenants: PlatformTenant[]) {
  const totalTenants = tenants.length
  const activeTenants = tenants.filter((tenant) => tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'trial').length
  
  // Calculate mockup MRR based on package name since it's not yet dynamic
  const getFee = (pkg: string) => {
    if (pkg === 'enterprise') return 2700000
    if (pkg === 'pro') return 1490000
    if (pkg === 'starter') return 1250000
    return 0
  }
  
  const monthlyRecurringRevenue = formatCurrency(tenants.reduce((total, tenant) => total + getFee(tenant.packageName), 0))
  // Mock usage for now, use 0 for actual DB fields
  const storageUsed = 0 
  const storageLimit = tenants.reduce((total, tenant) => total + tenant.storageLimitGb, 0)
  
  // Sync status is now abstracted to individual tenant metrics, keeping mock count 0 for platform wide
  const tenantsNeedingSyncReview = 0

  return {
    totalTenants,
    activeTenants,
    monthlyRecurringRevenue,
    storageUsed: `${storageUsed} GB / ${storageLimit} GB`,
    tenantsNeedingSyncReview,
    getFee
  }
}
