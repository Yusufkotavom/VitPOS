# Android Refresh UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Android-friendly retry UX: global refresh provider, pull-to-refresh gesture, app error dialog, and real retry action in offline banner.

**Architecture:** Implement one small refresh context that invalidates TanStack Query active data and exposes `refreshAll()`. Add UI wrappers in app layout so mobile users can pull down to refresh, while error/offline states get explicit retry buttons.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, Vitest, Testing Library, shadcn/ui

---

## File Map

### Create

- `src/shared/providers/refresh-provider.tsx`
  - Global refresh context and hook.
- `src/shared/providers/refresh-provider.test.tsx`
  - Unit test for provider behavior.
- `src/shared/components/feedback/pull-to-refresh.tsx`
  - Touch gesture wrapper for mobile pull-to-refresh.
- `src/shared/components/feedback/pull-to-refresh.test.tsx`
  - Interaction tests for gesture state.
- `src/shared/components/feedback/app-error-dialog.tsx`
  - Dialog with retry and hard reload actions.
- `src/shared/components/feedback/app-error-dialog.test.tsx`
  - Dialog action tests.

### Modify

- `src/app/providers.tsx`
  - Wrap app in `RefreshProvider` inside `QueryClientProvider`.
- `src/shared/components/layout/app-layout.tsx`
  - Wrap main content with `PullToRefresh` and mount `AppErrorDialog` when needed.
- `src/shared/components/sync/offline-banner.tsx`
  - Replace inert CTA with real retry button using `useRefresh()`.

## Task 1: Add RefreshProvider

**Files:**
- Create: `src/shared/providers/refresh-provider.tsx`
- Create: `src/shared/providers/refresh-provider.test.tsx`
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: Write failing provider test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { RefreshProvider, useRefresh } from '@/shared/providers/refresh-provider'

function TestButton() {
  const { isRefreshing, refreshAll } = useRefresh()

  return (
    <button type="button" onClick={() => refreshAll()}>
      {isRefreshing ? 'Memuat ulang...' : 'Coba lagi'}
    </button>
  )
}

describe('RefreshProvider', () => {
  it('invalidates active queries when refreshAll is called', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    render(
      <QueryClientProvider client={queryClient}>
        <RefreshProvider>
          <TestButton />
        </RefreshProvider>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(invalidateQueries).toHaveBeenCalledWith({ refetchType: 'active' })
  })
})
```

- [ ] **Step 2: Run failing test**

Run: `npm run test -- src/shared/providers/refresh-provider.test.tsx`
Expected: FAIL with missing `refresh-provider` module.

- [ ] **Step 3: Implement provider**

```tsx
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

  const value = useMemo(
    () => ({ isRefreshing, lastError, clearError, reportError, refreshAll }),
    [isRefreshing, lastError, clearError, reportError, refreshAll],
  )

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (!context) throw new Error('useRefresh must be used within RefreshProvider')
  return context
}
```

- [ ] **Step 4: Wrap app providers**

In `src/app/providers.tsx`, wrap existing app content inside `RefreshProvider` under `QueryClientProvider`:

```tsx
<QueryClientProvider client={queryClient}>
  <RefreshProvider>{children}</RefreshProvider>
</QueryClientProvider>
```

Add import:

```ts
import { RefreshProvider } from '@/shared/providers/refresh-provider'
```

- [ ] **Step 5: Verify provider test**

Run: `npm run test -- src/shared/providers/refresh-provider.test.tsx`
Expected: PASS.

## Task 2: Add AppErrorDialog

**Files:**
- Create: `src/shared/components/feedback/app-error-dialog.tsx`
- Create: `src/shared/components/feedback/app-error-dialog.test.tsx`

- [ ] **Step 1: Write failing dialog test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppErrorDialog } from '@/shared/components/feedback/app-error-dialog'

describe('AppErrorDialog', () => {
  it('calls retry action from Coba Lagi', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<AppErrorDialog open error={new Error('Network failed')} isRetrying={false} onOpenChange={() => {}} onRetry={onRetry} />)

    expect(screen.getByText('Ada kendala memuat data')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }))

    expect(onRetry).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run failing test**

Run: `npm run test -- src/shared/components/feedback/app-error-dialog.test.tsx`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement dialog**

```tsx
import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function AppErrorDialog({
  open,
  error,
  isRetrying,
  onOpenChange,
  onRetry,
}: {
  open: boolean
  error: Error | null
  isRetrying: boolean
  onOpenChange: (open: boolean) => void
  onRetry: () => void | Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>Ada kendala memuat data</DialogTitle>
          <DialogDescription>
            Periksa koneksi, lalu coba muat ulang.{error?.message ? ` Detail: ${error.message}` : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Muat Ulang Aplikasi
          </Button>
          <Button type="button" onClick={onRetry} disabled={isRetrying}>
            <RotateCcw className={`mr-2 size-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Memuat ulang...' : 'Coba Lagi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Verify dialog test**

Run: `npm run test -- src/shared/components/feedback/app-error-dialog.test.tsx`
Expected: PASS.

## Task 3: Add PullToRefresh

**Files:**
- Create: `src/shared/components/feedback/pull-to-refresh.tsx`
- Create: `src/shared/components/feedback/pull-to-refresh.test.tsx`

- [ ] **Step 1: Write failing gesture test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PullToRefresh } from '@/shared/components/feedback/pull-to-refresh'

describe('PullToRefresh', () => {
  it('calls onRefresh when user pulls down past threshold', () => {
    const onRefresh = vi.fn()

    render(
      <PullToRefresh onRefresh={onRefresh} isRefreshing={false}>
        <div>Konten</div>
      </PullToRefresh>,
    )

    const wrapper = screen.getByTestId('pull-to-refresh')
    fireEvent.touchStart(wrapper, { touches: [{ clientY: 10 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(wrapper)

    expect(onRefresh).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run failing test**

Run: `npm run test -- src/shared/components/feedback/pull-to-refresh.test.tsx`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement pull-to-refresh wrapper**

```tsx
import { type ReactNode, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

const TRIGGER_DISTANCE = 72

export function PullToRefresh({
  children,
  isRefreshing,
  onRefresh,
}: {
  children: ReactNode
  isRefreshing: boolean
  onRefresh: () => void | Promise<void>
}) {
  const startY = useRef<number | null>(null)
  const [distance, setDistance] = useState(0)

  function canPull() {
    return typeof window !== 'undefined' && window.scrollY <= 0
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!canPull() || isRefreshing) return
    startY.current = event.touches[0]?.clientY ?? null
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (startY.current === null || isRefreshing) return
    const currentY = event.touches[0]?.clientY ?? startY.current
    const nextDistance = Math.max(0, currentY - startY.current)
    setDistance(Math.min(nextDistance, 96))
  }

  function handleTouchEnd() {
    const shouldRefresh = distance >= TRIGGER_DISTANCE
    startY.current = null
    setDistance(0)
    if (shouldRefresh && !isRefreshing) void onRefresh()
  }

  const label = isRefreshing ? 'Memuat ulang...' : distance >= TRIGGER_DISTANCE ? 'Lepas untuk refresh' : 'Tarik untuk refresh'

  return (
    <div
      data-testid="pull-to-refresh"
      className="relative min-h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-medium shadow-sm transition-opacity md:hidden"
        style={{ opacity: isRefreshing || distance > 16 ? 1 : 0 }}
      >
        <RotateCcw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {label}
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Verify pull-to-refresh test**

Run: `npm run test -- src/shared/components/feedback/pull-to-refresh.test.tsx`
Expected: PASS.

## Task 4: Wire layout and offline banner

**Files:**
- Modify: `src/shared/components/layout/app-layout.tsx`
- Modify: `src/shared/components/sync/offline-banner.tsx`
- Test: `src/shared/components/sync/offline-banner.test.tsx`

- [ ] **Step 1: Write failing offline banner test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OfflineBanner } from '@/shared/components/sync/offline-banner'

vi.mock('@/shared/providers/refresh-provider', () => ({
  useRefresh: () => ({ isRefreshing: false, refreshAll: vi.fn() }),
}))

describe('OfflineBanner', () => {
  it('shows retry copy', () => {
    render(<OfflineBanner />)
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run failing test**

Run: `npm run test -- src/shared/components/sync/offline-banner.test.tsx`
Expected: FAIL because CTA copy is still `Lihat Sync`.

- [ ] **Step 3: Update offline banner**

```tsx
import { WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useRefresh } from '@/shared/providers/refresh-provider'

export function OfflineBanner() {
  const { isRefreshing, refreshAll } = useRefresh()

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="size-4" />
          <span>Anda sedang offline. Perubahan disimpan lokal dan akan disinkronkan saat koneksi kembali.</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refreshAll()} disabled={isRefreshing}>
          {isRefreshing ? 'Mencoba...' : 'Coba lagi'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire layout**

In `src/shared/components/layout/app-layout.tsx`:

```tsx
import { AppErrorDialog } from '@/shared/components/feedback/app-error-dialog'
import { PullToRefresh } from '@/shared/components/feedback/pull-to-refresh'
import { useRefresh } from '@/shared/providers/refresh-provider'
```

Inside component:

```tsx
const { isRefreshing, lastError, clearError, refreshAll } = useRefresh()
```

Wrap main content:

```tsx
<PullToRefresh isRefreshing={isRefreshing} onRefresh={refreshAll}>
  <main className="...existing classes...">{children}</main>
</PullToRefresh>
<AppErrorDialog open={Boolean(lastError)} error={lastError} isRetrying={isRefreshing} onOpenChange={(open) => { if (!open) clearError() }} onRetry={refreshAll} />
```

Keep desktop layout visually unchanged.

- [ ] **Step 5: Verify banner/layout tests**

Run: `npm run test -- src/shared/components/sync/offline-banner.test.tsx src/shared/components/feedback/app-error-dialog.test.tsx src/shared/components/feedback/pull-to-refresh.test.tsx`
Expected: PASS.

## Task 5: Full verification

**Files:** none expected

- [ ] **Step 1: Run targeted tests**

Run: `npm run test -- src/shared/providers/refresh-provider.test.tsx src/shared/components/feedback/app-error-dialog.test.tsx src/shared/components/feedback/pull-to-refresh.test.tsx src/shared/components/sync/offline-banner.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Run full tests**

Run: `npm run test`
Expected: PASS.

## Self-Review

### Spec coverage

- RefreshProvider: Task 1.
- App error dialog: Task 2.
- Pull-to-refresh: Task 3.
- Offline banner retry: Task 4.
- Verification: Task 5.

### Placeholder scan

No TBD/TODO/fill-later language kept.

### Type consistency

All components use one shared hook: `useRefresh()` with `isRefreshing`, `lastError`, `clearError`, `reportError`, and `refreshAll`.
