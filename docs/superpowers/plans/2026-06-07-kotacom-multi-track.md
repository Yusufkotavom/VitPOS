# KOTACOM Business Suite Multi-Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyelesaikan platform KOTACOM Business Suite untuk web, Android, desktop, dan backend API terpisah dengan local-first sync yang bisa dikerjakan paralel oleh banyak agent.

**Architecture:** Project dipecah jadi empat engine besar: `web-app`, `backend-api`, `android-shell`, dan `desktop-shell`. Web app tetap jadi sumber UI utama. Android dan desktop bertugas membungkus web app dengan adapter native dan local DB SQLite. Backend Hono jadi API sync/auth/reporting terpisah dan deploy ke Vercel. Semua track berbagi kontrak data yang sama: Drizzle schema cloud, Dexie/SQLite local-first, dan outbox sync pattern.

**Tech Stack:** Vite, React, TypeScript, Tailwind v4, shadcn/ui, Zustand, TanStack Query, Dexie, Capacitor, Tauri, Hono, Drizzle ORM, PostgreSQL, Neon/Supabase, Vercel.

---

## 1. Parallel Delivery Model

Project dibagi ke workstream paralel agar banyak agent bisa jalan bareng tanpa saling injak.

### Engine A — Web App

Tanggung jawab:

- UI dan UX utama
- local-first browser runtime
- Dexie local DB
- routing, dashboard, POS, CRM, reports, sync center
- reusable feature modules

### Engine B — Backend API

Tanggung jawab:

- Hono API terpisah
- auth session exchange
- sync push / pull
- report queries
- Drizzle migration runner
- deploy Vercel terpisah dari frontend

### Engine C — Android Shell

Tanggung jawab:

- Capacitor wrapper
- SQLite adapter Android
- mobile device integration
- offline persistence behavior di device
- sync / reconnect lifecycle mobile

### Engine D — Desktop Shell

Tanggung jawab:

- Tauri wrapper
- SQLite adapter desktop
- print / file integration nanti
- desktop app lifecycle

---

## 2. Worktree / Branch Strategy

Worktrees dipakai setelah foundation stabil, supaya agent bisa kerja paralel bersih.

### Main repo

- `main` → integrasi stabil

### Branches

- `feature/web-core`
- `feature/backend-api`
- `feature/android-shell`
- `feature/desktop-shell`
- `feature/shared-contracts`

### Worktrees

Gunakan struktur ini:

```txt
/home/kotacom/VitPOS                 -> main working tree
/home/kotacom/VitPOS-web            -> feature/web-core
/home/kotacom/VitPOS-api            -> feature/backend-api
/home/kotacom/VitPOS-android        -> feature/android-shell
/home/kotacom/VitPOS-desktop        -> feature/desktop-shell
/home/kotacom/VitPOS-contracts      -> feature/shared-contracts
```

### Agent mapping

- Agent 1 → web-core
- Agent 2 → backend-api
- Agent 3 → android-shell
- Agent 4 → desktop-shell
- Agent 5 → shared-contracts / schema / sync payloads
- Project manager agent → merge order, review, verification gate

---

## 3. Shared Contracts First

Sebelum agent lain ngebut sendiri-sendiri, shared contracts harus stabil.

### Task SC-1: Data contract baseline

**Files:**
- Modify: `src/db/schema/core.ts`
- Create: `docs/architecture/contracts.md`
- Create: `docs/architecture/sync-payloads.md`

- [ ] Lock entity contract untuk tenant, branch, product, customer, sales order, payment, warehouse, stock movement.
- [ ] Definisikan shape payload untuk `sync/push` dan `sync/pull`.
- [ ] Definisikan `device_id`, `version`, `sync_status`, `updated_at` semantics.
- [ ] Run: `npm run check`

### Task SC-2: Local adapter seam

**Files:**
- Create: `src/services/local-db/adapters/index.ts`
- Create: `src/services/local-db/adapters/indexeddb.adapter.ts`
- Create: `src/services/local-db/adapters/sqlite.adapter.ts`
- Modify: `src/services/local-db/client.ts`

- [ ] Pisahkan interface local DB adapter.
- [ ] Web pakai IndexedDB/Dexie adapter.
- [ ] Android/Desktop punya placeholder SQLite adapter.
- [ ] Run: `npm run check`

---

## 4. Engine A — Web App Plan

### Task WA-1: Repository layer

**Files:**
- Create: `src/features/products/db/products.repository.ts`
- Create: `src/features/customers/db/customers.repository.ts`
- Create: `src/features/sales-orders/db/sales-orders.repository.ts`
- Create: `src/features/payments/db/payments.repository.ts`
- Create: `src/features/inventory/db/inventory.repository.ts`
- Create: `src/features/cash/db/cash.repository.ts`
- Modify pages/hooks to stop touching Dexie directly

- [ ] Introduce repository seam between pages and local DB.
- [ ] Replace direct `localDb.*` access in feature hooks.
- [ ] Keep page logic UI-only.
- [ ] Run: `npm run check`

### Task WA-2: CRUD mock actions with local persistence

**Files:**
- Modify feature-local components/pages for products/customers/orders/payments
- Create feature form components where missing

- [ ] Add create/update mock actions that write to local DB.
- [ ] Trigger toast feedback.
- [ ] Keep changes visible immediately in UI.
- [ ] Run: `npm run check`

### Task WA-3: Automatic outbox enqueue

**Files:**
- Modify repositories created in WA-1
- Modify: `src/services/sync/outbox-service.ts`

- [ ] Every create/update/delete on local business entities enqueues outbox record.
- [ ] Queue entries carry entity type, entity id, mutation type, payload snapshot.
- [ ] Run: `npm run check`

### Task WA-4: Finish phase-2 screens as real data-driven modules

**Files:**
- Modify `src/features/service-orders/**`
- Modify `src/features/purchases/**`
- Modify `src/features/suppliers/**`
- Modify `src/features/returns/**`
- Modify `src/features/platform-admin/**`

- [ ] Replace placeholder screens with data-driven mock modules.
- [ ] Add feature-local mocks or Dexie repositories where fit.
- [ ] Keep same design system.
- [ ] Run: `npm run check`

### Task WA-5: Bundle health

**Files:**
- Modify: `vite.config.ts`
- Modify: route/component split points if needed

- [ ] Reduce main chunk size.
- [ ] Split heavy utilities or shared UI bundles where safe.
- [ ] Run: `npm run check`

---

## 5. Engine B — Backend API Plan

### Task API-1: Separate Hono app scaffold

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/vercel.json` or route config as needed

- [ ] Scaffold standalone Hono TypeScript app.
- [ ] Keep frontend and backend deploy units separate.
- [ ] Add `/health` route.
- [ ] Run backend verification command.

### Task API-2: Shared Drizzle connection

**Files:**
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/env.ts`
- Reuse/mirror schema contract from root

- [ ] Connect Hono app to Postgres via Drizzle.
- [ ] Read env safely from Vercel env.
- [ ] Add health query check.
- [ ] Run backend verification.

### Task API-3: Sync routes

**Files:**
- Create: `apps/api/src/routes/sync-push.ts`
- Create: `apps/api/src/routes/sync-pull.ts`
- Create: `apps/api/src/routes/auth-session.ts`
- Create: `apps/api/src/routes/reports.ts`

- [ ] Implement mock-safe `POST /sync/push`.
- [ ] Implement `GET /sync/pull` by `since` timestamp.
- [ ] Add session exchange placeholder route.
- [ ] Add one sample reports route.
- [ ] Run backend verification.

### Task API-4: Vercel deployment docs

**Files:**
- Create: `apps/api/README.md`
- Modify: root `README.md`

- [ ] Document separate Vercel deploy for API.
- [ ] Document env vars and route base URL.
- [ ] Run backend verification.

---

## 6. Engine C — Android Plan

### Task AND-1: Capacitor shell bootstrap

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/capacitor.config.ts`
- Create platform bootstrap files as required

- [ ] Wrap web app with Capacitor.
- [ ] Document how web build feeds Android shell.
- [ ] Run mobile bootstrap verification.

### Task AND-2: SQLite adapter seam

**Files:**
- Modify/create mobile adapter files under shared local-db seam
- Create: `apps/mobile/src/sqlite/*` if needed

- [ ] Define Android SQLite adapter implementation target.
- [ ] Keep contract same as Dexie adapter.
- [ ] Add offline open/init flow notes.
- [ ] Run mobile verification.

### Task AND-3: Mobile lifecycle sync

**Files:**
- Create mobile lifecycle integration docs/code

- [ ] Hook app foreground/background sync triggers.
- [ ] Define reconnect behavior.
- [ ] Document permissions/storage caveats.
- [ ] Run mobile verification.

---

## 7. Engine D — Desktop Plan

### Task DESK-1: Tauri shell bootstrap

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/src-tauri/*`

- [ ] Wrap web app with Tauri.
- [ ] Keep build pipeline separate from frontend web deploy.
- [ ] Run desktop bootstrap verification.

### Task DESK-2: Desktop SQLite adapter

**Files:**
- Create desktop-side adapter docs/code

- [ ] Define desktop SQLite adapter implementation.
- [ ] Match local adapter seam contract.
- [ ] Run desktop verification.

### Task DESK-3: Print/file seam

**Files:**
- Create: `docs/architecture/desktop-integrations.md`

- [ ] Define seam for printing and file export.
- [ ] Do not overbuild thermal printer implementation yet.
- [ ] Run desktop verification.

---

## 8. Cross-Cutting Quality Gates

### Task QG-1: Test matrix

**Files:**
- Modify root/package scripts
- Add backend/mobile/desktop verification docs/scripts as available

- [ ] Web: `npm run check`
- [ ] API: lint/typecheck/test/build command
- [ ] Android: bootstrap/build sanity command
- [ ] Desktop: bootstrap/build sanity command

### Task QG-2: Documentation sync

**Files:**
- Modify: `README.md`
- Modify: `PROJECT_PLAN.md`
- Modify: `PHASES.md`

- [ ] Update top-level docs to reflect 4-engine architecture.
- [ ] Document branch/worktree/agent mapping.
- [ ] Document sequence of integration.

---

## 9. Merge Order

Parallel agents can code at same time, but merge order must be:

1. Shared contracts
2. Web repository seam
3. Backend API scaffold
4. Android/Desktop shell bootstrap
5. Web CRUD + sync mutations
6. Backend sync routes
7. Android/Desktop SQLite adapters
8. Phase-2 business modules

---

## 10. Definition of Done Per Engine

### Web done when
- core modules data-driven from local DB
- CRUD writes local DB
- outbox auto-enqueues
- sync center reflects real local state
- `npm run check` passes

### API done when
- Hono app deployable to Vercel separately
- health + sync routes exist
- Drizzle wired
- API verification passes

### Android done when
- Capacitor shell boots app
- SQLite seam defined
- basic build succeeds

### Desktop done when
- Tauri shell boots app
- SQLite seam defined
- basic build succeeds

---

## 11. Immediate Next Execution

1. Create worktrees for `web`, `api`, `android`, `desktop`, `contracts`
2. Dispatch sub-agent per worktree
3. Finish shared contracts first
4. Start backend Hono scaffold in parallel with web repository seam
5. Start Capacitor and Tauri shell bootstrap after contracts lock
