import { create } from 'zustand'

import { type SyncHealthStatus, type SyncSummary } from '@/features/sync/types/sync.types'

type SyncStore = SyncSummary & {
  setOnline: (isOnline: boolean) => void
  setStatus: (status: SyncHealthStatus) => void
  setCounts: (counts: Pick<SyncSummary, 'pendingCount' | 'failedCount' | 'conflictCount'>) => void
  markSynced: () => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  isOnline: true,
  status: 'pending',
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline, status: isOnline ? 'pending' : 'offline' }),
  setStatus: (status) => set({ status }),
  setCounts: (counts) => set(counts),
  markSynced: () =>
    set({
      status: 'synced',
      pendingCount: 0,
      failedCount: 0,
      conflictCount: 0,
      lastSyncAt: new Date().toISOString(),
    }),
}))
