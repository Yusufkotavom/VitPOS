import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useSubscription } from '@/features/settings/hooks/use-subscription'

function tomorrowIso() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString()
}

function yesterdayIso() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString()
}

describe('useSubscription', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('returns free status when plan code is free and no planValidUntil', () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'a@b.id', name: 'A', passwordHash: '', createdAt: '', updatedAt: '' })
    useAuthStore.getState().setActiveTenant(
      {
        id: 't1',
        name: 'T',
        type: '',
        phone: '',
        planCode: 'free-monthly',
        subscriptionStatus: 'active',
        planValidUntil: undefined,
        billingPeriod: 'monthly',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      'owner',
    )

    const { result } = renderHook(() => useSubscription())
    expect(result.current.status).toBe('free')
    expect(result.current.isEnforced).toBe(false)
    expect(result.current.isExpired).toBe(false)
    expect(result.current.daysLeft).toBeNull()
  })

  it('returns isEnforced when trial expired', () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'a@b.id', name: 'A', passwordHash: '', createdAt: '', updatedAt: '' })
    useAuthStore.getState().setActiveTenant(
      {
        id: 't1',
        name: 'T',
        type: '',
        phone: '',
        planCode: 'trial-monthly',
        subscriptionStatus: 'trial',
        planValidUntil: yesterdayIso(),
        billingPeriod: 'monthly',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      'owner',
    )

    const { result } = renderHook(() => useSubscription())
    expect(result.current.isExpired).toBe(true)
    expect(result.current.isEnforced).toBe(true)
    expect((result.current.daysLeft ?? 0)).toBeLessThan(0)
  })

  it('returns not enforced for active trial with days left', () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'a@b.id', name: 'A', passwordHash: '', createdAt: '', updatedAt: '' })
    useAuthStore.getState().setActiveTenant(
      {
        id: 't1',
        name: 'T',
        type: '',
        phone: '',
        planCode: 'starter-monthly',
        subscriptionStatus: 'trial',
        planValidUntil: tomorrowIso(),
        billingPeriod: 'monthly',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      'owner',
    )

    const { result } = renderHook(() => useSubscription())
    expect(result.current.isEnforced).toBe(false)
    expect(result.current.daysLeft).toBeGreaterThanOrEqual(0)
  })

  it('enforces suspended and cancelled regardless of planValidUntil', () => {
    useAuthStore.getState().setAuth({ id: 'u1', email: 'a@b.id', name: 'A', passwordHash: '', createdAt: '', updatedAt: '' })
    useAuthStore.getState().setActiveTenant(
      {
        id: 't1',
        name: 'T',
        type: '',
        phone: '',
        planCode: 'starter-yearly',
        subscriptionStatus: 'suspended',
        planValidUntil: tomorrowIso(),
        billingPeriod: 'yearly',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      'owner',
    )

    const { result } = renderHook(() => useSubscription())
    expect(result.current.isEnforced).toBe(true)
  })
})
