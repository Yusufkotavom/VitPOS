import { useEffect, useRef } from 'react'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { runSync } from '@/services/sync/sync-engine'
import { apiGet } from '@/services/api/client'

const SYNC_INTERVAL_MS = 30_000
const PING_INTERVAL_MS = 15_000

export function useAutoSync() {
  const setOnline = useSyncStore((s) => s.setOnline)
  const setApiConnected = useSyncStore((s) => s.setApiConnected)
  const setStatus = useSyncStore((s) => s.setStatus)
  const markSynced = useSyncStore((s) => s.markSynced)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
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

    async function checkApiConnection() {
      if (!navigator.onLine) {
        setApiConnected(false)
        return
      }
      try {
        await apiGet('/health')
        setApiConnected(true)
      } catch {
        setApiConnected(false)
      }
    }

    function handleOnline() {
      setOnline(true)
      checkApiConnection()
      triggerSync()
    }

    function handleOffline() {
      setOnline(false)
      setApiConnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setOnline(navigator.onLine)
    checkApiConnection()

    intervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        triggerSync()
      }
    }, SYNC_INTERVAL_MS)

    pingRef.current = setInterval(() => {
      checkApiConnection()
    }, PING_INTERVAL_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (pingRef.current) clearInterval(pingRef.current)
    }
  }, [setOnline, setApiConnected, setStatus, markSynced])
}
