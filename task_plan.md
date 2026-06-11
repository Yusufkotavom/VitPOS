# Task Plan: Implement Tauri SQL Adapter for Desktop

## Goal
Add SQLite adapter support for Tauri (desktop) so the app uses native SQLite via Tauri's SQL plugin instead of IndexedDB/Dexie in the webview.

## Phases

### Phase 1: Explore Current Tauri & SQLite Setup
- [x] Inspect `apps/desktop/` structure, Tauri config, Rust/Cargo files
- [x] Examine existing SQLite adapter (`sqlite.adapter.ts`) - how it works, what it needs
- [x] Check factory (`adapters/factory.ts`) platform detection logic
- [x] Research Tauri SQL plugin API
- [x] Document findings in findings.md

### Phase 2: Install & Configure Tauri SQL Plugin
- [x] Install `@tauri-apps/plugin-sql` in root frontend
- [x] Register plugin in Tauri Rust backend (already done)
- [x] Configure permissions in `capabilities/` (already done)
- [x] Validate plugin loads at runtime (config has preload)

### Phase 3: Build Tauri SQL Adapter
- [x] Create `tauri-sql.adapter.ts` in `src/services/local-db/adapters/`
- [x] Implement `AdapterTable<T>` interface (toArray, get, put, delete, update, count, bulkGet, bulkPut, clear, where)
- [x] Implement `runInTransaction` using Tauri SQL transaction API
- [x] Register adapter in factory with Tauri platform check
- [x] Typecheck & test

### Phase 4: Integrate & Test
- [x] Typecheck passes
- [x] All 138 tests pass
- [x] Build succeeds
- [x] Verify no regression on web (Dexie adapter still works)

## Decisions
- Used `@tauri-apps/plugin-sql@^2.4.0` (latest, matches `@tauri-apps/api@^2.11.0`)
- Adapter pattern follows same interface as DexieAdapterTable and SqliteAdapterTable
- Platform detection: `window.__TAURI__` || `window.__TAURI_INTERNALS__`
- Schema initialization handled in JS adapter's `init()` (same pattern as Capacitor SQLite adapter)
- Tauri bind params use `$1, $2` style
- No `executeSet` available → bulkPut iterates over individual puts
