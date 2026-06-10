# Repo Verification Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate current repo-wide `lint` and `typecheck` blockers so full verification commands become meaningful again.

**Architecture:** Fix shared typing sources first, then clean feature areas in batches. Start from utility/runtime layers that fan out into many pages, then tighten component generics and row typing in pages that currently degrade to `{ id: string }` or `any`.

**Tech Stack:** TypeScript, ESLint, React, Dexie, shared data-table utilities.

---

## File Map

- Modify: `src/services/local-db/reactivity.ts`
- Modify: `src/services/local-db/runtime.ts`
- Modify: `src/services/local-db/virtual-table.ts`
- Modify: `src/services/local-db/adapters/indexeddb.adapter.ts`
- Modify: `src/services/local-db/adapters/sqlite.adapter.ts`
- Modify: `src/services/local-db/client.ts`
- Modify: `src/shared/components/data-table/data-table.tsx`
- Modify: page/component files surfaced by `npm run typecheck`

### Task 1: Clean Local DB Shared Typing

**Files:**
- Modify: `src/services/local-db/reactivity.ts`
- Modify: `src/services/local-db/runtime.ts`
- Modify: `src/services/local-db/virtual-table.ts`
- Modify: `src/services/local-db/adapters/indexeddb.adapter.ts`
- Modify: `src/services/local-db/adapters/sqlite.adapter.ts`
- Modify: `src/services/local-db/client.ts`

- [ ] **Step 1: Run lint only on local-db files to capture the exact baseline**

Run:

```bash
npx eslint "src/services/local-db/**/*.ts"
```

Expected: FAIL with current `no-explicit-any` and indexable-type issues.

- [ ] **Step 2: Replace `any[]` overload deps in `reactivity.ts`**

Use:

```ts
type LiveQueryDeps = ReadonlyArray<unknown>

export function useLiveQuery<T>(querier: () => Promise<T> | T, deps?: LiveQueryDeps): T | undefined
export function useLiveQuery<T>(querier: () => Promise<T> | T, deps: LiveQueryDeps, defaultResult: T): T
```

and replace unsafe casts with the narrowest equivalent possible.

- [ ] **Step 3: Fix indexable-type usage in adapter and virtual-table files**

Convert boolean-indexable values to strings before passing to Dexie/virtual index comparison.

Pattern:

```ts
const normalized = typeof value === 'boolean' ? String(value) : value
```

- [ ] **Step 4: Run local-db lint again**

Run: `npx eslint "src/services/local-db/**/*.ts"`
Expected: PASS or fewer remaining errors.

### Task 2: Restore Generic Data Table Row Inference

**Files:**
- Modify: `src/shared/components/data-table/data-table.tsx`
- Modify: consuming pages flagged by typecheck

- [ ] **Step 1: Identify the generic breakage source**

Run:

```bash
npm run typecheck
```

Focus on errors where rows collapse to `{ id: string }` in data-table consumers.

- [ ] **Step 2: Tighten `DataTable` props typing**

Refactor the inline prop object into a named generic props type:

```ts
type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[]
  data: T[]
  mobileRender?: (row: T) => ReactNode
  emptyTitle?: string
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function DataTable<T extends { id: string }>(props: DataTableProps<T>) {
  const { columns, data, mobileRender, emptyTitle = 'Belum ada data', selectable = false, selectedIds = [], onSelectionChange } = props
```

- [ ] **Step 3: Re-run typecheck and list remaining feature files**

Run: `npm run typecheck`
Expected: fewer row-shape errors across pages.

### Task 3: Fix Feature Pages In Batches

**Files:**
- Modify: each file reported by `npm run typecheck`

- [ ] **Step 1: Fix one area at a time starting with products, cash, and customers**

For implicit `any` callbacks, replace patterns like:

```ts
rows.map(row => ...)
```

with explicit typing from the source array type:

```ts
rows.map((row: LocalProduct) => ...)
```

or better, type the source hook so inference works automatically.

- [ ] **Step 2: Re-run typecheck after each batch**

Run: `npm run typecheck`
Expected: error count decreases predictably.

- [ ] **Step 3: Re-run lint after each batch**

Run: `npm run lint`
Expected: pass or fail only on remaining untouched batches.

### Task 4: Full Verification

**Files:**
- Modify: any touched files from Tasks 1-3 if fixes are needed

- [ ] **Step 1: Run full lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 2: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Run full app checks**

Run:

```bash
npm run check
npm run check --prefix apps/desktop
npm run check --prefix apps/mobile
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/local-db src/shared/components/data-table src/features
git commit -m "fix(types): restore full repo verification"
```
