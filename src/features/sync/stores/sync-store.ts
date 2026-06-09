import { create } from 'zustand'

import { type SyncHealthStatus, type SyncSummary } from '@/features/sync/types/sync.types'

type SyncStore = SyncSummary & {
  setOnline: (isOnline: boolean) => void
  setApiConnected: (isApiConnected: boolean) => void
  setStatus: (status: SyncHealthStatus) => void
  setCounts: (counts: Pick<SyncSummary, 'pendingCount' | 'failedCount' | 'conflictCount'>) => void
  markSynced: () => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  isOnline: true,
  isApiConnected: true,
  status: 'pending',
  pendingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set((state) => {
    const nextStatus = isOnline ? 'pending' : 'offline'
    if (state.isOnline === isOnline && state.status === nextStatus) return state
    return { isOnline, status: nextStatus }
  }),
  setApiConnected: (isApiConnected) => set((state) => (state.isApiConnected === isApiConnected ? state : { isApiConnected })),
  setStatus: (status) => set((state) => (state.status === status ? state : { status })),
  setCounts: (counts) => set((state) => {
    if (
      state.pendingCount === counts.pendingCount
      && state.failedCount === counts.failedCount
      && state.conflictCount === counts.conflictCount
    ) {
      return state
    }

    return counts
  }),
  markSynced: () =>
    set({
      status: 'synced',
      pendingCount: 0,
      failedCount: 0,
      conflictCount: 0,
      lastSyncAt: new Date().toISOString(),
    }),
}))
