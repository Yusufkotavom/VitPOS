# Service Warranty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured warranty support to service orders, show warranty status on the service page, and extend the service timeline with warranty events.

**Architecture:** Extend `LocalServiceOrder` with warranty fields and typed timeline events, then thread those fields through the service-order create flow, transaction service, detail page, and status-update logic. Keep warranty activation tied to the first transition into `Selesai`, and render warranty state from stored dates instead of deriving it ad hoc from raw text notes.

**Tech Stack:** React, TypeScript, Zustand, Dexie, React Query, Vitest, date-fns.

---

## File Map

- Modify: `src/services/local-db/schema.ts`
- Modify: `src/features/service-orders/stores/service-order-create-store.ts`
- Modify: `src/features/service-orders/services/soc-transaction.service.ts`
- Modify: `src/features/service-orders/pages/service-order-create-page.tsx`
- Modify: `src/features/service-orders/pages/service-order-detail-page.tsx`
- Modify: `src/features/service-orders/hooks/use-service-order.ts`
- Create: `src/features/service-orders/lib/warranty.ts`
- Create: `src/features/service-orders/lib/warranty.test.ts`

### Task 1: Add Warranty Model And Utility

**Files:**
- Modify: `src/services/local-db/schema.ts`
- Create: `src/features/service-orders/lib/warranty.ts`
- Create: `src/features/service-orders/lib/warranty.test.ts`

- [ ] **Step 1: Write the failing tests for warranty date calculation and timeline event helpers**

```ts
import { describe, expect, it } from 'vitest'
import { addWarrantyDuration, buildWarrantyTimelineNote, isWarrantyExpired } from '@/features/service-orders/lib/warranty'

describe('warranty helpers', () => {
  it('adds 30 hari from completion date', () => {
    const end = addWarrantyDuration('2026-06-10T10:00:00.000Z', 30, 'hari')
    expect(end).toBe('2026-07-10T10:00:00.000Z')
  })

  it('builds activation note', () => {
    expect(buildWarrantyTimelineNote({ value: 3, unit: 'bulan', mode: 'activated', endDate: '2026-09-10T10:00:00.000Z' }))
      .toContain('Garansi aktif sampai')
  })

  it('detects expired warranty', () => {
    expect(isWarrantyExpired('2020-01-01T00:00:00.000Z', new Date('2026-01-01T00:00:00.000Z'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test -- src/features/service-orders/lib/warranty.test.ts`
Expected: FAIL because the utility file does not exist yet.

- [ ] **Step 3: Add typed warranty and timeline fields to `LocalServiceOrder`**

In `src/services/local-db/schema.ts`, add:

```ts
export type WarrantyUnit = 'hari' | 'bulan' | 'tahun'

export type ServiceOrderTimelineItem = {
  id: string
  status: string
  date: string
  note: string
  type?: 'status' | 'warranty'
}
```

and extend `LocalServiceOrder` with:

```ts
hasWarranty?: boolean
warrantyValue?: number
warrantyUnit?: WarrantyUnit
warrantyStartDate?: string
warrantyEndDate?: string
timeline?: ServiceOrderTimelineItem[]
```

- [ ] **Step 4: Implement the minimal warranty utility**

Create `src/features/service-orders/lib/warranty.ts` with:

```ts
import { addDays, addMonths, addYears, isBefore } from 'date-fns'
import type { WarrantyUnit } from '@/services/local-db/schema'

export function addWarrantyDuration(startDateIso: string, value: number, unit: WarrantyUnit) {
  const startDate = new Date(startDateIso)
  const next = unit === 'hari' ? addDays(startDate, value) : unit === 'bulan' ? addMonths(startDate, value) : addYears(startDate, value)
  return next.toISOString()
}

export function buildWarrantyTimelineNote(input: { value: number; unit: WarrantyUnit; mode: 'created' | 'activated' | 'updated' | 'removed'; endDate?: string }) {
  if (input.mode === 'removed') return 'Garansi dihapus'
  if (input.mode === 'created') return `Garansi diatur ${input.value} ${input.unit}`
  if (input.mode === 'updated') return `Garansi diubah menjadi ${input.value} ${input.unit}`
  return `Garansi aktif sampai ${new Date(input.endDate ?? '').toLocaleDateString('id-ID', { dateStyle: 'long' })}`
}

export function isWarrantyExpired(endDateIso?: string, now: Date = new Date()) {
  if (!endDateIso) return false
  return isBefore(new Date(endDateIso), now)
}
```

- [ ] **Step 5: Run the targeted warranty tests**

Run: `npm run test -- src/features/service-orders/lib/warranty.test.ts`
Expected: PASS.

### Task 2: Extend Service Create State And Checkout Persistence

**Files:**
- Modify: `src/features/service-orders/stores/service-order-create-store.ts`
- Modify: `src/features/service-orders/services/soc-transaction.service.ts`
- Test: `src/features/service-orders/lib/warranty.test.ts`

- [ ] **Step 1: Add store fields for warranty**

In `src/features/service-orders/stores/service-order-create-store.ts`, add:

```ts
hasWarranty: boolean
warrantyValue: string
warrantyUnit: 'hari' | 'bulan' | 'tahun'
setHasWarranty: (value: boolean) => void
setWarrantyValue: (value: string) => void
setWarrantyUnit: (value: 'hari' | 'bulan' | 'tahun') => void
```

Default values:

```ts
hasWarranty: false,
warrantyValue: '',
warrantyUnit: 'hari',
```

- [ ] **Step 2: Thread warranty payload into checkout input**

In `src/features/service-orders/services/soc-transaction.service.ts`, extend `serviceData` to:

```ts
serviceData: {
  description: string
  notes: string
  status: string
  estimatedCompletion?: string
  hasWarranty: boolean
  warrantyValue?: number
  warrantyUnit?: 'hari' | 'bulan' | 'tahun'
}
```

- [ ] **Step 3: Persist warranty fields and initial timeline event on create**

When building `serviceOrder`, add:

```ts
hasWarranty: serviceData.hasWarranty,
warrantyValue: serviceData.hasWarranty ? serviceData.warrantyValue : undefined,
warrantyUnit: serviceData.hasWarranty ? serviceData.warrantyUnit : undefined,
warrantyStartDate: undefined,
warrantyEndDate: undefined,
```

and if warranty is enabled, append:

```ts
{
  id: crypto.randomUUID(),
  type: 'warranty',
  status: 'Garansi',
  date: nowIso,
  note: buildWarrantyTimelineNote({ value: serviceData.warrantyValue ?? 0, unit: serviceData.warrantyUnit ?? 'hari', mode: 'created' }),
}
```

- [ ] **Step 4: Run targeted build-level verification**

Run: `npx vite build`
Expected: PASS or fail only on downstream UI wiring that still needs implementation.

### Task 3: Add Warranty Inputs To Service Create UI

**Files:**
- Modify: `src/features/service-orders/pages/service-order-create-page.tsx`

- [ ] **Step 1: Add validation gate before payment opens**

In `handleOpenPayment`, add:

```ts
if (store.hasWarranty && (!store.warrantyValue.trim() || Number(store.warrantyValue) <= 0)) {
  toast.error('Durasi garansi wajib diisi')
  return
}
```

- [ ] **Step 2: Add warranty toggle and fields in the top service form**

Add a new block near `Estimasi Selesai`:

```tsx
<div className="space-y-1 min-w-[220px]">
  <Label className="text-xs text-muted-foreground">Garansi</Label>
  <label className="flex items-center gap-2 text-sm">
    <input type="checkbox" checked={store.hasWarranty} onChange={(e) => store.setHasWarranty(e.target.checked)} className="size-4 rounded border-input" />
    Aktifkan garansi
  </label>
  {store.hasWarranty ? (
    <div className="grid grid-cols-[1fr_120px] gap-2">
      <Input inputMode="numeric" value={store.warrantyValue} onChange={(e) => store.setWarrantyValue(e.target.value.replace(/\D/g, ''))} placeholder="30" />
      <Select value={store.warrantyUnit} onValueChange={store.setWarrantyUnit}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="hari">Hari</SelectItem>
          <SelectItem value="bulan">Bulan</SelectItem>
          <SelectItem value="tahun">Tahun</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ) : null}
</div>
```

- [ ] **Step 3: Pass warranty data into checkout**

In the call that saves the service transaction, include:

```ts
hasWarranty: store.hasWarranty,
warrantyValue: store.hasWarranty ? Number(store.warrantyValue) : undefined,
warrantyUnit: store.hasWarranty ? store.warrantyUnit : undefined,
```

- [ ] **Step 4: Manually verify create page behavior**

Check:

- toggle off hides warranty fields
- toggle on shows duration + unit
- invalid empty duration is blocked
- create order persists without UI crash

### Task 4: Activate Warranty On Status Transition

**Files:**
- Modify: `src/features/service-orders/pages/service-order-detail-page.tsx`
- Modify: `src/features/service-orders/hooks/use-service-order.ts`

- [ ] **Step 1: Stop overwriting real timeline data in `useServiceOrder`**

Replace the mocked timeline in `src/features/service-orders/hooks/use-service-order.ts` with:

```ts
return order
```

This is required so stored status/warranty timeline data is actually shown.

- [ ] **Step 2: Add a helper in detail page for warranty recalculation**

Inside `src/features/service-orders/pages/service-order-detail-page.tsx`, use:

```ts
import { addWarrantyDuration, buildWarrantyTimelineNote, isWarrantyExpired } from '@/features/service-orders/lib/warranty'
```

- [ ] **Step 3: Extend edit state for warranty fields**

Add local edit state:

```ts
const [editHasWarranty, setEditHasWarranty] = useState(false)
const [editWarrantyValue, setEditWarrantyValue] = useState('')
const [editWarrantyUnit, setEditWarrantyUnit] = useState<'hari' | 'bulan' | 'tahun'>('hari')
```

Initialize them in `startEditing()` from `order`.

- [ ] **Step 4: Update `saveEditing()` to activate or update warranty**

Implement this logic when building the updated order:

```ts
const nowIso = new Date().toISOString()
let warrantyStartDate = order.warrantyStartDate
let warrantyEndDate = order.warrantyEndDate
const nextHasWarranty = editHasWarranty
const nextWarrantyValue = nextHasWarranty ? Number(editWarrantyValue) || undefined : undefined
const nextWarrantyUnit = nextHasWarranty ? editWarrantyUnit : undefined

if (nextHasWarranty && editStatus === 'Selesai') {
  if (!warrantyStartDate) {
    warrantyStartDate = nowIso
    warrantyEndDate = addWarrantyDuration(warrantyStartDate, nextWarrantyValue ?? 0, nextWarrantyUnit ?? 'hari')
    updatedTimeline.push({
      id: crypto.randomUUID(),
      type: 'warranty',
      status: 'Garansi',
      date: nowIso,
      note: buildWarrantyTimelineNote({ value: nextWarrantyValue ?? 0, unit: nextWarrantyUnit ?? 'hari', mode: 'activated', endDate: warrantyEndDate }),
    })
  } else {
    warrantyEndDate = addWarrantyDuration(warrantyStartDate, nextWarrantyValue ?? 0, nextWarrantyUnit ?? 'hari')
  }
}

if (!nextHasWarranty) {
  warrantyStartDate = undefined
  warrantyEndDate = undefined
}
```

Append `updated` or `removed` warranty timeline notes when config changes.

### Task 5: Show Warranty Section And Timeline Labels

**Files:**
- Modify: `src/features/service-orders/pages/service-order-detail-page.tsx`

- [ ] **Step 1: Add warranty section to the detail page**

Render a block with:

```tsx
<div>
  <h3 className="text-sm font-medium text-muted-foreground mb-3">Garansi</h3>
  <div className="rounded-xl border bg-background p-4">
    {!order.hasWarranty ? (
      <p className="text-sm text-muted-foreground">Tanpa garansi</p>
    ) : order.status !== 'Selesai' || !order.warrantyStartDate ? (
      <div className="space-y-1">
        <p className="font-medium">Belum aktif</p>
        <p className="text-sm text-muted-foreground">Garansi {order.warrantyValue} {order.warrantyUnit} akan aktif saat service selesai.</p>
      </div>
    ) : (
      <div className="space-y-1">
        <p className="font-medium">{isWarrantyExpired(order.warrantyEndDate) ? 'Berakhir' : 'Aktif'}</p>
        <p className="text-sm text-muted-foreground">Mulai {new Date(order.warrantyStartDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        <p className="text-sm text-muted-foreground">Sampai {new Date(order.warrantyEndDate ?? '').toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 2: Extend timeline row rendering to recognize warranty events**

In the timeline list, render a small label based on `item.type`:

```tsx
<span className="text-xs text-muted-foreground">{item.type === 'warranty' ? 'Garansi' : 'Status'}</span>
```

Keep old items working when `type` is undefined.

- [ ] **Step 3: Manually verify detail page behavior**

Check:

- service without warranty shows `Tanpa garansi`
- service with warranty before completion shows `Belum aktif`
- service with warranty after `Selesai` shows activation and end date
- timeline shows warranty entries

### Task 6: Final Warranty Verification

**Files:**
- Modify: touched files above if fixes are needed

- [ ] **Step 1: Run targeted warranty tests**

Run: `npm run test -- src/features/service-orders/lib/warranty.test.ts`
Expected: PASS.

- [ ] **Step 2: Run focused lint on touched service files**

Run:

```bash
npx eslint "src/features/service-orders/pages/service-order-create-page.tsx" "src/features/service-orders/pages/service-order-detail-page.tsx" "src/features/service-orders/stores/service-order-create-store.ts" "src/features/service-orders/services/soc-transaction.service.ts" "src/features/service-orders/hooks/use-service-order.ts" "src/features/service-orders/lib/warranty.ts" "src/services/local-db/schema.ts"
```

Expected: PASS.

- [ ] **Step 3: Run build verification**

Run: `npx vite build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/local-db/schema.ts src/features/service-orders/stores/service-order-create-store.ts src/features/service-orders/services/soc-transaction.service.ts src/features/service-orders/pages/service-order-create-page.tsx src/features/service-orders/pages/service-order-detail-page.tsx src/features/service-orders/hooks/use-service-order.ts src/features/service-orders/lib/warranty.ts src/features/service-orders/lib/warranty.test.ts
git commit -m "feat(service): add warranty tracking"
```
