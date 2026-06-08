import { localDb } from '@/services/local-db/client'
import { createMockConflict } from '@/services/sync/conflict-service'
import { listOutboxItems, updateOutboxStatus } from '@/services/sync/outbox-service'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function runMockSync() {
  const runId = createId('run')
  const startedAt = new Date().toISOString()

  await localDb.syncRuns.put({
    id: runId,
    startedAt,
    status: 'running',
    processed: 0,
    failed: 0,
  })

  const items = await listOutboxItems()
  let processed = 0
  let failed = 0

  for (const [index, item] of items.entries()) {
    if (item.status === 'synced') continue

    await updateOutboxStatus(item.id, 'syncing')

    if ((index + 1) % 7 === 0) {
      await createMockConflict(item.entityId)
      failed += 1
      await updateOutboxStatus(item.id, 'failed', 'Butuh pemeriksaan konflik')
      continue
    }

    if ((index + 1) % 4 === 0) {
      failed += 1
      await updateOutboxStatus(item.id, 'failed', 'Sinkron gagal sekali, coba ulang')
      continue
    }

    processed += 1
    await updateOutboxStatus(item.id, 'synced')
  }

  await localDb.syncRuns.update(runId, {
    finishedAt: new Date().toISOString(),
    status: failed > 0 ? 'failed' : 'success',
    processed,
    failed,
  })

  return { processed, failed }
}
