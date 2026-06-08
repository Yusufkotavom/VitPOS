import { formatCurrency } from '@/lib/format-currency'
import type { PlatformAdminTenant } from '@/features/platform-admin/mocks/platform-admin-data'

export function getPlatformAdminSummary(tenants: PlatformAdminTenant[]) {
  const totalTenants = tenants.length
  const activeTenants = tenants.filter((tenant) => tenant.subscriptionStatus === 'Aktif' || tenant.subscriptionStatus === 'Uji Coba').length
  const monthlyRecurringRevenue = formatCurrency(tenants.reduce((total, tenant) => total + tenant.monthlyFee, 0))
  const storageUsed = tenants.reduce((total, tenant) => total + tenant.storageUsedGb, 0)
  const storageLimit = tenants.reduce((total, tenant) => total + tenant.storageLimitGb, 0)
  const tenantsNeedingSyncReview = tenants.filter((tenant) => tenant.syncStatus === 'Butuh pemeriksaan' || tenant.syncStatus === 'Data menunggu sinkron' || tenant.syncStatus === 'Coba sinkron ulang').length

  return {
    totalTenants,
    activeTenants,
    monthlyRecurringRevenue,
    storageUsed: `${storageUsed} GB / ${storageLimit} GB`,
    tenantsNeedingSyncReview,
  }
}
