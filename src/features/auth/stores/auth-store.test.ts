import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/stores/auth-store'

describe('auth store', () => {
  it('persists currentUser and activeTenant', () => {
    const store = useAuthStore.getState()
    expect(store.currentUser).toBeNull()
    expect(store.activeTenant).toBeNull()
    expect(store.isAuthenticated()).toBe(false)

    store.setAuth({ id: 'u1', email: 'test@local', name: 'Tester', passwordHash: 'hash', createdAt: '', updatedAt: '' })
    expect(useAuthStore.getState().currentUser?.id).toBe('u1')
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)

    store.setActiveTenant({ id: 't1', name: 'Tenant 1', type: 'Retail', phone: '', planCode: '', isActive: true, createdAt: '', updatedAt: '' }, 'owner')
    expect(useAuthStore.getState().activeTenant?.id).toBe('t1')

    store.logout()
    expect(useAuthStore.getState().currentUser).toBeNull()
    expect(useAuthStore.getState().activeTenant).toBeNull()
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })
})
