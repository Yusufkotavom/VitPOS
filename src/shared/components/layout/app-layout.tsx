import { useState } from 'react'
import { Building2, Store, ShoppingCart, Coffee, Monitor } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { mobileNavigation } from '@/app/navigation'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAutoSync } from '@/features/sync/hooks/use-auto-sync'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { SubscriptionGate } from '@/features/billing/components/subscription-gate'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/shared/components/layout/app-sidebar'
import { OfflineBanner } from '@/shared/components/sync/offline-banner'
import { InitialSyncScreen } from '@/shared/components/sync/initial-sync-screen'
import { SyncIndicator } from '@/shared/components/sync/sync-indicator'
import { ThemeToggle } from '@/shared/components/nav/theme-toggle'
import { UserMenu } from '@/shared/components/nav/user-menu'

const ICONS: Record<string, React.ElementType> = {
  Store,
  ShoppingCart,
  Coffee,
  Monitor,
}

export function AppLayout() {
  const { t } = useTranslation()
  const [initialSyncDone, setInitialSyncDone] = useState(
    () => localStorage.getItem('vitpos-initial-sync-done') === 'true',
  )

  useAutoSync()
  const syncSummary = useSyncStore()
  const settings = useSettings()
  const location = useLocation()

  if (!initialSyncDone) {
    return <InitialSyncScreen onDone={() => setInitialSyncDone(true)} />
  }
  const isPos = location.pathname === '/pos'
  const hideMobileNavigation = isPos || location.pathname === '/service-orders/create'

  const companyName = settings?.find(s => s.id === 'company-name')?.value || 'KOTACOM'
  const companyLogo = settings?.find(s => s.id === 'company-logo')?.value
  const companyIconId = settings?.find(s => s.id === 'company-icon')?.value
  const CompanyIcon = companyIconId && ICONS[companyIconId] ? ICONS[companyIconId] : Building2

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-muted/30 text-foreground">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <SidebarTrigger />
            </div>
            <div className="lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                  {companyLogo ? (
                    <img src={companyLogo} alt={companyName} className="size-full object-cover" />
                  ) : (
                    <CompanyIcon className="size-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{companyName}</p>
                  <p className="text-xs text-muted-foreground">{t('shared.sidebar_business_suite')}</p>
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SyncIndicator summary={syncSummary} />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)] px-4 py-4 pb-24 lg:px-6 lg:pb-6">
            <div className="mb-4">
              <OfflineBanner visible={!syncSummary.isOnline} />
            </div>
            <SubscriptionGate />
            <Outlet />
          </main>

          {!hideMobileNavigation ? (
            <nav className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-5 border-t bg-background lg:hidden">
              {mobileNavigation(t).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground',
                      isActive && 'text-primary',
                    )
                  }
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
