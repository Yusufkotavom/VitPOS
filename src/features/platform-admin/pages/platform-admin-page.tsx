import { ShieldCheck, ServerCog } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'
import { PageShell } from '@/shared/components/layout/page-shell'
import { getPlatformAdminSummary } from '@/features/platform-admin/lib/platform-admin-summary'
import { platformAdminTenants, type PlatformAdminTenant } from '@/features/platform-admin/mocks/platform-admin-data'

function subscriptionTone(status: PlatformAdminTenant['subscriptionStatus']) {
  if (status === 'Aktif') return 'success'
  if (status === 'Uji Coba') return 'info'
  if (status === 'Tertunda') return 'warning'
  return 'neutral'
}

function syncTone(status: PlatformAdminTenant['syncStatus']) {
  if (status === 'Data sudah aman di cloud') return 'success'
  if (status === 'Data menunggu sinkron') return 'warning'
  if (status === 'Butuh pemeriksaan') return 'danger'
  return 'info'
}

function PlatformAdminSummaryCards() {
  const summary = getPlatformAdminSummary(platformAdminTenants)

  return (
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
        <p className="text-xs text-muted-foreground">Pemakaian storage</p>
        <p className="mt-2 text-2xl font-semibold">{summary.storageUsed}</p>
        <p className="mt-1 text-sm text-muted-foreground">Akumulasi ruang file tenant</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Tenant perlu review sync</p>
        <p className="mt-2 text-2xl font-semibold">{summary.tenantsNeedingSyncReview}</p>
        <p className="mt-1 text-sm text-muted-foreground">Prioritas tindak lanjut hari ini</p>
      </article>
    </section>
  )
}

function PlatformAdminHealthPanel() {
  const pendingTenants = platformAdminTenants.filter((tenant) => tenant.syncStatus !== 'Data sudah aman di cloud')
  const delayedBilling = platformAdminTenants.filter((tenant) => tenant.subscriptionStatus === 'Tertunda')

  return (
    <ContentCard title="Ringkasan health platform" description="Pantau sinkronisasi, billing, dan kapasitas tenant lintas bisnis.">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3">
          {pendingTenants.map((tenant) => (
            <article key={tenant.id} className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ServerCog className="text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{tenant.tenantName}</p>
                    <p className="text-sm text-muted-foreground">{tenant.city} · terakhir sync {tenant.lastSyncAt}</p>
                  </div>
                </div>
                <StatusBadge label={tenant.syncStatus} tone={syncTone(tenant.syncStatus)} />
              </div>
            </article>
          ))}
        </div>
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
              <p className="mt-2 text-2xl font-semibold">{platformAdminTenants.filter((tenant) => tenant.packageName === 'Enterprise').length}</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">Uji coba berjalan</p>
              <p className="mt-2 text-2xl font-semibold">{platformAdminTenants.filter((tenant) => tenant.subscriptionStatus === 'Uji Coba').length}</p>
            </div>
          </div>
        </article>
      </div>
    </ContentCard>
  )
}

function PlatformAdminTenantTable() {
  return (
    <ContentCard
      title="Daftar tenant dan langganan"
      description="Data tenant, paket, billing, storage, dan status sync untuk tindak lanjut operasional."
      action={<Button variant="outline">Export tenant</Button>}
    >
      <DataTable
        data={platformAdminTenants}
        columns={[
          {
            key: 'tenantName',
            header: 'Tenant',
            render: (row) => (
              <div className="flex flex-col gap-1">
                <p className="font-medium">{row.tenantName}</p>
                <p className="text-sm text-muted-foreground">{row.ownerName} · {row.city}</p>
              </div>
            ),
          },
          {
            key: 'packageName',
            header: 'Paket',
            render: (row) => (
              <div className="flex flex-col gap-2">
                <span>{row.packageName}</span>
                <StatusBadge label={row.subscriptionStatus} tone={subscriptionTone(row.subscriptionStatus)} />
              </div>
            ),
          },
          { key: 'monthlyFee', header: 'Billing / bulan', render: (row) => <span className="font-medium">{row.monthlyFee === 0 ? 'Gratis' : getPlatformAdminSummary([row]).monthlyRecurringRevenue}</span> },
          { key: 'storage', header: 'Storage', render: (row) => <span>{row.storageUsedGb} GB / {row.storageLimitGb} GB</span> },
          { key: 'syncStatus', header: 'Sync health', render: (row) => <StatusBadge label={row.syncStatus} tone={syncTone(row.syncStatus)} /> },
          { key: 'lastSyncAt', header: 'Sync terakhir' },
        ]}
        mobileRender={(row) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.tenantName}</p>
                <p className="text-sm text-muted-foreground">{row.ownerName} · {row.city}</p>
              </div>
              <Badge variant="secondary">{row.packageName}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={row.subscriptionStatus} tone={subscriptionTone(row.subscriptionStatus)} />
              <StatusBadge label={row.syncStatus} tone={syncTone(row.syncStatus)} />
            </div>
            <div className="grid gap-1 text-sm">
              <p>Billing: {row.monthlyFee === 0 ? 'Gratis' : getPlatformAdminSummary([row]).monthlyRecurringRevenue}</p>
              <p>Storage: {row.storageUsedGb} GB / {row.storageLimitGb} GB</p>
              <p>Sync terakhir: {row.lastSyncAt}</p>
            </div>
          </div>
        )}
      />
    </ContentCard>
  )
}

export function PlatformAdminPage() {
  return (
    <PageShell
      title="Platform Admin"
      description="Tenant, paket, langganan, billing, storage, dan sync health lintas bisnis dalam satu panel operasional."
      actions={
        <>
          <Button variant="outline">Audit storage</Button>
          <Button>Buat tenant</Button>
        </>
      }
    >
      <PlatformAdminSummaryCards />
      <PlatformAdminHealthPanel />
      <PlatformAdminTenantTable />
    </PageShell>
  )
}
