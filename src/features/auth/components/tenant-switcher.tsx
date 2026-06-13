import type { ReactNode } from 'react'
import { Check, ChevronsUpDown, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import type { LocalTenant } from '@/services/local-db/schema'
import { useLiveQuery } from '@/shared/hooks/use-live-query'

type TenantOption = LocalTenant & {
  role: string
}

type TenantSwitcherProps = {
  trigger: ReactNode
  showManageLink?: boolean
}

export function TenantSwitcher({ trigger, showManageLink = true }: TenantSwitcherProps) {
  const navigate = useNavigate()
  const { currentUser, activeTenant, setActiveTenant } = useAuthStore()

  const tenants = useLiveQuery(async () => {
    if (!currentUser) return [] as TenantOption[]

    const members = await localDb.tenantMembers.where('userId').equals(currentUser.id).toArray()
    const tenantList: TenantOption[] = []

    for (const member of members) {
      const tenant = await localDb.tenants.get(member.tenantId)
      if (tenant && member.isActive) {
        tenantList.push({
          ...tenant,
          role: member.role,
        })
      }
    }

    return tenantList
  }, [currentUser?.id], [])

  async function handleSwitchTenant(tenant: LocalTenant, role: string) {
    localStorage.removeItem('vitpos-initial-sync-done')
    setActiveTenant(tenant, role)

    const existingBranch = await localDb.settings
      .where('tenantId')
      .equals(tenant.id)
      .filter((s) => s.setting === 'default_branch_id')
      .first()

    if (!existingBranch) {
      try {
        const { apiGet } = await import('@/services/api/client')
        const res = await apiGet<{ ok: true; id: string; name: string }>(
          '/tenants/default-branch',
          new URLSearchParams({ tenantId: tenant.id }),
        )

        if (res.ok) {
          await localDb.settings.put({
            id: `${tenant.id}:default-branch-id`,
            tenantId: tenant.id,
            area: 'System',
            setting: 'default_branch_id',
            value: res.id,
            status: 'Lengkap',
            updatedAt: new Date().toISOString(),
          })
        }
      } catch {
        // API optional. Branch resolved on first sync.
      }
    }

    navigate('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Pilih Usaha</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.length === 0 ? (
          <DropdownMenuItem disabled>
            <Store className="size-4" />
            <span>Belum ada tenant</span>
          </DropdownMenuItem>
        ) : (
          tenants.map((tenant) => {
            const active = activeTenant?.id === tenant.id
            return (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => handleSwitchTenant(tenant, tenant.role)}
                className="items-start gap-3 py-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Store className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{tenant.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{tenant.planCode} · {tenant.role}</span>
                </div>
                {active ? <Check className="mt-0.5 size-4 text-primary" /> : null}
              </DropdownMenuItem>
            )
          })
        )}
        {showManageLink ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/tenants')}>
              <ChevronsUpDown className="size-4" />
              <span>Kelola / pindah tenant</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
