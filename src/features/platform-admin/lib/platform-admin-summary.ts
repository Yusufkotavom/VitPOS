import { formatCurrency } from '@/lib/format-currency'
import type { PlatformPlan, PlatformTenant } from '@/services/api/platform-admin.service'

const FALLBACK_FEE: Record<string, number> = {
  free: 0,
  trial: 0,
  starter: 1250000,
  pro: 1490000,
  enterprise: 2700000,
}

export function getPlatformAdminSummary(tenants: PlatformTenant[], plans: PlatformPlan[] = []) {
  const totalTenants = tenants.length
  const activeTenants = tenants.filter((tenant) =>
    tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'trial'
  ).length

  const priceByCode = new Map(plans.map((p) => [p.code, Number(p.monthlyPrice)]))

  const getFee = (pkg: string) => {
    if (priceByCode.has(pkg)) return priceByCode.get(pkg) ?? 0
    return FALLBACK_FEE[pkg] ?? 0
  }

  const monthlyRecurringRevenue = formatCurrency(
    tenants
      .filter((t) => t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trial')
      .reduce((total, tenant) => total + getFee(tenant.packageName), 0)
  )

  const storageUsed = 0
  const storageLimit = tenants.reduce((total, tenant) => total + tenant.storageLimitGb, 0)

  const tenantsNeedingSyncReview = 0

  return {
    totalTenants,
    activeTenants,
    monthlyRecurringRevenue,
    storageUsed: `${storageUsed} GB / ${storageLimit} GB`,
    tenantsNeedingSyncReview,
    getFee,
  }
}
