import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth-store'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser, activeTenant } = useAuthStore()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isSetupRoute = location.pathname === '/tenants' || location.pathname === '/onboarding'

  if (!activeTenant && !isSetupRoute) {
    return <Navigate to="/tenants" replace />
  }

  return children
}
