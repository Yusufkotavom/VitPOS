import { ShieldCheck, ServerCog } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { formatCurrency } from '@/lib/format-currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'
import { PageShell } from '@/shared/components/layout/page-shell'
import { getPlatformAdminSummary } from '@/features/platform-admin/lib/platform-admin-summary'
import { platformAdminService, type PlatformTenant } from '@/services/api/platform-admin.service'

function subscriptionTone(status: string) {
  if (status === 'active') return 'success'
  if (status === 'trial') return 'info'
  if (status === 'past_due' || status === 'pending_payment') return 'warning'
  if (status === 'suspended' || status === 'cancelled') return 'danger'
  return 'neutral'
}

function PlatformAdminSummaryCards({ tenants }: { tenants: PlatformTenant[] }) {
  const summary = getPlatformAdminSummary(tenants)

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
        <p className="mt-1 text-sm text-muted-foreground">Akumulasi limit storage tenant</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Tenant perlu review sync</p>
        <p className="mt-2 text-2xl font-semibold">{summary.tenantsNeedingSyncReview}</p>
        <p className="mt-1 text-sm text-muted-foreground">Prioritas tindak lanjut hari ini</p>
      </article>
    </section>
  )
}

function PlatformAdminHealthPanel({ tenants }: { tenants: PlatformTenant[] }) {
  const delayedBilling = tenants.filter((tenant) => tenant.subscriptionStatus === 'past_due')

  return (
    <ContentCard title="Ringkasan health platform" description="Pantau sinkronisasi, billing, dan kapasitas tenant lintas bisnis.">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-3">
            <article className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ServerCog className="text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">All Systems Operational</p>
                    <p className="text-sm text-muted-foreground">Semua tenant terpantau sinkron.</p>
                  </div>
                </div>
              </div>
            </article>
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
  )
}

function PlatformAdminTenantTable({ tenants }: { tenants: PlatformTenant[] }) {
  const { getFee } = getPlatformAdminSummary(tenants)
  return (
    <ContentCard
      title="Daftar tenant dan langganan"
      description="Data tenant, paket, billing, storage, dan status sync untuk tindak lanjut operasional."
      action={<Button variant="outline">Export tenant</Button>}
    >
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
          { key: 'monthlyFee', header: 'Billing / bulan', render: (row) => <span className="font-medium">{getFee(row.packageName) === 0 ? 'Gratis' : formatCurrency(getFee(row.packageName))}</span> },
          { key: 'storage', header: 'Storage Limit', render: (row) => <span>{row.storageLimitGb} GB</span> },
          { key: 'planValidUntil', header: 'Berlaku Sampai', render: (row) => <span>{row.planValidUntil ? format(new Date(row.planValidUntil), 'dd MMM yyyy') : '-'}</span> },
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
            </div>
            <div className="grid gap-1 text-sm">
              <p>Billing: {getFee(row.packageName) === 0 ? 'Gratis' : formatCurrency(getFee(row.packageName))}</p>
              <p>Storage Limit: {row.storageLimitGb} GB</p>
              <p>Berlaku Sampai: {row.planValidUntil ? format(new Date(row.planValidUntil), 'dd MMM yyyy') : '-'}</p>
            </div>
          </div>
        )}
      />
    </ContentCard>
  )
}

export function PlatformAdminPage() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: platformAdminService.getTenants
  })

  if (isLoading) {
    return (
      <PageShell title="Platform Admin" description="Memuat data tenant...">
        <p>Loading...</p>
      </PageShell>
    )
  }

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
      <PlatformAdminSummaryCards tenants={tenants} />
      <PlatformAdminHealthPanel tenants={tenants} />
      <PlatformAdminTenantTable tenants={tenants} />
    </PageShell>
  )
}
