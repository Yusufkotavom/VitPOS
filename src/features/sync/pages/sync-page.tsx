import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { useSyncConflicts } from '@/features/sync/hooks/use-sync-conflicts'
import { useSyncQueue } from '@/features/sync/hooks/use-sync-queue'
import { useSyncRuns } from '@/features/sync/hooks/use-sync-runs'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { runSync } from '@/services/sync/sync-engine'
import { resolveConflict } from '@/services/sync/conflict-service'
import { localDb } from '@/services/local-db/client'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { type SyncConflict } from '@/services/local-db/schema'

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

const fieldLabels: Record<string, string> = {
  name: 'Nama',
  salePrice: 'Harga Jual',
  price: 'Harga',
  qty: 'Jumlah',
  amount: 'Nominal',
  totalAmount: 'Total',
  total: 'Total',
  invoiceNo: 'No Invoice',
  phone: 'No Telepon',
  email: 'Email',
  note: 'Catatan',
  status: 'Status',
  type: 'Tipe/Jenis',
  code: 'Kode',
  updatedAt: 'Terakhir Diperbarui',
}

function fieldLabel(field: string) {
  return fieldLabels[field] ?? field
}

function formatValue(key: string, val: unknown) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  if (typeof val === 'boolean') return val ? 'Ya' : 'Tidak'
  
  const priceFields = ['salePrice', 'price', 'amount', 'totalAmount', 'total', 'buyPrice']
  if (priceFields.includes(key) && typeof val === 'number') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }
  
  return String(val)
}

function getEntitySummary(type: string, value: unknown) {
  if (!value) return '—'
  if (typeof value === 'string') return value
  
  const v = value as Record<string, unknown>
  switch (type) {
    case 'product':
      return `${v.name ?? 'Produk'} (Rp ${v.salePrice ?? v.price ?? 0})`
    case 'customer':
      return `${v.name ?? 'Pelanggan'} (${v.phone ?? 'No Telepon'})`
    case 'sale':
      return `Penjualan ${v.invoiceNo ?? v.id ?? 'Tanpa Invoice'} (Total: Rp ${v.totalAmount ?? v.total ?? 0})`
    case 'payment':
      return `Pembayaran ${v.paymentMethod ?? 'Tunai'} (Rp ${v.amount ?? 0})`
    case 'stock_movement':
      return `Mutasi Stok: ${v.type ?? ''} (${v.qty ?? 0} pcs)`
    case 'cash':
      return `Kas Masuk/Keluar: Rp ${v.amount ?? 0} (${v.note ?? 'Tanpa Catatan'})`
    case 'purchase':
      return `Pembelian ${v.invoiceNo ?? v.id ?? ''} (Total: Rp ${v.totalAmount ?? 0})`
    default:
      return String(v.name || v.title || v.code || v.id || JSON.stringify(v))
  }
}

function entityLabel(type: string) {
  return labelMap[type] ?? type
}

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: localeID })
}

function getDiffFields(local: unknown, cloud: unknown) {
  const localObj = local && typeof local === 'object' ? (local as Record<string, unknown>) : {}
  const cloudObj = cloud && typeof cloud === 'object' ? (cloud as Record<string, unknown>) : {}
  const allKeys = Array.from(new Set([...Object.keys(localObj), ...Object.keys(cloudObj)]))
  
  // Exclude internal fields that don't need user resolution
  const excludeKeys = ['tenantId', 'id', 'createdAt', 'syncStatus', 'version']
  
  return allKeys
    .filter(key => !excludeKeys.includes(key))
    .map(key => {
      const localVal = localObj[key]
      const cloudVal = cloudObj[key]
      const isDifferent = JSON.stringify(localVal) !== JSON.stringify(cloudVal)
      return {
        key,
        localVal,
        cloudVal,
        isDifferent
      }
    })
}

export function SyncPage() {
  const setStatus = useSyncStore((s) => s.setStatus)
  const markSynced = useSyncStore((s) => s.markSynced)
  const setCounts = useSyncStore((s) => s.setCounts)
  const { items: outbox, pendingCount, failedCount } = useSyncQueue()
  const { conflicts, openCount } = useSyncConflicts()
  const { runs } = useSyncRuns()
  const summary = useSyncStore()

  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null)
  const [showFlushConfirm, setShowFlushConfirm] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)

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

  async function handleResolve(resolution: 'use_local' | 'use_cloud') {
    if (!selectedConflict) return
    try {
      await resolveConflict(selectedConflict.id, resolution)
      setSelectedConflict(null)
    } catch (err) {
      console.error('Failed to resolve conflict:', err)
    }
  }

  async function flushAllData() {
    setIsFlushing(true)
    try {
      await Promise.all([
        localDb.products.clear(),
        localDb.customers.clear(),
        localDb.salesOrders.clear(),
        localDb.salesOrderItems.clear(),
        localDb.payments.clear(),
        localDb.stockMovements.clear(),
        localDb.inventory.clear(),
        localDb.cash.clear(),
        localDb.productCategories.clear(),
        localDb.cashCategories.clear(),
        localDb.settings.clear(),
        localDb.outbox.clear(),
        localDb.syncConflicts.clear(),
        localDb.syncRuns.clear(),
      ])
      
      setCounts({ pendingCount: 0, failedCount: 0, conflictCount: 0 })
      setStatus('synced')
      setShowFlushConfirm(false)
    } catch (err) {
      console.error('Failed to flush cache & local data:', err)
    } finally {
      setIsFlushing(false)
    }
  }

  const diffFields = selectedConflict 
    ? getDiffFields(selectedConflict.localValue, selectedConflict.cloudValue) 
    : []

  return (
    <PageShell
      title="Sinkron Offline"
      description="Pantau antrean sinkronisasi data lokal ke cloud."
      actions={
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => setShowFlushConfirm(true)}
            disabled={summary.status === 'syncing' || isFlushing}
          >
            Kosongkan Data & Cache
          </Button>
          <Button 
            className="w-full sm:w-auto"
            onClick={syncNow} 
            disabled={summary.status === 'syncing' || isFlushing}
          >
            {summary.status === 'syncing' ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          </Button>
        </div>
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
              key: 'entitySummary',
              header: 'Detail Transaksi / Data',
              render: (row) => (
                <span className="font-medium text-xs">
                  {getEntitySummary(row.entityType, row.localValue)}
                </span>
              ),
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
            {
              key: 'actions',
              header: 'Aksi',
              render: (row) => (
                row.status === 'open' ? (
                  <Button variant="outline" size="sm" onClick={() => setSelectedConflict(row)}>
                    Selesaikan
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Selesai ({row.resolution === 'use_local' ? 'Lokal' : row.resolution === 'use_cloud' ? 'Cloud' : 'Gabung'})
                  </span>
                )
              ),
            },
          ]}
          data={conflicts}
          emptyTitle="Tidak ada konflik"
        />
      </ContentCard>

      <ContentCard title="Riwayat Sinkron" description="Log tiap kali sinkronisasi dijalankan.">
        <DataTable
          columns={[
            {
              key: 'startedAt',
              header: 'Mulai',
              render: (row) => fmtDate(row.startedAt),
              sortable: true,
            },
            {
              key: 'finishedAt',
              header: 'Selesai',
              render: (row) => fmtDate(row.finishedAt),
              sortable: true,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => {
                const label = row.status === 'success' ? 'Berhasil' : row.status === 'failed' ? 'Gagal' : 'Berjalan'
                const tone = row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'info'
                return <StatusBadge label={label} tone={tone} />
              },
              sortable: true,
            },
            {
              key: 'processed',
              header: 'Diproses',
            },
            {
              key: 'failed',
              header: 'Gagal',
            },
            {
              key: 'pulled',
              header: 'Diambil',
            },
            {
              key: 'pullSummary',
              header: 'Detail Pull',
              render: (row) => row.pullSummary || '—',
            },
          ]}
          data={runs}
          emptyTitle="Belum ada riwayat sinkron"
        />
      </ContentCard>

      <Sheet open={!!selectedConflict} onOpenChange={(open) => !open && setSelectedConflict(null)}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Penyelesaian Konflik</SheetTitle>
            <SheetDescription>
              Silakan pilih versi data yang ingin disimpan untuk entitas {selectedConflict && entityLabel(selectedConflict.entityType)}.
            </SheetDescription>
          </SheetHeader>

          {selectedConflict && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Identitas Data ({entityLabel(selectedConflict.entityType)})
                </p>
                <p className="mt-1 text-sm font-medium">
                  {getEntitySummary(selectedConflict.entityType, selectedConflict.localValue)}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  ID: {selectedConflict.entityId}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Perbandingan Perubahan Field
                </p>
                <div className="divide-y rounded-lg border bg-background">
                  <div className="grid grid-cols-3 bg-muted/50 p-2 text-xs font-medium text-muted-foreground">
                    <div>Field</div>
                    <div>Data Lokal (Lokal)</div>
                    <div>Data Server (Cloud)</div>
                  </div>
                  {diffFields.map(({ key, localVal, cloudVal, isDifferent }) => (
                    <div 
                      key={key} 
                      className={`grid grid-cols-3 p-2 text-xs items-center ${
                        isDifferent ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200' : ''
                      }`}
                    >
                      <div className="font-medium">{fieldLabel(key)}</div>
                      <div className="truncate pr-1">{formatValue(key, localVal)}</div>
                      <div className="truncate pr-1">{formatValue(key, cloudVal)}</div>
                    </div>
                  ))}
                  {diffFields.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Tidak ada field yang berbeda secara visual.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                <h4 className="font-semibold mb-1">Panduan Memilih:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Gunakan Data Lokal</strong> jika perubahan terakhir Anda di perangkat ini adalah yang paling benar.</li>
                  <li><strong>Gunakan Data Server</strong> jika Anda ingin membatalkan perubahan lokal dan menyinkronkan data dari cloud.</li>
                </ul>
              </div>
            </div>
          )}

          <SheetFooter className="gap-2 sm:gap-0 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedConflict(null)}
            >
              Batal
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 sm:flex-initial"
                onClick={() => handleResolve('use_cloud')}
              >
                Gunakan Data Server (Cloud)
              </Button>
              <Button
                type="button"
                className="flex-1 sm:flex-initial"
                onClick={() => handleResolve('use_local')}
              >
                Gunakan Data Lokal
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={showFlushConfirm} onOpenChange={setShowFlushConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kosongkan Data & Cache Lokal?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tindakan ini akan menghapus seluruh data transaksi lokal (produk, pelanggan, penjualan, mutasi stok, dll), antrean sinkronisasi, konflik, serta log riwayat pada perangkat ini.
              <br /><br />
              <strong className="text-red-600">Perhatian:</strong> Perubahan lokal yang belum tersinkronkan ke server cloud akan hilang secara permanen. Pastikan Anda memiliki koneksi internet setelah ini untuk memuat ulang data terbaru dari cloud.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFlushConfirm(false)}
              disabled={isFlushing}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={flushAllData}
              disabled={isFlushing}
            >
              {isFlushing ? 'Mengosongkan...' : 'Ya, Kosongkan Semua Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}


