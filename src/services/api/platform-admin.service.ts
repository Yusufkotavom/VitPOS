import { apiGet } from '@/services/api/client'

export type PlatformTenant = {
  id: string
  tenantName: string
  ownerName: string | null
  city: string | null
  packageName: string
  subscriptionStatus: string
  planValidUntil: string | null
  storageLimitGb: number
  isActive: boolean
}

export const platformAdminService = {
  async getTenants(): Promise<PlatformTenant[]> {
    const res = await apiGet<{ ok: boolean, items: PlatformTenant[] }>('/platform/tenants')
    return res.items
  }
}
