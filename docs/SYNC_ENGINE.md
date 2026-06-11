# Sync Engine & Local Database Adapters

This document details the sync architecture and gap mitigations implemented for VitPOS across all its supported platforms: Web (Dexie), Mobile (Capacitor SQLite), and Desktop (Tauri SQL).

## Architecture Overview

VitPOS uses a local-first architecture. All read and write operations from the application UI interact exclusively with a unified local database wrapper (`LocalDb`). 

Behind the scenes, `LocalDb` uses a specific adapter depending on the runtime platform:
- **Dexie Adapter**: Used on the web. Relies on IndexedDB. Natively supports complex JS objects, booleans, and arrays.
- **Capacitor SQLite Adapter**: Used on Android/iOS. Translates queries to SQL.
- **Tauri SQL Adapter**: Used on Desktop (Windows, macOS, Linux). Translates queries to SQL via Rust.

A background `SyncEngine` periodically pulls remote changes from the server and applies them locally, while an `Outbox` pushes local mutations to the remote server.

## Identified Gaps & Mitigations

Because SQL databases (SQLite) do not natively support Javascript/Typescript complex types (such as `boolean` or `JSON arrays`), a schema impedance mismatch arises between Web (Dexie) and Native (SQLite/Tauri).

To solve this, several deep mitigations are implemented within the SQL adapters and the Sync Engine:

### 1. Boolean & JSON Serialization Gap
**Issue:** SQLite lacks a native `boolean` type, returning `1` and `0` for true/false. Moreover, array fields (like `items` inside a transaction) are returned as raw JSON strings. Without intervention, TypeScript would receive `1`/`0` or strings instead of `boolean`/objects, breaking UI logic and causing type errors.
**Mitigation:** 
- `parseRow()` was introduced in both `sqlite.adapter.ts` and `tauri-sql.adapter.ts`.
- Every row retrieved via `.toArray()`, `.get()`, or `.where()` intercepts the raw result and correctly maps boolean fields (based on a `BOOLEAN_FIELDS` schema definition) back to explicit `true`/`false`.
- It dynamically detects and parses JSON stringified arrays/objects back into proper JS objects.

### 2. Boolean Queries in Where Clauses
**Issue:** Executing a query like `localDb.products.where('manageStock').equals(true)` passes `true` directly to the SQL driver. Some drivers fail to map `true` to `1` automatically, returning empty results.
**Mitigation:**
- The `.where().equals()` implementation in both `sqlite.adapter.ts` and `tauri-sql.adapter.ts` explicitly checks if the query parameter is a boolean or an array of booleans (compound indexes).
- It casts these booleans to `1` and `0` before passing them down to the underlying SQL execution engine.

### 3. Orphaned Item Tables (Sync Integrity)
**Issue:** Complex entities (like Sales Orders, Purchases, and Returns) contain child items. When pulling changes from the cloud, simply overwriting the parent entity is insufficient; the child item tables (e.g., `salesOrderItems`) must also be synced to allow offline analytical queries.
**Mitigation:**
- The `SyncEngine`'s `applyPullItem` explicitly intercepts parent entities that carry `items`.
- It performs a `bulkPut` directly onto the respective item tables (`salesOrderItems`, `purchaseItems`, `returnItems`) during the sync cycle.
- **Frontend Override:** To ensure local creations also populate these item tables immediately without waiting for a sync cycle, the generic `createRepository` factory logic for these entities was overridden in `src/services/local-db/repository.ts`. Calling `.upsert()` from the UI now safely orchestrates updating both the parent table and wiping/replacing the child item tables via a transaction-safe flow.

### 4. Schema Parity
**Issue:** The Tauri SQL adapter was initially missing `attempts` and `errorMessage` columns in its `outbox` table creation script, unlike the SQLite and Dexie equivalents. This could cause desktop crashes during sync failure handling.
**Mitigation:**
- Unified the SQL schema mapping array for the `outbox` table. All tables across all platforms now guarantee exact column and data-type parity.
