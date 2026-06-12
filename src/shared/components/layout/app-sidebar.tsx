import { Building2, ChevronsUpDown, ChevronRight, Store, ShoppingCart, Coffee, Monitor } from 'lucide-react'
import { NavLink } from 'react-router-dom'

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
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { SyncStatusBadge } from '@/shared/components/sync/sync-status-badge'

const ICONS: Record<string, React.ElementType> = {
  Store,
  ShoppingCart,
  Coffee,
  Monitor,
}

export function AppSidebar() {
  const syncSummary = useSyncStore()
  const settings = useSettings()
  
  const companyName = settings?.find(s => s.id === 'company-name')?.value || 'KOTACOM'
  const companyLogo = settings?.find(s => s.id === 'company-logo')?.value
  const companyIconId = settings?.find(s => s.id === 'company-icon')?.value
  const CompanyIcon = companyIconId && ICONS[companyIconId] ? ICONS[companyIconId] : Building2

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="size-full object-cover" />
                ) : (
                  <CompanyIcon aria-hidden="true" className="size-5" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{companyName}</span>
                <span className="truncate text-xs text-muted-foreground">Business Suite</span>
              </div>
              <ChevronsUpDown aria-hidden="true" className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarNavigation.map((group) => (
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
                                    <NavLink to={child.to} end={['/settings', '/products', '/cash', '/reports'].includes(child.to)}>
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
                        <NavLink to={item.to} end={item.to === '/'}>
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
              <span>Cabang Utama</span>
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
