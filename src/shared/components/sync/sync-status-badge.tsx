import { CloudAlert, CloudCog, CloudOff, CloudUpload } from 'lucide-react'

import { type SyncSummary } from '@/features/sync/types/sync.types'
import { StatusBadge } from '@/shared/components/display/status-badge'

function getLabel(summary: SyncSummary) {
  if (!summary.isOnline) return { label: 'Data menunggu sinkron', tone: 'warning' as const, icon: CloudOff }
  if (summary.conflictCount > 0) return { label: 'Butuh pemeriksaan', tone: 'danger' as const, icon: CloudAlert }
  if (summary.failedCount > 0) return { label: 'Coba sinkron ulang', tone: 'danger' as const, icon: CloudAlert }
  if (summary.status === 'syncing') return { label: 'Menyinkronkan data', tone: 'info' as const, icon: CloudCog }
  if (summary.pendingCount > 0) return { label: 'Data menunggu sinkron', tone: 'warning' as const, icon: CloudUpload }
  return { label: 'Data sudah aman di cloud', tone: 'success' as const, icon: CloudUpload }
}

export function SyncStatusBadge({ summary }: { summary: SyncSummary }) {
  const state = getLabel(summary)
  const Icon = state.icon

  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <StatusBadge label={state.label} tone={state.tone} />
    </div>
  )
}
