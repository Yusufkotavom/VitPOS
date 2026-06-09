import { apiGet, apiPost } from './client'

export type SubscriptionPlan = {
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
}

type TenantResponse = {
  id: string
  planCode: string
  billingPeriod?: 'monthly' | 'yearly'
  subscriptionStatus?: string
  planValidUntil?: string | null
  storageLimitMb?: number
  maxBranches?: number
  isActive?: boolean
}

type SubscribeResponse = { ok: boolean; item: TenantResponse }
type CancelResponse = { ok: boolean; item: TenantResponse }

export const subscriptionService = {
  async listPlans(period?: 'monthly' | 'yearly'): Promise<SubscriptionPlan[]> {
    const query = period ? new URLSearchParams({ period }) : undefined
    const res = await apiGet<{ ok: boolean; items: SubscriptionPlan[] }>('/subscription/plans', query)
    return res.items
  },

  async getPlan(code: string): Promise<SubscriptionPlan> {
    const res = await apiGet<{ ok: boolean; item: SubscriptionPlan }>(`/subscription/plans/${code}`)
    return res.item
  },

  async subscribe(input: { tenantId: string; planCode: string; billingPeriod: 'monthly' | 'yearly' }): Promise<SubscribeResponse> {
    return apiPost<SubscribeResponse>(`/subscription/tenants/${input.tenantId}/subscribe`, {
      planCode: input.planCode,
      billingPeriod: input.billingPeriod,
    })
  },

  async cancel(tenantId: string): Promise<CancelResponse> {
    return apiPost<CancelResponse>(`/subscription/tenants/${tenantId}/cancel`, {})
  },
}
