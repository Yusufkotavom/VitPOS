# KOTACOM Business Suite MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Menyelesaikan MVP frontend + local-first foundation + Postgres schema untuk KOTACOM Business Suite.

**Architecture:** Vite React SPA dengan shadcn/ui app shell, feature-based modules, Dexie untuk local-first queue/cache, Drizzle + Postgres untuk cloud schema, dan sync skeleton terpisah dari UI. Shared layer hanya generic primitive. Business UI tetap di feature masing-masing.

**Tech Stack:** Vite, React, TypeScript, Tailwind v4, shadcn/ui, Zustand, TanStack Query, Dexie, Drizzle ORM, Postgres/Neon.

---

## File Map

### Existing core
- `src/app/router.tsx` — route tree app
- `src/shared/components/layout/app-layout.tsx` — app shell
- `src/shared/components/layout/app-sidebar.tsx` — shadcn sidebar composition
- `src/features/pos/**` — POS foundation
- `src/features/sync/**` — sync UI/store
- `src/services/local-db/**` — Dexie schema/client
- `src/services/sync/**` — outbox/conflict/sync engine mock
- `src/db/**` — Drizzle schema

### Next files to create
- `src/features/dashboard/mocks/dashboard.mock.ts`
- `src/features/dashboard/components/*.tsx`
- `src/features/products/components/*.tsx`
- `src/features/customers/components/*.tsx`
- `src/features/sales-orders/components/*.tsx`
- `src/features/payments/components/*.tsx`
- `src/features/inventory/components/*.tsx`
- `src/features/reports/components/*.tsx`
- `src/features/settings/components/*.tsx`
- `src/features/sync/hooks/*.ts`
- `src/services/local-db/seeds.ts`
- `src/services/local-db/bootstrap.ts`
- `src/features/*/mocks/*.ts`
- `src/tests/**`

---

### Task 1: Local DB bootstrap

**Files:**
- Create: `src/services/local-db/seeds.ts`
- Create: `src/services/local-db/bootstrap.ts`
- Modify: `src/app/providers.tsx`

- [x] Add seed helpers for outbox demo data and future module seeds.
- [x] Add bootstrap function that initializes Dexie demo records once.
- [x] Call bootstrap from app providers without blocking render.
- [x] Run: `npm run check`

### Task 2: Dashboard modularization

**Files:**
- Create: `src/features/dashboard/mocks/dashboard.mock.ts`
- Create: `src/features/dashboard/components/dashboard-kpi-grid.tsx`
- Create: `src/features/dashboard/components/recent-transactions.tsx`
- Create: `src/features/dashboard/components/quick-actions.tsx`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [x] Move inline mock data out of page.
- [x] Split dashboard into focused components.
- [x] Keep Indonesian labels and sync summary visible.
- [x] Run: `npm run check`

### Task 3: Products real feature slice

**Files:**
- Create: `src/features/products/mocks/products.mock.ts`
- Create: `src/features/products/components/product-status-summary.tsx`
- Create: `src/features/products/components/product-form-preview.tsx`
- Modify: `src/features/products/pages/products-page.tsx`

- [x] Move product mock data out of page.
- [x] Add summary cards for active/service/low stock.
- [x] Add product form preview card or sheet placeholder.
- [x] Run: `npm run check`

### Task 4: Customers/orders/payments modular screens

**Files:**
- Create: `src/features/customers/mocks/customers.mock.ts`
- Create: `src/features/sales-orders/mocks/orders.mock.ts`
- Create: `src/features/payments/mocks/payments.mock.ts`
- Modify pages under each feature

- [x] Move inline arrays to mocks.
- [x] Add feature-local list/detail summary blocks.
- [x] Keep shared DataTable generic.
- [x] Run: `npm run check`

### Task 5: Inventory/cash/reports/settings modular screens

**Files:**
- Create mocks/components under each feature
- Modify pages under each feature

- [x] Move inline arrays to mocks.
- [x] Add top summary cards.
- [x] Add consistent mobile card layouts.
- [x] Run: `npm run check`

### Task 6: POS strengthen

**Files:**
- Create: `src/features/pos/components/pos-summary-strip.tsx`
- Create: `src/features/pos/components/held-sale-banner.tsx`
- Modify existing POS components/pages/store
- Test: `src/tests/pos-store.test.ts`

- [x] Add POS summary strip.
- [x] Add held-sale placeholder and sync status messaging.
- [x] Write behavior tests for cart totals.
- [x] Run: `npm run check`

### Task 7: Sync live hooks

**Files:**
- Create: `src/features/sync/hooks/use-sync-queue.ts`
- Create: `src/features/sync/hooks/use-sync-conflicts.ts`
- Modify: `src/features/sync/pages/sync-page.tsx`

- [x] Replace manual refresh patterns with hooks.
- [x] Sync page should reflect seeded Dexie state on reload.
- [x] Run: `npm run check`

### Task 8: Testing baseline

**Files:**
- Create: `vitest.config.ts`
- Create: `src/tests/setup.ts`
- Create: `src/tests/format-currency.test.ts`
- Modify: `package.json`

- [x] Add `npm run test`.
- [x] Test public behavior only.
- [x] Add tests for `formatCurrency` and POS store totals.
- [x] Run: `npm run lint && npm run typecheck && npm run test && npm run build`

### Task 9: Route code-splitting

**Files:**
- Modify: `src/app/router.tsx`

- [x] Convert feature pages to lazy routes.
- [x] Reduce main bundle warning.
- [x] Run: `npm run check`

### Task 10: Cloud DB docs

**Files:**
- Create: `.env.example`
- Create: `docs/architecture/database.md`
- Modify: `README.md`

- [x] Document Neon/Supabase connection strategy.
- [x] Document Drizzle commands and migration flow.
- [x] Ensure no secrets in tracked docs.
- [x] Run: `npm run check`
