import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ShieldCheck, ServerCog } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'
import { PageShell } from '@/shared/components/layout/page-shell'

import { formatCurrency } from '@/lib/format-currency'
import { getPlatformAdminSummary } from '@/features/platform-admin/lib/platform-admin-summary'
import {
  platformAdminService,
  type PlatformPlan,
  type PlatformTenant,
  type PlatformUser,
} from '@/services/api/platform-admin.service'

import { PlanFormDialog } from '@/features/platform-admin/components/plan-form-dialog'
import { TenantActionDialog } from '@/features/platform-admin/components/tenant-action-dialog'
import { UserRoleDialog } from '@/features/platform-admin/components/user-role-dialog'
import { AuditLogList } from '@/features/platform-admin/components/audit-log-list'

function subscriptionTone(status: string) {
  if (status === 'active') return 'success'
  if (status === 'trial') return 'info'
  if (status === 'past_due' || status === 'pending_payment') return 'warning'
  if (status === 'suspended' || status === 'cancelled') return 'danger'
  return 'neutral'
}

function OverviewTab({ tenants, plans }: { tenants: PlatformTenant[]; plans: PlatformPlan[] }) {
  const summary = useMemo(() => getPlatformAdminSummary(tenants, plans), [tenants, plans])
  const delayedBilling = tenants.filter((tenant) => tenant.subscriptionStatus === 'past_due')

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Tenant terpantau</p>
          <p className="mt-2 text-2xl font-semibold">{summary.totalTenants}</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary.activeTenants} tenant aktif atau uji coba</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">MRR paket</p>
          <p className="mt-2 text-2xl font-semibold">{summary.monthlyRecurringRevenue}</p>
          <p className="mt-1 text-sm text-muted-foreground">Pendapatan langganan bulan berjalan</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Paket aktif</p>
          <p className="mt-2 text-2xl font-semibold">{plans.filter((p) => p.isActive).length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Jumlah paket langganan yang dijual</p>
        </article>
        <article className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Tagihan tertunda</p>
          <p className="mt-2 text-2xl font-semibold">{delayedBilling.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Tenant past_due perlu follow up</p>
        </article>
      </section>

      <ContentCard title="Ringkasan health platform" description="Pantau billing, kapasitas, dan status paket lintas bisnis.">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <ServerCog className="text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">All Systems Operational</p>
                <p className="text-sm text-muted-foreground">Semua tenant terpantau sinkron.</p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary" />
              <div>
                <h3 className="font-semibold">Billing dan paket</h3>
                <p className="text-sm text-muted-foreground">Tenant tertunda perlu follow up admin finance.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs text-muted-foreground">Tagihan tertunda</p>
                <p className="mt-2 text-2xl font-semibold">{delayedBilling.length}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs text-muted-foreground">Tenant enterprise</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.filter((tenant) => tenant.packageName === 'enterprise').length}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs text-muted-foreground">Uji coba berjalan</p>
                <p className="mt-2 text-2xl font-semibold">{tenants.filter((tenant) => tenant.subscriptionStatus === 'trial').length}</p>
              </div>
            </div>
          </article>
        </div>
      </ContentCard>
    </div>
  )
}

function TenantsTab({ tenants, plans }: { tenants: PlatformTenant[]; plans: PlatformPlan[] }) {
  const queryClient = useQueryClient()
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null)

  const suspendMutation = useMutation({
    mutationFn: (id: string) => platformAdminService.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
      setSelectedTenant(null)
    },
  })
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => platformAdminService.reactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
      setSelectedTenant(null)
    },
  })

  return (
    <>
      <DataTable
        data={tenants}
        columns={[
          {
            key: 'tenantName',
            header: 'Tenant',
            render: (row) => (
              <div className="flex flex-col gap-1">
                <p className="font-medium">{row.tenantName}</p>
                <p className="text-sm text-muted-foreground">{row.ownerName ?? '-'} · {row.city ?? '-'}</p>
              </div>
            ),
          },
          {
            key: 'packageName',
            header: 'Paket',
            render: (row) => (
              <div className="flex flex-col items-start gap-2">
                <span className="capitalize">{row.packageName}</span>
                <StatusBadge label={row.subscriptionStatus} tone={subscriptionTone(row.subscriptionStatus)} />
              </div>
            ),
          },
          { key: 'storage', header: 'Storage', render: (row) => <span>{row.storageLimitGb} GB</span> },
          { key: 'planValidUntil', header: 'Berlaku Sampai', render: (row) => <span>{row.planValidUntil ? format(new Date(row.planValidUntil), 'dd MMM yyyy') : '-'}</span> },
          {
            key: 'isActive',
            header: 'Status',
            render: (row) => (
              <Badge variant={row.isActive ? 'default' : 'destructive'}>
                {row.isActive ? 'Aktif' : 'Non-aktif'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Aksi',
            render: (row) => (
              <Button size="sm" variant="outline" onClick={() => setSelectedTenant(row)}>
                Kelola
              </Button>
            ),
          },
        ]}
        mobileRender={(row) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.tenantName}</p>
                <p className="text-sm text-muted-foreground">{row.ownerName ?? '-'} · {row.city ?? '-'}</p>
              </div>
              <Badge variant="secondary" className="capitalize">{row.packageName}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={row.subscriptionStatus} tone={subscriptionTone(row.subscriptionStatus)} />
              <Badge variant={row.isActive ? 'default' : 'destructive'}>{row.isActive ? 'Aktif' : 'Non-aktif'}</Badge>
            </div>
            <div className="grid gap-1 text-sm">
              <p>Storage: {row.storageLimitGb} GB</p>
              <p>Berlaku Sampai: {row.planValidUntil ? format(new Date(row.planValidUntil), 'dd MMM yyyy') : '-'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedTenant(row)}>Kelola</Button>
          </div>
        )}
      />

      <TenantActionDialog
        tenant={selectedTenant}
        plans={plans}
        onClose={() => setSelectedTenant(null)}
        onSuspend={(id) => suspendMutation.mutate(id)}
        onReactivate={(id) => reactivateMutation.mutate(id)}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['platform-tenants'] })
          setSelectedTenant(null)
        }}
      />
    </>
  )
}

function PlansTab({ plans }: { plans: PlatformPlan[] }) {
  const queryClient = useQueryClient()
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformAdminService.deletePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-plans'] }),
  })

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setEditingPlan(null); setDialogOpen(true) }}>+ Paket baru</Button>
      </div>
      <DataTable
        data={plans}
        columns={[
          { key: 'code', header: 'Kode', render: (row) => <span className="font-mono">{row.code}</span> },
          { key: 'name', header: 'Nama Paket', render: (row) => <span className="font-medium">{row.name}</span> },
          { key: 'monthlyPrice', header: 'Harga / bulan', render: (row) => <span>{Number(row.monthlyPrice) === 0 ? 'Gratis' : formatCurrency(Number(row.monthlyPrice))}</span> },
          { key: 'storageLimitMb', header: 'Storage', render: (row) => <span>{Math.round(row.storageLimitMb / 1024 * 10) / 10} GB</span> },
          { key: 'maxBranches', header: 'Max Cabang' },
          { key: 'maxUsers', header: 'Max User' },
          {
            key: 'isActive',
            header: 'Status',
            render: (row) => <Badge variant={row.isActive ? 'default' : 'outline'}>{row.isActive ? 'Aktif' : 'Non-aktif'}</Badge>,
          },
          {
            key: 'actions',
            header: 'Aksi',
            render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingPlan(row); setDialogOpen(true) }}>Edit</Button>
                {row.isActive && (
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.id)}>Non-aktifkan</Button>
                )}
              </div>
            ),
          },
        ]}
        mobileRender={(row) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{row.name}</span>
              <Badge variant={row.isActive ? 'default' : 'outline'}>{row.isActive ? 'Aktif' : 'Non-aktif'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{row.code}</p>
            <p className="text-sm">{Number(row.monthlyPrice) === 0 ? 'Gratis' : formatCurrency(Number(row.monthlyPrice))} / bulan</p>
            <p className="text-sm">Storage {Math.round(row.storageLimitMb / 1024 * 10) / 10} GB · {row.maxBranches} cabang · {row.maxUsers} user</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditingPlan(row); setDialogOpen(true) }}>Edit</Button>
              {row.isActive && (
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.id)}>Non-aktifkan</Button>
              )}
            </div>
          </div>
        )}
      />

      <PlanFormDialog
        open={dialogOpen}
        plan={editingPlan}
        onClose={() => { setDialogOpen(false); setEditingPlan(null) }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['platform-plans'] })
          setDialogOpen(false)
          setEditingPlan(null)
        }}
      />
    </>
  )
}

function UsersTab({ users }: { users: PlatformUser[] }) {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null)

  return (
    <>
      <DataTable
        data={users}
        columns={[
          {
            key: 'name',
            header: 'User',
            render: (row) => (
              <div className="flex flex-col gap-1">
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (row) => (
              <Badge variant={row.role === 'platform_admin' ? 'default' : 'secondary'}>
                {row.role === 'platform_admin' ? 'Platform Admin' : 'User'}
              </Badge>
            ),
          },
          { key: 'membershipCount', header: 'Membership', render: (row) => <span>{row.membershipCount}</span> },
          { key: 'createdAt', header: 'Terdaftar', render: (row) => <span>{format(new Date(row.createdAt), 'dd MMM yyyy')}</span> },
          {
            key: 'actions',
            header: 'Aksi',
            render: (row) => (
              <Button size="sm" variant="outline" onClick={() => setEditingUser(row)}>Ubah Role</Button>
            ),
          },
        ]}
        mobileRender={(row) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
              </div>
              <Badge variant={row.role === 'platform_admin' ? 'default' : 'secondary'}>
                {row.role === 'platform_admin' ? 'Admin' : 'User'}
              </Badge>
            </div>
            <p className="text-sm">Membership: {row.membershipCount}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(row.createdAt), 'dd MMM yyyy')}</p>
            <Button size="sm" variant="outline" onClick={() => setEditingUser(row)}>Ubah Role</Button>
          </div>
        )}
      />

      <UserRoleDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['platform-users'] })
          setEditingUser(null)
        }}
      />
    </>
  )
}

function AuditTab() {
  return <AuditLogList />
}

export function PlatformAdminPage() {
  const tenantsQuery = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: platformAdminService.getTenants,
  })
  const plansQuery = useQuery({
    queryKey: ['platform-plans'],
    queryFn: () => platformAdminService.getPlans(true),
  })
  const usersQuery = useQuery({
    queryKey: ['platform-users'],
    queryFn: platformAdminService.getUsers,
  })

  const tenants = tenantsQuery.data ?? []
  const plans = plansQuery.data ?? []
  const users = usersQuery.data ?? []

  const isLoading = tenantsQuery.isLoading || plansQuery.isLoading || usersQuery.isLoading

  if (isLoading) {
    return (
      <PageShell title="Platform Admin" description="Memuat data tenant...">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Platform Admin"
      description="Kelola paket, tenant, user, dan audit log lintas bisnis."
    >
      <Tabs defaultValue="overview" className="flex flex-col gap-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="tenants">Tenant</TabsTrigger>
          <TabsTrigger value="plans">Paket</TabsTrigger>
          <TabsTrigger value="users">User</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab tenants={tenants} plans={plans} />
        </TabsContent>
        <TabsContent value="tenants">
          <TenantsTab tenants={tenants} plans={plans} />
        </TabsContent>
        <TabsContent value="plans">
          <PlansTab plans={plans} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab users={users} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
