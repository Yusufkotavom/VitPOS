import { useLocation } from 'react-router-dom'

import { SubscriptionExpiredDialog } from '@/features/billing/components/subscription-expired-dialog'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { useSubscription } from '@/features/settings/hooks/use-subscription'

const WHITELIST_PATHS = ['/settings/billing', '/settings/profile', '/platform-admin']

export function SubscriptionGate() {
  const { warningKind, status, planName, planValidUntil } = useSubscription()
  const activeTenant = useAuthStore((s) => s.activeTenant)
  const location = useLocation()

  const isWhitelisted = WHITELIST_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
  )

  if (!warningKind || isWhitelisted) return null

  return (
    <SubscriptionExpiredDialog
      open
      warningKind={warningKind}
      status={status}
      planName={planName}
      planValidUntil={planValidUntil}
      tenantId={activeTenant?.id}
    />
  )
}
