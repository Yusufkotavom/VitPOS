import { useEffect, useRef } from 'react'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { runSync } from '@/services/sync/sync-engine'

const SYNC_INTERVAL_MS = 30_000

export function useAutoSync() {
  const setOnline = useSyncStore((s) => s.setOnline)
  const setStatus = useSyncStore((s) => s.setStatus)
  const markSynced = useSyncStore((s) => s.markSynced)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const syncingRef = useRef(false)

  async function triggerSync() {
    if (syncingRef.current) return
    syncingRef.current = true
    setStatus('syncing')

    try {
      const result = await runSync()
      if (result.failed > 0) {
        setStatus('failed')
      } else {
        markSynced()
      }
    } catch {
      setStatus('failed')
    } finally {
      syncingRef.current = false
    }
  }

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      triggerSync()
    }

    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setOnline(navigator.onLine)

    intervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        triggerSync()
      }
    }, SYNC_INTERVAL_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
}
