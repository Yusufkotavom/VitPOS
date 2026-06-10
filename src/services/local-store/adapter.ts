import type { SyncMutationRecord as OutboxItem } from '@kotacom/shared-contracts/sync'

export type RuntimeTarget = 'web' | 'desktop' | 'mobile'

export type LocalStoreHealth = {
  target: RuntimeTarget
  status: 'ready' | 'unavailable'
  message: string
}

export type { OutboxItem }

export type LocalStoreAdapter = {
  health(): Promise<LocalStoreHealth>
  list<TRecord>(table: string): Promise<TRecord[]>
  get<TRecord>(table: string, id: string): Promise<TRecord | undefined>
  put<TRecord extends { id: string }>(table: string, record: TRecord): Promise<void>
  delete(table: string, id: string): Promise<void>
  enqueueOutbox(item: OutboxItem): Promise<void>
  runInTransaction<T>(scope: () => Promise<T>): Promise<T>
}