# Desktop Integrations Architecture

## Overview

KOTACOM Business Suite targets web, Android, and desktop. The desktop shell runs on Tauri.

**Golden Rule:** The React feature code must never directly import `@tauri-apps/api`. All native integrations must go through adapter seams.

## Integration Seams

### 1. Local Data (SQLite vs Dexie)

The web app uses Dexie (IndexedDB). The desktop app will use SQLite for persistence to bypass browser storage quotas and enable native database backups.

**Boundary:**
`src/services/local-store/adapter.ts` provides the `LocalStoreAdapter` interface.

```typescript
export type LocalStoreAdapter = {
  health(): Promise<{ target: 'web' | 'desktop', status: string }>;
  list<T>(table: string): Promise<T[]>;
  get<T>(table: string, id: string): Promise<T | undefined>;
  put<T>(table: string, record: T): Promise<void>;
}
```

The runtime detects the environment (`window.__TAURI_INTERNALS__`) and instantiates either `DexieAdapter` or `SqliteAdapter`.

### 2. Printing (Native vs Browser)

POS applications require seamless receipt printing without browser dialogs on desktop.

**Boundary:**
`src/services/print/adapter.ts`

- Web: Uses standard `window.print()` or hidden iframe printing
- Desktop: Uses Tauri command `invoke('print_receipt', { htmlContent })`

### 3. File System (Native vs Browser Downloads)

Exporting reports or database backups requires file system access.

**Boundary:**
`src/services/fs/adapter.ts`

- Web: Uses `Blob` and standard `<a>` download attributes
- Desktop: Uses Tauri command `invoke('export_to_file', { filename, content })`

## Implementation Guidelines

1. **Feature isolation:** React components only import from `src/services/*/index.ts`. They do not know if they are running in web or Tauri.
2. **Graceful degradation:** If a Tauri command fails or is not implemented yet, the adapter should fall back or fail gracefully with a user-facing Indonesian error message.
3. **No generic SQL:** Do not pass generic SQL queries from frontend to backend. Implement specific Tauri commands or use the `tauri-plugin-sql` securely.

## Tauri Shell Constraints

- Keep the Tauri shell minimal. Business logic stays in TypeScript.
- The `src-tauri` directory should only contain setup, plugin initialization, and specific seam commands.
- We do not over-engineer the Rust backend since the primary "backend" is the shared Vercel API.
