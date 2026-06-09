import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/stores/auth-store'

export function PlatformAdminGuard({ children }: { children: ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (currentUser.role !== 'platform_admin') {
    return <Navigate to="/" replace />
  }

  return children
}
