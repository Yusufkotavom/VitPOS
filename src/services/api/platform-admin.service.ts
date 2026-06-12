import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api/client'
import type { BillingSettings, SubscriptionEvent, SubscriptionInvoice, SubscriptionPayment } from '@/services/api/subscription.service'

export type PlatformTenant = {
  id: string
  tenantName: string
  ownerName: string | null
  ownerEmail: string | null
  city: string | null
  packageName: string
  subscriptionStatus: string
  planValidUntil: string | null
  storageLimitGb: number
  maxBranches: number
  isActive: boolean
}

export type PlatformTenantMember = {
  id: string
  userId: string | null
  role: string
  isActive: boolean
  name: string | null
  email: string | null
}

export type PlatformTenantDetail = {
  id: string
  name: string
  planCode: string
  subscriptionStatus: string
  planValidUntil: string | null
  storageLimitMb: number
  maxBranches: number
  isActive: boolean
}

export type PlatformPlan = {
  id: string
  code: string
  name: string
  billingPeriod: 'monthly' | 'yearly'
  durationDays: number
  trialDays: number
  monthlyPrice: string
  yearlyPrice: string | null
  storageLimitMb: number
  maxBranches: number
  maxUsers: number
  features: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PlatformUser = {
  id: string
  name: string
  email: string
  role: 'user' | 'platform_admin'
  createdAt: string
  membershipCount: number
}

export type PlatformMembership = {
  id: string
  tenantId: string
  role: string
  isActive: boolean
  tenantName: string | null
}

export type PlatformAuditLog = {
  id: string
  actorId: string
  actorName: string | null
  action: string
  targetType: string
  targetId: string | null
  payload: Record<string, unknown>
  createdAt: string
}

type ListResponse<T> = { ok: boolean; items: T[] }
type ItemResponse<T> = { ok: boolean; item: T }
type TenantDetailResponse = { ok: boolean; item: PlatformTenantDetail; members: PlatformTenantMember[] }
type UserDetailResponse = { ok: boolean; item: PlatformUser; memberships: PlatformMembership[] }
type AuditResponse = { ok: boolean; items: PlatformAuditLog[]; total: number }

export type PlanInput = {
  code: string
  name: string
  billingPeriod: 'monthly' | 'yearly'
  durationDays: number
  trialDays: number
  monthlyPrice: number
  yearlyPrice?: number | null
  storageLimitMb: number
  maxBranches: number
  maxUsers: number
  features?: Record<string, unknown>
  isActive?: boolean
}

export type TenantUpdateInput = {
  planCode?: string
  planValidUntil?: string | null
  storageLimitMb?: number
  maxBranches?: number
  isActive?: boolean
  subscriptionStatus?: 'trial' | 'active' | 'pending_payment' | 'pending_approval' | 'expired' | 'past_due' | 'suspended' | 'cancelled'
}

export const platformAdminService = {
  async getTenants(): Promise<PlatformTenant[]> {
    const res = await apiGet<ListResponse<PlatformTenant>>('/platform/tenants')
    return res.items
  },
  async getTenant(id: string) {
    const res = await apiGet<TenantDetailResponse>(`/platform/tenants/${id}`)
    return res
  },
  async updateTenant(id: string, input: TenantUpdateInput) {
    return apiPatch<ItemResponse<PlatformTenantDetail>>(`/platform/tenants/${id}`, input)
  },
  async suspendTenant(id: string) {
    return apiPost<{ ok: boolean }>(`/platform/tenants/${id}/suspend`, {})
  },
  async reactivateTenant(id: string) {
    return apiPost<{ ok: boolean }>(`/platform/tenants/${id}/reactivate`, {})
  },

  async getPlans(includeInactive = false): Promise<PlatformPlan[]> {
    const query = includeInactive ? '?includeInactive=true' : ''
    const res = await apiGet<ListResponse<PlatformPlan>>(`/platform/plans${query}`)
    return res.items
  },
  async createPlan(input: PlanInput) {
    return apiPost<ItemResponse<PlatformPlan>>('/platform/plans', input)
  },
  async updatePlan(id: string, input: Partial<PlanInput>) {
    return apiPatch<ItemResponse<PlatformPlan>>(`/platform/plans/${id}`, input)
  },
  async deletePlan(id: string) {
    return apiDelete<{ ok: boolean }>(`/platform/plans/${id}`)
  },

  async getUsers(): Promise<PlatformUser[]> {
    const res = await apiGet<ListResponse<PlatformUser>>('/platform/users')
    return res.items
  },
  async getUser(id: string) {
    return apiGet<UserDetailResponse>(`/platform/users/${id}`)
  },
  async updateUser(id: string, input: { role?: 'user' | 'platform_admin' }) {
    return apiPatch<ItemResponse<PlatformUser>>(`/platform/users/${id}`, input)
  },
  async updateMembership(userId: string, memberId: string, input: { role: 'owner' | 'admin' | 'cashier' | 'staff' }) {
    return apiPatch<ItemResponse<PlatformMembership>>(`/platform/users/${userId}/memberships/${memberId}`, input)
  },

  async getAuditLogs(opts: { limit?: number; offset?: number } = {}): Promise<{ items: PlatformAuditLog[]; total: number }> {
    const params = new URLSearchParams()
    if (opts.limit !== undefined) params.set('limit', String(opts.limit))
    if (opts.offset !== undefined) params.set('offset', String(opts.offset))
    const qs = params.toString()
    const res = await apiGet<AuditResponse>(`/platform/audit${qs ? `?${qs}` : ''}`)
    return { items: res.items, total: res.total }
  },

  async listBillingPayments(): Promise<SubscriptionPayment[]> {
    const res = await apiGet<ListResponse<SubscriptionPayment>>('/platform/billing/payments')
    return res.items
  },
  async approveBillingPayment(paymentId: string) {
    return apiPatch<{ ok: boolean; item: { payment: SubscriptionPayment; tenant: PlatformTenantDetail } }>(`/platform/billing/payments/${paymentId}/approve`, {})
  },
  async rejectBillingPayment(paymentId: string, reviewNote: string) {
    return apiPatch<ItemResponse<SubscriptionPayment>>(`/platform/billing/payments/${paymentId}/reject`, { reviewNote })
  },
  async listBillingInvoices(): Promise<SubscriptionInvoice[]> {
    const res = await apiGet<ListResponse<SubscriptionInvoice>>('/platform/billing/invoices')
    return res.items
  },
  async listBillingEvents(): Promise<SubscriptionEvent[]> {
    const res = await apiGet<ListResponse<SubscriptionEvent>>('/platform/billing/events')
    return res.items
  },
  async getBillingSettings(): Promise<BillingSettings | null> {
    const res = await apiGet<{ ok: boolean; item: BillingSettings | null }>('/subscription/billing-settings')
    return res.item
  },
  async updateBillingSettings(input: BillingSettings) {
    return apiPatch<ItemResponse<BillingSettings>>('/platform/billing/settings', input)
  },
}
