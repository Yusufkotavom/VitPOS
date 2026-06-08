import { Building2 } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { mobileNavigation } from '@/app/navigation'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/shared/components/layout/app-sidebar'
import { OfflineBanner } from '@/shared/components/sync/offline-banner'
import { SyncStatusBadge } from '@/shared/components/sync/sync-status-badge'

export function AppLayout() {
  const syncSummary = useSyncStore()
  const location = useLocation()
  const isPos = location.pathname === '/pos'

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
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">KOTACOM</p>
                  <p className="text-xs text-muted-foreground">Business Suite</p>
                </div>
              </div>
            </div>
            <div className="ml-auto hidden items-center gap-2 md:flex">
              <Button variant="outline">Toko Sumber Rejeki</Button>
              <Button variant="outline">Cabang Utama</Button>
              <NavLink to="/sync">
                <SyncStatusBadge summary={syncSummary} />
              </NavLink>
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)] px-4 py-4 pb-24 lg:px-6 lg:pb-6">
            <div className="mb-4">
              <OfflineBanner visible={!syncSummary.isOnline} />
            </div>
            <Outlet />
          </main>

          {!isPos ? (
            <nav className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-5 border-t bg-background lg:hidden">
              {mobileNavigation.map((item) => (
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
