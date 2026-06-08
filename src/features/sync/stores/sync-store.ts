import { create } from 'zustand'

import { type SyncHealthStatus, type SyncSummary } from '@/features/sync/types/sync.types'

type SyncStore = SyncSummary & {
  setOnline: (isOnline: boolean) => void
  setStatus: (status: SyncHealthStatus) => void
  markSynced: () => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  isOnline: true,
  status: 'pending',
  pendingCount: 7,
  failedCount: 0,
  conflictCount: 0,
  lastSyncAt: '2026-06-08T08:30:00.000Z',
  setOnline: (isOnline) => set({ isOnline, status: isOnline ? 'pending' : 'offline' }),
  setStatus: (status) => set({ status }),
  markSynced: () =>
    set({
      status: 'synced',
      pendingCount: 0,
      failedCount: 0,
      conflictCount: 0,
      lastSyncAt: new Date().toISOString(),
    }),
}))
