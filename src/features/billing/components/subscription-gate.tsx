import { useLocation } from 'react-router-dom'

import { useSubscription } from '@/features/settings/hooks/use-subscription'
import { SubscriptionExpiredDialog } from '@/features/billing/components/subscription-expired-dialog'

const WHITELIST_PATHS = ['/settings/billing', '/settings/profile', '/platform-admin']

export function SubscriptionGate() {
  const { isEnforced, status, planName, planValidUntil } = useSubscription()
  const location = useLocation()

  const isWhitelisted = WHITELIST_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
  )

  if (!isEnforced || isWhitelisted) return null

  return (
    <SubscriptionExpiredDialog
      open
      status={status}
      planName={planName}
      planValidUntil={planValidUntil}
    />
  )
}
