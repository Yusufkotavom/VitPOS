import { Building2, ChevronsUpDown, ChevronRight, Store, ShoppingCart, Coffee, Monitor, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { sidebarNavigation } from '@/app/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { TenantSwitcher } from '@/features/auth/components/tenant-switcher'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { SyncStatusBadge } from '@/shared/components/sync/sync-status-badge'

const ICONS: Record<string, React.ElementType> = {
  Store,
  ShoppingCart,
  Coffee,
  Monitor,
}

export function AppSidebar() {
  const { t } = useTranslation()
  const syncSummary = useSyncStore()
  const settings = useSettings()
  const { isMobile, setOpenMobile } = useSidebar()
  
  const companyName = settings?.find(s => s.id === 'company-name')?.value || 'KOTACOM'
  const companyLogo = settings?.find(s => s.id === 'company-logo')?.value
  const companyIconId = settings?.find(s => s.id === 'company-icon')?.value
  const CompanyIcon = companyIconId && ICONS[companyIconId] ? ICONS[companyIconId] : Building2

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-1.5 w-full">
              <div className="flex-1 min-w-0">
                <TenantSwitcher
                  trigger={
                    <SidebarMenuButton size="lg" tooltip="Pilih usaha">
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                        {companyLogo ? (
                          <img src={companyLogo} alt={companyName} className="size-full object-cover" />
                        ) : (
                          <CompanyIcon aria-hidden="true" className="size-5" />
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{companyName}</span>
                        <span className="truncate text-xs text-muted-foreground">Klik untuk pindah tenant</span>
                      </div>
                      <ChevronsUpDown aria-hidden="true" className="ml-auto" />
                    </SidebarMenuButton>
                  }
                />
              </div>

              {isMobile && (
                <button
                  type="button"
                  onClick={() => setOpenMobile(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95 transition-all shadow-xs"
                  aria-label="Tutup menu"
                  title="Tutup menu"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarNavigation(t).map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.items?.length) {
                    return (
                      <Collapsible key={item.to} defaultOpen className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label}>
                              <item.icon aria-hidden="true" />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((child) => (
                                <SidebarMenuSubItem key={child.to}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={child.to}
                                      end={['/settings', '/products', '/cash', '/reports'].includes(child.to)}
                                      onClick={() => {
                                        if (isMobile) setOpenMobile(false)
                                      }}
                                    >
                                      <child.icon aria-hidden="true" />
                                      <span>{child.label}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }
                  
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false)
                          }}
                        >
                          <item.icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Store aria-hidden="true" />
              <span>{t('shared.sidebar_main_branch')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <SyncStatusBadge summary={syncSummary} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
