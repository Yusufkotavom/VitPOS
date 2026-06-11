# Findings: Tauri SQLite Adapter

## Exploration Results (Phase 1 complete)

### Tauri Backend Already Configured
- `apps/desktop/src-tauri/Cargo.toml` already has `tauri-plugin-sql` with `sqlite` feature
- `apps/desktop/src-tauri/src/main.rs` already registers `tauri_plugin_sql::Builder::new()` with `sqlite:vitpos.db`
- Migrations are empty (placeholder: "Initial schema will be added when SQLite adapter is implemented")
- `apps/desktop/src-tauri/capabilities/default.json` has `"sql:default"` permission
- `apps/desktop/src-tauri/tauri.conf.json` has `sql` plugin config with `"sqlite:vitpos.db"` preloaded

### Frontend Package
- `@tauri-apps/plugin-sql` was NOT installed (version ^2.4.0 installed now)
- `@tauri-apps/api` already at ^2.11.0

### Adapter API (from type definitions)
- `Database.load(path)` - async static method, returns Database instance
- `Database.get(path)` - sync static, defers connection
- `db.execute(query, bindValues?)` - returns `{ rowsAffected, lastInsertId }`
- `db.select<T>(query, bindValues?)` - returns `T[]` directly (not wrapped)
- `db.close()` - close connection
- Bind parameters use `$1, $2` style (SQLite supports this)
- No `executeSet` for batch operations

### Platform Detection
- Tauri detected via `window.__TAURI__` or `window.__TAURI_INTERNALS__`
- `Capacitor.isNativePlatform()` is false in Tauri context

### Factory Logic (updated)
1. Check `isTauri()` → `tauriSqlAdapter`
2. Check `Capacitor.isNativePlatform()` → `sqliteAdapter` (Capacitor)
3. Fallback → `dexieAdapter`

### Adapter Metadata
- Existing SQLite adapter: `{ name: 'sqlite', platform: 'mobile' }`
- New Tauri SQL adapter: `{ name: 'tauri-sql', platform: 'desktop' }`
- Add `'tauri-sql'` to `LocalDbAdapterName` union type
