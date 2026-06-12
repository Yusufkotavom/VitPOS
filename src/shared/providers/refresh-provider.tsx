import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type RefreshContextValue = {
  isRefreshing: boolean
  lastError: Error | null
  clearError: () => void
  reportError: (error: unknown) => void
  refreshAll: () => Promise<void>
}

const RefreshContext = createContext<RefreshContextValue | null>(null)

export function RefreshProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastError, setLastError] = useState<Error | null>(null)

  const clearError = useCallback(() => setLastError(null), [])
  const reportError = useCallback((error: unknown) => {
    setLastError(error instanceof Error ? error : new Error(String(error)))
  }, [])

  const refreshAll = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ refetchType: 'active' })
      setLastError(null)
    } catch (error) {
      reportError(error)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, queryClient, reportError])

  const value = useMemo(() => ({ isRefreshing, lastError, clearError, reportError, refreshAll }), [isRefreshing, lastError, clearError, reportError, refreshAll])

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (!context) throw new Error('useRefresh must be used within RefreshProvider')
  return context
}
