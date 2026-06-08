# Desktop Shell via Tauri + SQLite Adapter Seam

## Goal

Create desktop runtime path without changing web app behavior. Tauri shell hosts existing Vite React app, while persistence goes through storage adapter seam so Dexie stays web default and SQLite can become desktop default.

## Boundary

```text
React features
  -> repository/service functions
  -> LocalStoreAdapter interface
  -> Dexie adapter on web
  -> SQLite adapter on Tauri desktop
```

Do not import Tauri APIs inside feature UI. Keep desktop code behind adapter detection and service boundary.

## Recommended scaffold

```txt
src/services/local-store/
  adapter.ts
  runtime.ts
  dexie-adapter.ts
  sqlite-adapter.ts
  index.ts
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/main.rs
planning/desktop-tauri-sqlite-adapter.md
```

## File responsibilities

- `src/services/local-store/adapter.ts` — shared TypeScript contract for local operational data, outbox, conflicts, and sync metadata.
- `src/services/local-store/runtime.ts` — detect `web` vs `desktop` and select adapter.
- `src/services/local-store/dexie-adapter.ts` — wrap existing `src/services/local-db/client.ts` and existing Dexie tables.
- `src/services/local-store/sqlite-adapter.ts` — call Tauri commands only; no SQL in React features.
- `src-tauri/src/main.rs` — expose SQLite commands for adapter use.
- `src-tauri/tauri.conf.json` — point desktop shell to Vite dev server/build output.

## Adapter contract draft

```ts
export type RuntimeTarget = 'web' | 'desktop'

export type LocalStoreHealth = {
  target: RuntimeTarget
  status: 'ready' | 'unavailable'
  message: string
}

export type LocalStoreAdapter = {
  health(): Promise<LocalStoreHealth>
  list<TRecord>(table: string): Promise<TRecord[]>
  get<TRecord>(table: string, id: string): Promise<TRecord | undefined>
  put<TRecord extends { id: string }>(table: string, record: TRecord): Promise<void>
  delete(table: string, id: string): Promise<void>
  enqueueOutbox(item: {
    id: string
    entityType: string
    entityId: string
    mutationType: string
    payload: unknown
    createdAt: string
  }): Promise<void>
}
```

## Runtime selection draft

```ts
export function getRuntimeTarget(): RuntimeTarget {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? 'desktop' : 'web'
}
```

Use this only in local-store runtime layer. Feature code should import selected adapter from `src/services/local-store/index.ts`.

## Tauri command seam draft

```rust
#[tauri::command]
async fn sqlite_health() -> Result<String, String> {
    Ok("Data lokal desktop siap".to_string())
}
```

Later commands should be table-specific or repository-specific where validation is clearer. Avoid one generic SQL command from frontend.

## SQLite data rules

- Mirror local-first concepts from Dexie: products, customers, sales_orders, payments, inventory, cash, outbox, sync_conflicts, sync_runs.
- Keep stock as movement ledger, not mutable final quantity.
- Keep sync statuses user-facing in Indonesian UI: `Data menunggu sinkron`, `Data sudah aman di cloud`, `Butuh pemeriksaan`, `Coba sinkron ulang`.
- Store timestamps as ISO strings first; optimize later only if needed.

## Safe first tasks

1. Add `@tauri-apps/cli` and initialize `src-tauri` only on desktop branch.
2. Add adapter contract and Dexie wrapper without feature rewrites.
3. Add SQLite health command and desktop runtime detection.
4. Add one vertical slice: products list/read through adapter.
5. Run `npm run check` after each slice.

## Risks

- Rewriting all Dexie calls at once creates high regression risk.
- Generic frontend SQL command creates unsafe boundary.
- Desktop-only imports in shared UI can break web build.
- Divergent schema between Dexie, SQLite, and Postgres can break sync.

## Recommended next scaffold PR

Create only:

```txt
src/services/local-store/adapter.ts
src/services/local-store/runtime.ts
src/services/local-store/dexie-adapter.ts
src/services/local-store/index.ts
```

Then convert one low-risk feature read path to prove seam before Tauri init.
