import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { OfflineBanner } from '@/shared/components/sync/offline-banner'

vi.mock('@/shared/providers/refresh-provider', () => ({
  useRefresh: () => ({ isRefreshing: false, refreshAll: vi.fn() }),
}))

describe('OfflineBanner', () => {
  it('shows retry copy', () => {
    render(<OfflineBanner visible />)
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
  })
})
