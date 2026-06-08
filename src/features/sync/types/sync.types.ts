export type SyncHealthStatus = 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict' | 'offline'

export type SyncSummary = {
  isOnline: boolean
  status: SyncHealthStatus
  pendingCount: number
  failedCount: number
  conflictCount: number
  lastSyncAt: string | null
}
