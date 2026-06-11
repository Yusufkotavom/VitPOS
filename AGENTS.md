# AGENTS.md

## Project

KOTACOM Business Suite

Stack target:

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- TanStack Table
- React Hook Form
- Zod
- Dexie for web local DB
- SQLite adapter for Android/Desktop later

## Working Mode

Project uses feature-based modular structure.

Do not build monolithic pages or giant files.

Prefer structure:

```txt
src/
  app/
  shared/
  features/
  services/
  stores/
  lib/
```

Inside each feature, prefer:

```txt
feature-name/
  pages/
  components/
  hooks/
  api/
  db/
  sync/
  schemas/
  types/
```

## UI Rules

- Use Indonesian business terms in UI
- Desktop uses sidebar + topbar + table-first productivity layout
- Mobile uses bottom nav + card list + sticky actions
- Long forms must be split into sections/cards
- Offline state and sync state must always be visible where relevant
- POS flow must optimize for 3–5 tap completion
- Avoid horizontal scroll on mobile
- Prefer whitespace and clarity over decoration

## Shared Components

Put only generic reusable components in `shared/`.

Examples:

- Button
- Input
- Dialog
- Drawer
- Badge
- DataTable
- EmptyState
- LoadingState
- CurrencyInput
- DateRangePicker
- StatusBadge
- PageHeader
- PageShell

Do not place business-specific components in `shared/`.

## Business-Specific Components

Keep inside each feature.

Examples:

- POS cart panel
- Product form
- Customer profile
- Sales order detail
- Payment dialog
- Stock movement timeline
- Sync conflict resolver

## State Rules

- TanStack Query for server state
- Zustand for client/app state
- React Hook Form for form-local state
- Zod for schemas and validation
- TanStack Table for table state

Do not put server collections into Zustand unless needed for local-first workflow.

## Offline-First Rules

Persist operational data locally first.

Important local-first concerns:

- outbox queue
- sync state
- conflict state
- last sync metadata
- local draft persistence

Sync statuses should use plain language where possible:

- Data menunggu sinkron
- Data sudah aman di cloud
- Butuh pemeriksaan
- Coba sinkron ulang

## Stock Rules

Never model stock only as mutable final number.

Prefer stock movement history:

- sale
- purchase
- return
- adjustment
- transfer in
- transfer out
- damage/lost

## Payment Rules

Handle these UI cases clearly:

- tunai
- QRIS
- kartu
- transfer
- e-wallet
- piutang
- split payment
- partial payment
- refund

## Project Execution Rules

Before building features:

1. build app shell
2. build shared foundation
3. build routing
4. build data table system
5. build form system
6. build sync status patterns
7. then build features

## Testing / Verification

When code exists, always run project verification before completion.

Minimum expected checks once scripts exist:

- lint
- typecheck
- tests
- build

If commands are not yet defined, add them during bootstrap.

## Git / Branch / Worktree Rules

- Git already initialized
- Do not create worktrees until parallel feature branches exist
- Worktrees useful after foundation for isolated streams:
  - app shell
  - POS
  - inventory
  - reports
- Avoid worktrees during empty-repo stage

