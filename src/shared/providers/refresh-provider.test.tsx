import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { RefreshProvider, useRefresh } from '@/shared/providers/refresh-provider'

function TestButton() {
  const { isRefreshing, refreshAll } = useRefresh()
  return <button type="button" onClick={() => refreshAll()}>{isRefreshing ? 'Memuat ulang...' : 'Coba lagi'}</button>
}

describe('RefreshProvider', () => {
  it('invalidates active queries when refreshAll is called', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    render(<QueryClientProvider client={queryClient}><RefreshProvider><TestButton /></RefreshProvider></QueryClientProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(invalidateQueries).toHaveBeenCalledWith({ refetchType: 'active' })
  })
})
