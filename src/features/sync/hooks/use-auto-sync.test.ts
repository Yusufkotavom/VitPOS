import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoSync } from './use-auto-sync'

const mockRunSync = vi.fn()
const mockApiGet = vi.fn()

vi.mock('@/services/sync/sync-engine', () => ({
  runSync: () => mockRunSync(),
}))

vi.mock('@/services/api/client', () => ({
  apiGet: () => mockApiGet(),
}))

describe('useAutoSync', () => {
  beforeEach(() => {
    mockRunSync.mockReset()
    mockApiGet.mockReset()
    mockApiGet.mockResolvedValue({ ok: true })
    mockRunSync.mockResolvedValue({ processed: 0, failed: 0, pulled: 0 })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('does not trigger sync when enabled is false', () => {
    renderHook(() => useAutoSync({ enabled: false }))
    expect(mockRunSync).not.toHaveBeenCalled()
  })

  it('triggers sync when enabled is true and online', () => {
    renderHook(() => useAutoSync({ enabled: true }))
    expect(mockRunSync).toHaveBeenCalledTimes(1)
  })
})
