# VitPOS / KOTACOM Business Suite
**Comprehensive Technical Architecture & Implementation Guide**

VitPOS (KOTACOM Business Suite) is an advanced, Offline-First SaaS Point of Sale (POS), CRM, and Accounting engine designed specifically for the Indonesian SME market. 

This repository implements a **multi-target deployment architecture**, providing a unified Vite/React web engine that powers three distinct platforms simultaneously:
1. **Web Dashboard (PWA)** - Deployed statically to Vercel/Cloudflare Pages.
2. **Android Application** - Wrapped using Capacitor.
3. **Desktop Application (Windows/Linux)** - Wrapped using Tauri (Rust).

---

## 🏗️ System Architecture

### 1. Frontend & UI Layer (Web/Android/Desktop)
- **Framework:** Vite + React 19.
- **Styling:** Tailwind CSS v4 + shadcn/ui.
- **State Management (Client-Side):** `zustand` for persistent UI states (active tenant, auth state, sync UI queues).
- **Server State & Data Fetching:** `@tanstack/react-query` to handle REST API fetches for real-time cloud data (e.g., Platform Admin dashboards).
- **Form & Validation:** `react-hook-form` + `zod` for strictly typed forms.

### 2. The Offline-First Engine (Local DB)
To guarantee 100% uptime regardless of internet availability, the core POS features operate entirely locally.
- **Engine:** `dexie` (IndexedDB wrapper).
- **Structure:** 26 separate tables reflecting cloud structure (Products, Sales, Stock Movements, Customers, etc).
- **Philosophy:** Read from local, write to local. The local DB is the *Single Source of Truth* during operational hours.

### 3. Synchronization Engine (Outbox Pattern)
Instead of executing direct API calls for operational mutations, the system utilizes a resilient sync engine:
1. **Outbox Logger:** Every insert/update/delete operation writes a serialized JSON payload to a local `outbox` table.
2. **Auto-Sync Hook (`useAutoSync`):** A background worker pings the `/health` API every 15 seconds. If the API is reachable and the device is `navigator.onLine`, it flushes the outbox.
3. **Conflict Resolver:** If the server rejects a payload (e.g., version mismatch or data collision), the outbox item is flagged as `conflict` and surfaced to the UI (`/sync` page) for manual resolution.
4. **Push & Pull APIs:** The Hono API exposes `/api/v1/sync/push` (to process outbox) and `/api/v1/sync/pull` (cursor-based pagination to retrieve newly updated rows from the cloud).

### 4. Backend API Layer
- **Framework:** Hono (Deployed as Vercel Serverless Functions).
- **Database ORM:** Drizzle ORM (`drizzle-kit` for migrations).
- **Primary Database:** PostgreSQL (Neon DB).
- **Authentication:** Custom JWT-like tokens (`x-user-id` and `Authorization: Bearer dev-*` for development scaling). 
- **Multi-Tenancy:** Strict row-level isolation via `tenantId`. A single `users` row can belong to multiple `tenants` via the `tenant_members` junction table.

### 5. SaaS Platform Billing
- **Schema:** The `tenants` table contains robust billing mechanisms: `subscriptionStatus` (trial, active, suspended), `planValidUntil` (expiration timestamp), `storageLimitMb`, and `maxBranches`.
- **Onboarding Workflow:** When `authRoutes.post('/register')` is hit, the system inherently calculates a 14-day `trial` logic. 
- **Admin Visibility:** Super Admins can access `/platform-admin` to fetch real-time joining between users and tenants via `/api/v1/platform/tenants`.

---

## 📂 Repository Structure

The architecture enforces a Feature-Sliced Design (FSD) approach inside a monolithic React project:

```text
VitPOS/
├── apps/
│   ├── api/            # Hono Backend API (Vercel target)
│   ├── desktop/        # Tauri Rust Shell (Desktop target)
│   └── mobile/         # Capacitor Shell (Android target)
├── src/
│   ├── components/     # Global UI primitives (shadcn)
│   ├── db/             # Drizzle Schema & core definitions
│   ├── features/       # Business modules (pos, inventory, platform-admin)
│   ├── lib/            # Utilities (formatters, cn, math)
│   ├── services/       # Local DB instances, API Clients, Sync Engine
│   └── shared/         # Reusable layouts, hooks, pdf generators
└── docs/               # Architecture diagrams, agent plans, logs
```

---

## 🚀 Environment Variables

You only need minimal environment configurations.

**Frontend (`.env.production` / Vercel Web Dashboard):**
```env
VITE_API_BASE_URL="https://vit-pos-8vle.vercel.app"
```
*(When building Tauri/APK, Vite will bake this URL into the binary. If omitted, it falls back to `http://localhost:3010`)*

**Backend (`apps/api/.vercel/.env.production.local` / Vercel API):**
```env
DATABASE_URL="postgres://neondb_owner:.../neondb?sslmode=require"
```

---

## 🛠️ Development & Tooling

We provide unified scripts for cross-platform validation.

### Web & Frontend Development
```bash
npm install
npm run dev       # Start Vite dev server
npm run check     # Run linting, typecheck, vitest, and build
```

### Database Operations (Drizzle)
```bash
npm run db:generate   # Generate SQL migrations
npm run db:migrate    # Apply migrations locally
npm run db:push       # Push schema directly to Neon DB
npm run db:studio     # Launch Drizzle Studio UI
```

### API Backend Development
```bash
npm run api:dev       # Start Hono server locally
npm run api:check     # Test and typecheck API
```

### Mobile & Desktop Validation
```bash
npm run mobile:check  # Sync Capacitor and validate Android setup
npm run desktop:check # Validate Tauri Rust toolchain and web build
```

---

## 🔄 CI/CD & Release Pipeline

We utilize **GitHub Actions** (`.github/workflows/release.yml`) for automated cross-platform building.

1. The pipeline triggers on Git Tags (e.g., `v1.0.0`).
2. **Android Pipeline:** Bootstraps Java 21 & Android SDK, syncs Capacitor, and builds Signed/Debug APKs via Gradle.
3. **Desktop Pipeline:** Bootstraps Rust toolchain, fetches `libwebkit2gtk`, and compiles `.exe`, `.deb`, and `.AppImage` via `tauri-action`.
4. Artifacts are automatically attached to the GitHub Release.

### App Update Behavior

1. **Web update path:** App can always open the latest deployed web build at `https://vit-pos-8vle.vercel.app`.
2. **Android non-Play-Store path:** The app checks GitHub Releases and offers the latest APK download.
3. **Tauri desktop path:** The app checks GitHub Releases and offers the latest installer for the current OS.
4. **Version sync in CI:** Tagged releases automatically sync version numbers into Android and Tauri build files before artifacts are built.
5. **Important limitation:** Android sideload updates cannot install silently; the user must still confirm APK installation.

To trigger a release manually:
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```
