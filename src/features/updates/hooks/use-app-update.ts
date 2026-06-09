import { useEffect, useState } from 'react'

import { fetchLatestUpdate, isVersionNewer, type AvailableUpdate } from '@/features/updates/lib/github-release'
import { getRuntimeVersion } from '@/features/updates/lib/update-runtime'

type UpdateState = {
  currentVersion: string
  latest: AvailableUpdate | null
  hasUpdate: boolean
  loading: boolean
  error: string | null
  checkedAt: string | null
  refresh: () => Promise<void>
}

export function useAppUpdate(): UpdateState {
  const [currentVersion, setCurrentVersion] = useState(__APP_VERSION__)
  const [latest, setLatest] = useState<AvailableUpdate | null>(null)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)

    try {
      const [runtimeVersion, latestRelease] = await Promise.all([
        getRuntimeVersion(),
        fetchLatestUpdate(),
      ])

      setCurrentVersion(runtimeVersion)
      setLatest(latestRelease)
      setHasUpdate(isVersionNewer(runtimeVersion, latestRelease.version))
      setCheckedAt(new Date().toISOString())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Gagal memeriksa update')
      setCheckedAt(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  return {
    currentVersion,
    latest,
    hasUpdate,
    loading,
    error,
    checkedAt,
    refresh,
  }
}
