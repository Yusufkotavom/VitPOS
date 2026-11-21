import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InitialSyncScreen } from './initial-sync-screen'

const mockRunSync = vi.fn()

vi.mock('@/services/sync/sync-engine', () => ({
  runSync: () => mockRunSync(),
}))

describe('InitialSyncScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    mockRunSync.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('completes initial sync and calls onDone on success', async () => {
    mockRunSync.mockResolvedValueOnce({ processed: 2, failed: 0, pulled: 5 })
    const onDone = vi.fn()

    render(<InitialSyncScreen onDone={onDone} />)

    expect(screen.getByText('Menyinkronkan data…')).toBeInTheDocument()

    // Wait for the runSync promise to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Should transition to done state
    expect(screen.getByText('Sinkron selesai')).toBeInTheDocument()
    expect(localStorage.getItem('vitpos-initial-sync-done')).toBe('true')

    // Advance past DONE_DELAY_MS (600ms) and FADE_OUT_MS (250ms)
    act(() => {
      vi.advanceTimersByTime(900)
    })

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('clicking Jalankan di Latar immediately persists flag and calls onDone', async () => {
    // Keep sync pending
    mockRunSync.mockImplementation(() => new Promise(() => {}))
    const onDone = vi.fn()

    render(<InitialSyncScreen onDone={onDone} />)

    const skipButton = screen.getByRole('button', { name: /Jalankan di Latar/i })
    expect(skipButton).toBeInTheDocument()

    fireEvent.click(skipButton)

    expect(localStorage.getItem('vitpos-initial-sync-done')).toBe('true')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('automatically finishes and calls onDone when sync times out after max wait', async () => {
    // Hangs indefinitely
    mockRunSync.mockImplementation(() => new Promise(() => {}))
    const onDone = vi.fn()

    render(<InitialSyncScreen onDone={onDone} />)

    // Advance past MAX_INITIAL_SYNC_WAIT_MS (4000ms)
    await act(async () => {
      vi.advanceTimersByTime(4100)
    })

    expect(localStorage.getItem('vitpos-initial-sync-done')).toBe('true')

    // Advance past fade out
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('handles sync error and allows user to click Jalankan di Latar', async () => {
    mockRunSync.mockRejectedValueOnce(new Error('Network error'))
    const onDone = vi.fn()

    render(<InitialSyncScreen onDone={onDone} />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('Gagal terhubung')).toBeInTheDocument()

    const skipButton = screen.getByRole('button', { name: /Jalankan di Latar/i })
    fireEvent.click(skipButton)

    expect(localStorage.getItem('vitpos-initial-sync-done')).toBe('true')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('does not get stuck when parent re-renders during sync', async () => {
    let resolveSync: (val: unknown) => void = () => {}
    mockRunSync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSync = resolve
        }),
    )

    const onDone = vi.fn()
    const { rerender } = render(<InitialSyncScreen onDone={onDone} />)

    // Simulate parent re-render with new function reference
    rerender(<InitialSyncScreen onDone={() => onDone()} />)

    // Resolve the sync
    await act(async () => {
      resolveSync({ processed: 1, failed: 0, pulled: 1 })
    })

    expect(screen.getByText('Sinkron selesai')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(900)
    })

    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
