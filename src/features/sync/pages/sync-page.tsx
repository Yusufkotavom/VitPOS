import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useSyncConflicts } from '@/features/sync/hooks/use-sync-conflicts'
import { useSyncQueue } from '@/features/sync/hooks/use-sync-queue'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import { runSync } from '@/services/sync/sync-engine'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { PageShell } from '@/shared/components/layout/page-shell'

function statusTone(status: string) {
  if (status === 'synced' || status === 'resolved') return 'success'
  if (status === 'failed' || status === 'open') return 'danger'
  if (status === 'syncing') return 'info'
  return 'warning'
}

export function SyncPage() {
  const isOnline = useSyncStore((s) => s.isOnline)
  const setOnline = useSyncStore((s) => s.setOnline)
  const setStatus = useSyncStore((s) => s.setStatus)
  const markSynced = useSyncStore((s) => s.markSynced)
  const setCounts = useSyncStore((s) => s.setCounts)
  const { items: outbox, pendingCount, failedCount } = useSyncQueue()
  const { conflicts, openCount } = useSyncConflicts()

  useEffect(() => {
    setCounts({ pendingCount, failedCount, conflictCount: openCount })
  }, [failedCount, openCount, pendingCount, setCounts])

  async function addMockQueue() {
    await enqueueOutboxItem({
      entityType: 'sale',
      entityId: crypto.randomUUID(),
      mutationType: 'create',
      payload: { source: 'POS', total: 125000, status: 'Data menunggu sinkron' },
    })
  }

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
      description="Pantau queue, failed sync, conflict, dan status keamanan data cloud."
      actions={
        <>
          <Button variant="outline" onClick={() => setOnline(!isOnline)}>
            {isOnline ? 'Simulasi Offline' : 'Simulasi Online'}
          </Button>
          <Button variant="outline" onClick={addMockQueue}>Buat Data Contoh</Button>
          <Button onClick={syncNow}>Sinkronkan Sekarang</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending Queue</p>
          <p className="mt-3 text-2xl font-semibold">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Failed Queue</p>
          <p className="mt-3 text-2xl font-semibold">{failedCount}</p>
        </div>
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Conflict</p>
          <p className="mt-3 text-2xl font-semibold">{openCount}</p>
        </div>
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Status Jaringan</p>
          <div className="mt-3 flex flex-col gap-2">
            <StatusBadge label={isOnline ? 'Online' : 'Offline Mode'} tone={isOnline ? 'success' : 'warning'} />
            <StatusBadge label={useSyncStore((s) => s.isApiConnected) ? 'API Terhubung' : 'API Terputus'} tone={useSyncStore((s) => s.isApiConnected) ? 'success' : 'danger'} />
          </div>
        </div>
      </div>

      <ContentCard title="Queue Sinkronisasi" description="Data lokal yang belum aman di cloud muncul di sini.">
        {outbox.length === 0 ? (
          <EmptyState title="Semua data sudah aman" description="Tidak ada data menunggu sinkron atau konflik." actionLabel="Buat Data Contoh" />
        ) : (
          <div className="grid gap-3">
            {outbox.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{item.entityType} · {item.mutationType}</p>
                    <p className="text-sm text-muted-foreground">{item.entityId}</p>
                  </div>
                  <StatusBadge label={item.status} tone={statusTone(item.status)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      <ContentCard title="Conflict Resolver" description="Jika cloud dan lokal beda, user pilih data yang benar.">
        {conflicts.length === 0 ? (
          <EmptyState title="Tidak ada konflik" description="Data lokal dan cloud belum punya konflik." />
        ) : (
          <div className="grid gap-3">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{conflict.entityType} · {conflict.reason}</p>
                    <p className="text-sm text-muted-foreground">Butuh pemeriksaan sebelum aman di cloud</p>
                  </div>
                  <StatusBadge label={conflict.status} tone={statusTone(conflict.status)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </PageShell>
  )
}
