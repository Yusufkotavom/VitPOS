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

export type BillingSettings = {
  id?: string
  supportWhatsapp?: string | null
  supportText?: string | null
  supportUrl?: string | null
  paymentInstructions?: string | null
  bankAccounts?: Array<{ bankName: string; accountName: string; accountNumber: string }>
}

export type SubscriptionInvoice = {
  id: string
  tenantId: string
  invoiceNumber: string
  type: 'new_subscription' | 'renewal' | 'upgrade' | 'downgrade' | 'manual_adjustment'
  planCode: string
  billingPeriod: 'monthly' | 'yearly'
  amount: string
  status: 'draft' | 'pending_payment' | 'submitted' | 'paid' | 'cancelled' | 'expired'
  periodStart?: string | null
  periodEnd?: string | null
  dueAt?: string | null
  notes?: string | null
}

export type SubscriptionPayment = {
  id: string
  tenantId: string
  invoiceId: string
  amount: string
  method: 'manual_transfer'
  bankName?: string | null
  accountName?: string | null
  referenceNumber?: string | null
  proofImageUrl?: string | null
  proofText?: string | null
  status: 'submitted' | 'approved' | 'rejected'
  reviewNote?: string | null
}

export type PlanChangeRequest = {
  id: string
  tenantId: string
  fromPlanCode: string
  toPlanCode: string
  changeType: 'upgrade' | 'downgrade' | 'renewal'
  status: 'pending_payment' | 'waiting_approval' | 'approved' | 'rejected' | 'scheduled' | 'applied' | 'cancelled'
  effectiveAt?: string | null
  invoiceId?: string | null
}

export type SubscriptionEvent = {
  id: string
  tenantId: string
  eventType: string
  actorUserId?: string | null
  metadata: Record<string, unknown>
  createdAt: string
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

  async getBillingSettings(): Promise<BillingSettings | null> {
    const res = await apiGet<{ ok: boolean; item: BillingSettings | null }>('/subscription/billing-settings')
    return res.item
  },

  async listInvoices(tenantId: string): Promise<SubscriptionInvoice[]> {
    const res = await apiGet<{ ok: boolean; items: SubscriptionInvoice[] }>(`/subscription/tenants/${tenantId}/invoices`)
    return res.items
  },

  async createInvoice(input: { tenantId: string; type: SubscriptionInvoice['type']; planCode: string; billingPeriod: 'monthly' | 'yearly' }): Promise<SubscriptionInvoice> {
    const res = await apiPost<{ ok: boolean; item: SubscriptionInvoice }>(`/subscription/tenants/${input.tenantId}/invoices`, input)
    return res.item
  },

  async submitPayment(input: { tenantId: string; invoiceId: string; amount: string; bankName?: string; accountName?: string; referenceNumber?: string; proofImageUrl?: string; proofText?: string }): Promise<SubscriptionPayment> {
    const res = await apiPost<{ ok: boolean; item: SubscriptionPayment }>(`/subscription/tenants/${input.tenantId}/payments`, input)
    return res.item
  },

  async changePlan(input: { tenantId: string; toPlanCode: string; changeType: PlanChangeRequest['changeType']; billingPeriod: 'monthly' | 'yearly' }): Promise<PlanChangeRequest> {
    const res = await apiPost<{ ok: boolean; item: PlanChangeRequest }>(`/subscription/tenants/${input.tenantId}/change-plan`, input)
    return res.item
  },

  async listEvents(tenantId: string): Promise<SubscriptionEvent[]> {
    const res = await apiGet<{ ok: boolean; items: SubscriptionEvent[] }>(`/subscription/tenants/${tenantId}/events`)
    return res.items
  },
}
