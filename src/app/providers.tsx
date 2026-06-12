import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type PropsWithChildren, useEffect } from 'react'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/components/ui/tooltip'
import { UpdateAnnouncer } from '@/features/updates/components/update-announcer'
import { bootstrapLocalDb } from '@/services/local-db/bootstrap'
import { isCapacitorRuntime } from '@/features/updates/lib/update-runtime'
import { RefreshProvider } from '@/shared/providers/refresh-provider'

import { ThemeProvider } from '@/components/theme-provider'
import '@/lib/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void bootstrapLocalDb()
  }, [])

  useEffect(() => {
    if (!isCapacitorRuntime()) return

    let cleanup: (() => void) | undefined

    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back()
        }
      })

      cleanup = () => {
        App.removeAllListeners()
      }
    })

    return () => cleanup?.()
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="vitpos-theme">
      <QueryClientProvider client={queryClient}>
        <RefreshProvider>
          <TooltipProvider>
            {children}
            <UpdateAnnouncer />
            <Toaster richColors closeButton position="top-right" />
          </TooltipProvider>
        </RefreshProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
