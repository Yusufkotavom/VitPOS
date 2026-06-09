import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

export function PlatformAdminGuard({ children }: { children: ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const activeTenant = useAuthStore((s) => s.activeTenant)
  const setActiveTenant = useAuthStore((s) => s.setActiveTenant)
  const location = useLocation()

  useEffect(() => {
    if (activeTenant || !currentUser || currentUser.role !== 'platform_admin') return
    try {
      localDb.tenantMembers
        .where('userId')
        .equals(currentUser.id)
        .toArray()
        .then(async (memberships) => {
          const m = memberships.find((x) => x.isActive)
          if (!m) return
          const tenant = await localDb.tenants.get(m.tenantId)
          if (tenant) setActiveTenant(tenant, m.role)
        })
        .catch(() => {})
    } catch {
      // ignore — dexie may throw synchronously when IndexedDB is unavailable
    }
  }, [activeTenant, currentUser, setActiveTenant])

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (currentUser.role !== 'platform_admin') {
    return <Navigate to="/" replace />
  }

  if (!activeTenant) {
    return null
  }

  return children
}
