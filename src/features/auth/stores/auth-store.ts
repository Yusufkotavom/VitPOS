import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { LocalTenant, LocalUser } from '@/services/local-db/schema'

export type AuthTenant = LocalTenant & {
  role: string
}

type AuthState = {
  currentUser: LocalUser | null
  activeTenant: AuthTenant | null
  setAuth: (user: LocalUser) => void
  setActiveTenant: (tenant: LocalTenant, role: string) => void
  isAuthenticated: () => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      activeTenant: null,
      setAuth: (user) => set({ currentUser: user }),
      setActiveTenant: (tenant, role) => set({ activeTenant: { ...tenant, role } }),
      isAuthenticated: () => get().currentUser !== null,
      logout: () => set({ currentUser: null, activeTenant: null }),
    }),
    {
      name: 'kotacom-auth-store',
    },
  ),
)

export function getActiveTenantId() {
  return useAuthStore.getState().activeTenant?.id ?? null
}

export function requireActiveTenantId() {
  const tenantId = getActiveTenantId()
  if (!tenantId) {
    throw new Error('Tenant aktif wajib dipilih')
  }
  return tenantId
}

export function resolveTenantId(baseTenantId?: string) {
  return baseTenantId ?? getActiveTenantId() ?? 'tenant-test'
}
