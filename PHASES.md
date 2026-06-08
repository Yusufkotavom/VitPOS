# Phase Breakdown

## Phase 0 — Planning

Output:

- README.md
- AGENTS.md
- PROJECT_PLAN.md
- initial superpower plan
- git init

Status:

- complete

## Phase 1 — Web Foundation

Tasks:

- create Vite React TS app
- install Tailwind CSS
- initialize shadcn/ui
- setup aliases
- add lint/typecheck/build/test scripts
- create base folders
- build app shell

Exit criteria:

- web app boots
- lint passes
- typecheck passes
- build passes

## Phase 2 — Web Local-First MVP

Tasks:

- Dexie setup
- dashboard
- POS
- products
- customers
- sales orders
- payments
- shift cashier
- cash & bank
- stock & warehouse basic
- reports basic
- settings
- offline sync center

Exit criteria:

- core screens exist
- local DB runtime active
- sync center reflects local state

## Phase 3 — Shared Contracts

Tasks:

- sync payload contract
- local adapter seam
- route/label cleanup
- docs alignment

Exit criteria:

- web, backend, android, desktop can share data contract safely

## Phase 4 — Backend API

Tasks:

- Hono API scaffold
- Drizzle DB connection
- sync push/pull routes
- auth/session route
- health route
- Vercel deploy separation

Exit criteria:

- backend runs and deploys separately from frontend

## Phase 5 — Android Shell

Tasks:

- Capacitor bootstrap
- Android packaging
- SQLite adapter seam
- mobile lifecycle sync integration

Exit criteria:

- app shell runs in Android wrapper
- SQLite seam defined

## Phase 6 — Desktop Shell

Tasks:

- Tauri bootstrap
- desktop packaging
- SQLite adapter seam
- print/file seam planning

Exit criteria:

- app shell runs in desktop wrapper
- SQLite seam defined

## Phase 7 — Expansion

Tasks:

- service orders
- purchases
- suppliers
- returns
- platform admin
- subscriptions
- advanced reports

Exit criteria:

- phase-2 business modules are data-driven, not placeholder
