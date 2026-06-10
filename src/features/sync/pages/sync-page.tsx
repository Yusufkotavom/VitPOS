import { useEffect } from 'react'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { useSyncConflicts } from '@/features/sync/hooks/use-sync-conflicts'
import { useSyncQueue } from '@/features/sync/hooks/use-sync-queue'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { runSync } from '@/services/sync/sync-engine'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function statusTone(status: string) {
  if (status === 'synced' || status === 'resolved') return 'success'
  if (status === 'failed' || status === 'open') return 'danger'
  if (status === 'syncing') return 'info'
  return 'warning'
}

const labelMap: Record<string, string> = {
  product: 'Produk',
  customer: 'Pelanggan',
  sale: 'Penjualan',
  payment: 'Pembayaran',
  stock_movement: 'Mutasi Stok',
  cash: 'Kas',
  cash_category: 'Kategori Kas',
  setting: 'Pengaturan',
  shift: 'Shift',
  product_category: 'Kategori Produk',
  supplier: 'Supplier',
  purchase: 'Pembelian',
  return: 'Retur',
  service_order: 'Service Order',
  payment_method: 'Metode Bayar',
  recipe: 'Resep',
}

function entityLabel(type: string) {
  return labelMap[type] ?? type
}

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: localeID })
}

export function SyncPage() {
  const setStatus = useSyncStore((s) => s.setStatus)
  const markSynced = useSyncStore((s) => s.markSynced)
  const setCounts = useSyncStore((s) => s.setCounts)
  const { items: outbox, pendingCount, failedCount } = useSyncQueue()
  const { conflicts, openCount } = useSyncConflicts()
  const summary = useSyncStore()

  useEffect(() => {
    setCounts({ pendingCount, failedCount, conflictCount: openCount })
  }, [failedCount, openCount, pendingCount, setCounts])

  async function syncNow() {
    setStatus('syncing')
    const result = await runSync()
    if (result.failed > 0) {
      setStatus(openCount > 0 ? 'conflict' : 'failed')
      return
    }
    markSynced()
  }

  return (
    <PageShell
      title="Sinkron Offline"
      description="Pantau antrean sinkronisasi data lokal ke cloud."
      actions={
        <Button onClick={syncNow} disabled={summary.status === 'syncing'}>
          {summary.status === 'syncing' ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Antrean</p>
          <p className="mt-3 text-2xl font-semibold">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Gagal</p>
          <p className="mt-3 text-2xl font-semibold">{failedCount}</p>
        </div>
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Konflik</p>
          <p className="mt-3 text-2xl font-semibold">{openCount}</p>
        </div>
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Jaringan</p>
          <div className="mt-3 flex flex-col gap-2">
            <StatusBadge
              label={summary.isOnline ? 'Online' : 'Offline'}
              tone={summary.isOnline ? 'success' : 'warning'}
            />
            <StatusBadge
              label={summary.isApiConnected ? 'API Terhubung' : 'API Terputus'}
              tone={summary.isApiConnected ? 'success' : 'danger'}
            />
          </div>
        </div>
      </div>

      <ContentCard title="Antrean Sinkron" description="Data lokal yang belum dikirim ke cloud.">
        <DataTable
          columns={[
            {
              key: 'entityType',
              header: 'Entitas',
              render: (row) => entityLabel(row.entityType),
              sortable: true,
            },
            {
              key: 'mutationType',
              header: 'Aksi',
              sortable: true,
            },
            {
              key: 'entityId',
              header: 'ID',
              render: (row) => (
                <span className="font-mono text-xs text-muted-foreground">{row.entityId.slice(0, 8)}…</span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} />,
              sortable: true,
            },
            {
              key: 'errorMessage',
              header: 'Error',
              render: (row) =>
                row.errorMessage ? (
                  <span className="max-w-[240px] truncate text-xs text-red-600" title={row.errorMessage}>
                    {row.errorMessage}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                ),
            },
            {
              key: 'attempts',
              header: 'Coba',
            },
            {
              key: 'createdAt',
              header: 'Dibuat',
              render: (row) => fmtDate(row.createdAt),
              sortable: true,
            },
          ]}
          data={outbox}
          mobileRender={(row) => (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">{entityLabel(row.entityType)} &middot; {row.mutationType}</p>
                <p className="text-xs text-muted-foreground">ID: {row.entityId.slice(0, 12)}…</p>
                {row.errorMessage && (
                  <p className="max-w-[200px] truncate text-xs text-red-600" title={row.errorMessage}>
                    {row.errorMessage}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{fmtDate(row.createdAt)}</p>
              </div>
              <StatusBadge label={row.status} tone={statusTone(row.status)} />
            </div>
          )}
        />
      </ContentCard>

      <ContentCard title="Konflik" description="Data yang perlu diperiksa karena berbeda antara lokal dan cloud.">
        <DataTable
          columns={[
            {
              key: 'entityType',
              header: 'Entitas',
              render: (row) => entityLabel(row.entityType),
              sortable: true,
            },
            {
              key: 'reason',
              header: 'Alasan',
              render: (row) => {
                const reasonLabel: Record<string, string> = {
                  version_mismatch: 'Versi berbeda',
                  deleted_remotely: 'Dihapus di cloud',
                  field_conflict: 'Konflik field',
                }
                return reasonLabel[row.reason] ?? row.reason
              },
              sortable: true,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge label={row.status === 'open' ? 'Butuh diperiksa' : 'Selesai'} tone={row.status === 'open' ? 'danger' : 'success'} />,
              sortable: true,
            },
            {
              key: 'createdAt',
              header: 'Dibuat',
              render: (row) => fmtDate(row.createdAt),
              sortable: true,
            },
          ]}
          data={conflicts}
          emptyTitle="Tidak ada konflik"
          mobileRender={(row) => (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium">{entityLabel(row.entityType)}</p>
                <p className="text-xs text-muted-foreground">{row.reason}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(row.createdAt)}</p>
              </div>
              <StatusBadge label={row.status === 'open' ? 'Butuh diperiksa' : 'Selesai'} tone={row.status === 'open' ? 'danger' : 'success'} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
