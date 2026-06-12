import { useMemo } from 'react'

import { useAuthStore } from '@/features/auth/stores/auth-store'

export type SubscriptionStatus = 'trial' | 'active' | 'pending_payment' | 'pending_approval' | 'expired' | 'past_due' | 'suspended' | 'cancelled' | 'free' | 'unknown'

export type SubscriptionState = {
  planCode: string
  planName: string
  billingPeriod: 'monthly' | 'yearly'
  status: SubscriptionStatus
  planValidUntil: string | null
  daysLeft: number | null
  isExpired: boolean
  isEnforced: boolean
  isExpiringSoon: boolean
  warningKind: 'expiring' | 'expired' | null
}

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  'free-monthly': 'Free',
  'trial-monthly': 'Free Trial',
  'starter-monthly': 'Starter Bulanan',
  'starter-yearly': 'Starter Tahunan',
  'enterprise-monthly': 'Enterprise Bulanan',
  'enterprise-yearly': 'Enterprise Tahunan',
}

function resolveDisplayName(code: string) {
  return PLAN_DISPLAY_NAMES[code] ?? code
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function useSubscription(): SubscriptionState {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useMemo<SubscriptionState>(() => {
    const now = new Date()
    const planCode = activeTenant?.planCode ?? 'free-monthly'
    const billingPeriod = activeTenant?.billingPeriod ?? 'monthly'
    const status = (activeTenant?.subscriptionStatus ?? 'active') as SubscriptionStatus
    const planValidUntil = activeTenant?.planValidUntil ?? null

    const isFreePlan = planCode.startsWith('free')
    const effectiveStatus: SubscriptionStatus = isFreePlan && !planValidUntil ? 'free' : status

    const validUntilDate = planValidUntil ? new Date(planValidUntil) : null
    const isExpired = !!validUntilDate && validUntilDate.getTime() < now.getTime()
    const daysLeft = validUntilDate ? daysBetween(now, validUntilDate) : null
    const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
    const warningKind: 'expiring' | 'expired' | null = daysLeft !== null && daysLeft < 0 ? 'expired' : isExpiringSoon ? 'expiring' : null

    let isEnforced = false
    if (effectiveStatus === 'suspended' || effectiveStatus === 'cancelled') {
      isEnforced = true
    }

    return {
      planCode,
      planName: resolveDisplayName(planCode),
      billingPeriod,
      status: effectiveStatus,
      planValidUntil,
      daysLeft,
      isExpired,
      isEnforced,
      isExpiringSoon,
      warningKind,
    }
  }, [activeTenant])
}
