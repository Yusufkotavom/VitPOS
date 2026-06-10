# Integrasi SQLite via Centralized Wrapper (Pendekatan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengintegrasikan database SQLite native ke dalam shell desktop (Tauri) dan mobile (Capacitor/APK) secara transparan, menggunakan pembungkus database terpusat sehingga kode UI/fitur bisnis React tetap utuh tanpa modifikasi massal.

**Architecture:** Kita membuat runtime switcher di `local-db/client.ts`. Jika berjalan di browser web murni, client akan mendelegasikan perintah database ke Dexie. Jika berjalan di Tauri atau Capacitor, client akan mengarahkan query/mutation ke SQLite adapter. Sistem reaktivitas frontend (`useLiveQuery`) diganti dengan wrapper kustom berbasis pub/sub event emitter agar berjalan seragam di semua platform.

**Tech Stack:** React, TypeScript, Dexie (IndexedDB), `@tauri-apps/plugin-sql` (Tauri SQLite), `@capacitor-community/sqlite` (Capacitor SQLite), Rust (Tauri Backend).

---

## Rincian File yang Akan Dibuat / Diubah

```text
src/services/local-db/
  ├── runtime.ts              <-- Deteksi platform (Web vs Tauri vs Mobile)
  ├── events.ts               <-- Pub/Sub emitter untuk reaktivitas SQLite
  ├── reactivity.ts           <-- Wrapper kustom useLiveQuery
  ├── virtual-table.ts        <-- Wrapper query builder Dexie-like (.where().equals().toArray())
  ├── client.ts               <-- Switcher utama yang mengekspor localDb virtual
  └── adapters/
      └── sqlite.adapter.ts   <-- Implementasi adapter SQLite nyata (Tauri & Capacitor)
```

---

## Rencana Implementasi Langkah-Demi-Langkah

### Task 1: Setup Dependensi & Plugin Konfigurasi
Menambahkan modul JavaScript Tauri SQL ke project desktop agar frontend bisa mengirimkan query SQL ke backend Tauri.

**Files:**
* Modify: [package.json](file:///home/kotacom/VitPOS/package.json)
* Modify: [tauri.conf.json](file:///home/kotacom/VitPOS/apps/desktop/src-tauri/tauri.conf.json)

- [x] **Step 1: Tambahkan dependensi `@tauri-apps/plugin-sql` di package.json root**
  Edit file `package.json` untuk menambahkan dependensi:
  ```json
  "@tauri-apps/plugin-sql": "^2.0.0"
  ```
- [x] **Step 2: Jalankan instalasi dependensi**
  Jalankan perintah:
  ```bash
  npm install --legacy-peer-deps
  ```
- [x] **Step 3: Aktifkan plugin sql di tauri.conf.json**
  Pastikan plugin `sql` diizinkan dalam daftar permissions/capabilities:
  ```json
  "plugins": {
    "sql": {
      "sqlite": ["vitpos.db"]
    }
  }
  ```

---

### Task 2: Implementasi Deteksi Platform & Event Emitter Reaktivitas
Membuat helper untuk mendeteksi runtime target (`web`, `desktop`, `mobile`) dan membuat event emitter sederhana untuk memicu render ulang saat ada data SQLite yang berubah.

**Files:**
* Create: [runtime.ts](file:///home/kotacom/VitPOS/src/services/local-db/runtime.ts)
* Create: [events.ts](file:///home/kotacom/VitPOS/src/services/local-db/events.ts)

- [x] **Step 1: Buat file runtime.ts untuk deteksi target**
  Tulis kode berikut ke dalam `src/services/local-db/runtime.ts`:
  ```typescript
  export type RuntimeTarget = 'web' | 'desktop' | 'mobile'

  export function getRuntimeTarget(): RuntimeTarget {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      return 'desktop'
    }
    // Deteksi Capacitor
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return 'mobile'
    }
    return 'web'
  }
  ```
- [x] **Step 2: Buat file events.ts untuk pub/sub reaktivitas**
  Tulis kode berikut ke dalam `src/services/local-db/events.ts`:
  ```typescript
  class TableEventEmitter {
    private listeners = new Set<() => void>()

    subscribe(listener: () => void) {
      this.listeners.add(listener)
      return () => {
        this.listeners.delete(listener)
      }
    }

    emit(tableName: string) {
      for (const listener of this.listeners) {
        listener()
      }
    }
  }

  export const tableEvents = new TableEventEmitter()
  ```

---

### Task 3: Kustomisasi useLiveQuery Wrapper
Membuat wrapper `useLiveQuery` kustom. Jika di browser web biasa, ia akan menggunakan Dexie `useLiveQuery` bawaan. Jika di desktop/mobile, ia akan menggunakan React state + subscription event emitter dari `events.ts`.

**Files:**
* Create: [reactivity.ts](file:///home/kotacom/VitPOS/src/services/local-db/reactivity.ts)

- [x] **Step 1: Buat reactivity.ts**
  Tulis kode berikut ke dalam `src/services/local-db/reactivity.ts`:
  ```typescript
  import { useState, useEffect, useRef } from 'react'
  import { useLiveQuery as rawUseLiveQuery } from 'dexie-react-hooks'
  import { getRuntimeTarget } from './runtime'
  import { tableEvents } from './events'

  export function useLiveQuery<T>(querier: () => Promise<T> | T, deps: any[] = [], defaultResult?: T): T {
    const target = getRuntimeTarget()
    
    if (target === 'web') {
      return rawUseLiveQuery(querier, deps, defaultResult) as T
    }

    // SQLite custom reactivity (Tauri & Capacitor)
    const [result, setResult] = useState<T>(defaultResult as T)
    const querierRef = useRef(querier)
    querierRef.current = querier

    useEffect(() => {
      let active = true
      async function run() {
        try {
          const val = await querierRef.current()
          if (active) setResult(val)
        } catch (err) {
          console.error('SQLite query reactivity error:', err)
        }
      }

      run()

      const unsubscribe = tableEvents.subscribe(() => {
        run()
      })

      return () => {
        active = false
        unsubscribe()
      }
    }, deps)

    return result
  }
  ```

---

### Task 4: Parser Query Komposit & Wrapper Tabel Virtual
Membuat parser index komposit (seperti `[tenantId+name]`) menjadi SQL clause yang valid, serta membungkus antarmuka tabel agar mendukung format `.where('col').equals(val).toArray()` Dexie secara virtual untuk SQLite.

**Files:**
* Create: [virtual-table.ts](file:///home/kotacom/VitPOS/src/services/local-db/virtual-table.ts)

- [x] **Step 1: Buat virtual-table.ts**
  Tulis kode parser dan kelas `VirtualTableWrapper` berikut ke `src/services/local-db/virtual-table.ts`:
  ```typescript
  import { getRuntimeTarget } from './runtime'
  import { tableEvents } from './events'
  import { localDb } from './client'
  import { sqliteAdapter } from './adapters/sqlite.adapter'

  export function parseCompositeKey(key: string, value: any): Record<string, any> {
    if (key.startsWith('[') && key.endsWith(']') && Array.isArray(value)) {
      const fields = key.slice(1, -1).split('+')
      const query: Record<string, any> = {}
      fields.forEach((field, index) => {
        query[field.trim()] = value[index]
      })
      return query
    }
    return { [key]: value }
  }

  export class VirtualTableWrapper<T extends { id: string }> {
    constructor(private tableName: string) {}

    private isSQLite() {
      const target = getRuntimeTarget()
      return target === 'desktop' || target === 'mobile'
    }

    async toArray(): Promise<T[]> {
      if (this.isSQLite()) {
        return sqliteAdapter.storageTable<T>(this.tableName).toArray()
      }
      return (localDb as any)[this.tableName].toArray()
    }

    async get(id: string): Promise<T | undefined> {
      if (this.isSQLite()) {
        return sqliteAdapter.storageTable<T>(this.tableName).get(id)
      }
      return (localDb as any)[this.tableName].get(id)
    }

    async put(row: T): Promise<unknown> {
      if (this.isSQLite()) {
        const res = await sqliteAdapter.storageTable<T>(this.tableName).put(row)
        tableEvents.emit(this.tableName)
        return res
      }
      const res = await (localDb as any)[this.tableName].put(row)
      return res
    }

    async delete(id: string): Promise<void> {
      if (this.isSQLite()) {
        await sqliteAdapter.storageTable<T>(this.tableName).delete(id)
        tableEvents.emit(this.tableName)
        return
      }
      await (localDb as any)[this.tableName].delete(id)
    }

    async update(id: string, changes: Partial<T>): Promise<unknown> {
      if (this.isSQLite()) {
        const res = await sqliteAdapter.storageTable<T>(this.tableName).update(id, changes)
        tableEvents.emit(this.tableName)
        return res
      }
      return (localDb as any)[this.tableName].update(id, changes)
    }

    async count(): Promise<number> {
      if (this.isSQLite()) {
        return sqliteAdapter.storageTable<T>(this.tableName).count()
      }
      return (localDb as any)[this.tableName].count()
    }

    async bulkPut(rows: T[]): Promise<unknown> {
      if (this.isSQLite()) {
        const res = await sqliteAdapter.storageTable<T>(this.tableName).bulkPut(rows)
        tableEvents.emit(this.tableName)
        return res
      }
      return (localDb as any)[this.tableName].bulkPut(rows)
    }

    async clear(): Promise<void> {
      if (this.isSQLite()) {
        await sqliteAdapter.storageTable<T>(this.tableName).clear()
        tableEvents.emit(this.tableName)
        return
      }
      await (localDb as any)[this.tableName].clear()
    }

    where(key: string) {
      return {
        equals: (value: any) => {
          const filters = parseCompositeKey(key, value)
          return {
            toArray: async () => {
              if (this.isSQLite()) {
                return sqliteAdapter.queryWhere<T>(this.tableName, filters)
              }
              return (localDb as any)[this.tableName].where(key).equals(value).toArray()
            },
            first: async () => {
              if (this.isSQLite()) {
                const rows = await sqliteAdapter.queryWhere<T>(this.tableName, filters)
                return rows[0]
              }
              return (localDb as any)[this.tableName].where(key).equals(value).first()
            },
            delete: async () => {
              if (this.isSQLite()) {
                await sqliteAdapter.deleteWhere(this.tableName, filters)
                tableEvents.emit(this.tableName)
                return
              }
              await (localDb as any)[this.tableName].where(key).equals(value).delete()
            },
            count: async () => {
              if (this.isSQLite()) {
                const rows = await sqliteAdapter.queryWhere<T>(this.tableName, filters)
                return rows.length
              }
              return (localDb as any)[this.tableName].where(key).equals(value).count()
            }
          }
        }
      }
    }
  }
  ```

---

### Task 5: Implementasi SQLite Adapter Asli (Tauri & Capacitor)
Menulis kode fungsional untuk berinteraksi dengan Tauri SQL Plugin dan Capacitor SQLite di dalam adapter.

**Files:**
* Modify: [sqlite.adapter.ts](file:///home/kotacom/VitPOS/src/services/local-db/adapters/sqlite.adapter.ts)

- [x] **Step 1: Tulis implementasi SQLite adapter nyata**
  Ganti isi file `src/services/local-db/adapters/sqlite.adapter.ts` dengan kode berikut:
  ```typescript
  import { type LocalDbAdapter, type AdapterTable, type LocalDbAdapterMetadata } from '@/services/local-db/adapters'
  import { getRuntimeTarget } from '../runtime'

  let tauriDb: any = null

  async function getTauriDb() {
    if (tauriDb) return tauriDb
    const Database = (await import('@tauri-apps/plugin-sql')).default
    tauriDb = await Database.load('sqlite:vitpos.db')
    return tauriDb
  }

  class SqliteAdapter implements LocalDbAdapter {
    readonly metadata: LocalDbAdapterMetadata = { name: 'sqlite', platform: 'desktop' }

    async init(): Promise<void> {
      const target = getRuntimeTarget()
      if (target === 'desktop') {
        await getTauriDb()
        console.log('SQLite Tauri database loaded')
      } else if (target === 'mobile') {
        // Inisialisasi Capacitor SQLite di sini
        console.log('SQLite Capacitor database loaded (mock/stub)')
      }
    }

    async teardown(): Promise<void> {
      tauriDb = null
    }

    async queryWhere<T>(table: string, filters: Record<string, any>): Promise<T[]> {
      const keys = Object.keys(filters)
      if (keys.length === 0) {
        return this.storageTable<T>(table).toArray()
      }
      const whereClause = keys.map((k) => `"${k}" = ?`).join(' AND ')
      const values = Object.values(filters)
      
      const db = await getTauriDb()
      return db.select(`SELECT * FROM "${table}" WHERE ${whereClause}`, values)
    }

    async deleteWhere(table: string, filters: Record<string, any>): Promise<void> {
      const keys = Object.keys(filters)
      const whereClause = keys.map((k) => `"${k}" = ?`).join(' AND ')
      const values = Object.values(filters)
      
      const db = await getTauriDb()
      await db.execute(`DELETE FROM "${table}" WHERE ${whereClause}`, values)
    }

    storageTable<T extends { id: string }>(tableName: string): AdapterTable<T> {
      return {
        toArray: async () => {
          const db = await getTauriDb()
          return db.select(`SELECT * FROM "${tableName}"`)
        },
        get: async (id: string) => {
          const db = await getTauriDb()
          const rows = await db.select(`SELECT * FROM "${tableName}" WHERE id = ? LIMIT 1`, [id])
          return rows[0] || undefined
        },
        put: async (row: T) => {
          const db = await getTauriDb()
          const keys = Object.keys(row)
          const cols = keys.map(k => `"${k}"`).join(', ')
          const placeholders = keys.map(() => '?').join(', ')
          const values = Object.values(row).map(v => typeof v === 'object' ? JSON.stringify(v) : v)

          // SQLite INSERT OR REPLACE
          await db.execute(
            `INSERT OR REPLACE INTO "${tableName}" (${cols}) VALUES (${placeholders})`,
            values
          )
          return row.id
        },
        delete: async (id: string) => {
          const db = await getTauriDb()
          await db.execute(`DELETE FROM "${tableName}" WHERE id = ?`, [id])
        },
        update: async (id: string, changes: Partial<T>) => {
          const db = await getTauriDb()
          const keys = Object.keys(changes)
          const setClause = keys.map(k => `"${k}" = ?`).join(', ')
          const values = Object.values(changes).map(v => typeof v === 'object' ? JSON.stringify(v) : v)
          values.push(id)

          await db.execute(
            `UPDATE "${tableName}" SET ${setClause} WHERE id = ?`,
            values
          )
        },
        count: async () => {
          const db = await getTauriDb()
          const res = await db.select(`SELECT COUNT(*) as cnt FROM "${tableName}"`)
          return (res[0] as any)?.cnt || 0
        },
        bulkPut: async (rows: T[]) => {
          for (const row of rows) {
            await this.storageTable<T>(tableName).put(row)
          }
        },
        clear: async () => {
          const db = await getTauriDb()
          await db.execute(`DELETE FROM "${tableName}"`)
        }
      }
    }

    async runInTransaction<T>(): Promise<T> {
      throw new Error('SQLite transactions via Tauri plugin not fully structured yet.')
    }
  }

  export const sqliteAdapter = new SqliteAdapter()
  ```

---

### Task 6: Konfigurasi Virtual Database Client Switcher
Menghubungkan adapter Dexie dan SQLite ke objek `localDb` utama sehingga modul lain otomatis menggunakan database yang tepat sesuai platform.

**Files:**
* Modify: [client.ts](file:///home/kotacom/VitPOS/src/services/local-db/client.ts)

- [x] **Step 1: Modifikasi client.ts untuk mengekspor virtual database**
  Edit bagian akhir file `client.ts` untuk mengekspor database virtual:
  ```typescript
  // Simpan instance asli Dexie sebagai internal
  const rawLocalDb = new VitposLocalDb()
  export { rawLocalDb as localDb }

  // Buat objek virtual db yang membungkus semua table properties dengan VirtualTableWrapper
  import { VirtualTableWrapper } from './virtual-table'

  export const dbVirtual = {
    users: new VirtualTableWrapper<any>('users'),
    tenants: new VirtualTableWrapper<any>('tenants'),
    tenantMembers: new VirtualTableWrapper<any>('tenantMembers'),
    products: new VirtualTableWrapper<any>('products'),
    productCategories: new VirtualTableWrapper<any>('productCategories'),
    customers: new VirtualTableWrapper<any>('customers'),
    salesOrders: new VirtualTableWrapper<any>('salesOrders'),
    salesOrderItems: new VirtualTableWrapper<any>('salesOrderItems'),
    payments: new VirtualTableWrapper<any>('payments'),
    stockMovements: new VirtualTableWrapper<any>('stockMovements'),
    inventory: new VirtualTableWrapper<any>('inventory'),
    cash: new VirtualTableWrapper<any>('cash'),
    cashCategories: new VirtualTableWrapper<any>('cashCategories'),
    settings: new VirtualTableWrapper<any>('settings'),
    paymentMethods: new VirtualTableWrapper<any>('paymentMethods'),
    shifts: new VirtualTableWrapper<any>('shifts'),
    suppliers: new VirtualTableWrapper<any>('suppliers'),
    purchases: new VirtualTableWrapper<any>('purchases'),
    purchaseItems: new VirtualTableWrapper<any>('purchaseItems'),
    returns: new VirtualTableWrapper<any>('returns'),
    returnItems: new VirtualTableWrapper<any>('returnItems'),
    serviceOrders: new VirtualTableWrapper<any>('serviceOrders'),
    recipes: new VirtualTableWrapper<any>('recipes'),
    productionBatches: new VirtualTableWrapper<any>('productionBatches'),
    outbox: new VirtualTableWrapper<any>('outbox'),
    syncConflicts: new VirtualTableWrapper<any>('syncConflicts'),
    syncRuns: new VirtualTableWrapper<any>('syncRuns'),
    
    // Fallback info
    isOpen: () => rawLocalDb.isOpen(),
    open: () => rawLocalDb.open(),
    close: () => rawLocalDb.close(),
  }
  ```

---

### Task 7: Konfigurasi Migrasi Database di Rust Tauri
Mempersiapkan schema tabel database SQLite lokal di Rust Tauri (`main.rs`) saat inisialisasi aplikasi pertama kali.

**Files:**
* Modify: [main.rs](file:///home/kotacom/VitPOS/apps/desktop/src-tauri/src/main.rs:30-40)

- [x] **Step 1: Daftarkan migrasi schema SQLite di main.rs**
  Edit vector migrasi di `apps/desktop/src-tauri/src/main.rs` untuk menambahkan pembuatan tabel SQLite (mirip schema Dexie):
  ```rust
  tauri_plugin_sql::Builder::new()
      .add_migrations(
          "sqlite:vitpos.db",
          vec![
              tauri_plugin_sql::Migration {
                  version: 1,
                  description: "create initial tables",
                  sql: "
                      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, name TEXT, passwordHash TEXT, createdAt TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT, type TEXT, phone TEXT, planCode TEXT, isActive INTEGER, createdAt TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS tenantMembers (id TEXT PRIMARY KEY, tenantId TEXT, userId TEXT, role TEXT, isActive INTEGER, createdAt TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, category TEXT, type TEXT, price REAL, stock REAL, sku TEXT, barcode TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS productCategories (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, description TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, phone TEXT, city TEXT, receivable REAL, orders INTEGER, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS salesOrders (id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, customerId TEXT, customerName TEXT, date TEXT, subtotal REAL, discountTotal REAL, taxTotal REAL, grandTotal REAL, paidTotal REAL, notes TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS salesOrderItems (id TEXT PRIMARY KEY, tenantId TEXT, salesOrderId TEXT, productId TEXT, productName TEXT, qty REAL, price REAL, discount REAL, total REAL);
                      CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, tenantId TEXT, ref TEXT, salesOrderId TEXT, serviceOrderId TEXT, purchaseId TEXT, source TEXT, method TEXT, amount REAL, date TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS stockMovements (id TEXT PRIMARY KEY, tenantId TEXT, productId TEXT, productName TEXT, warehouseId TEXT, warehouseName TEXT, type TEXT, qty REAL, referenceType TEXT, referenceId TEXT, notes TEXT, syncStatus TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS cash (id TEXT PRIMARY KEY, tenantId TEXT, ref TEXT, date TEXT, account TEXT, category TEXT, income REAL, expense REAL, status TEXT);
                      CREATE TABLE IF NOT EXISTS cashCategories (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, type TEXT, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, tenantId TEXT, area TEXT, setting TEXT, value TEXT, status TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS paymentMethods (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, provider TEXT, type TEXT, accountNumber TEXT, accountName TEXT, status TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, tenantId TEXT, cashierName TEXT, startTime TEXT, endTime TEXT, startCash REAL, expectedCash REAL, actualCash REAL, difference REAL, status TEXT);
                      CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, tenantId TEXT, name TEXT, phone TEXT, city TEXT, payable REAL, orders INTEGER, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, supplierId TEXT, supplierName TEXT, date TEXT, subtotal REAL, grandTotal REAL, paidTotal REAL, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS purchaseItems (id TEXT PRIMARY KEY, tenantId TEXT, purchaseId TEXT, productId TEXT, productName TEXT, qty REAL, cost REAL, total REAL);
                      CREATE TABLE IF NOT EXISTS returns (id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, type TEXT, referenceCode TEXT, date TEXT, total REAL, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS returnItems (id TEXT PRIMARY KEY, tenantId TEXT, returnId TEXT, productId TEXT, productName TEXT, qty REAL, price REAL, total REAL);
                      CREATE TABLE IF NOT EXISTS serviceOrders (id TEXT PRIMARY KEY, tenantId TEXT, code TEXT, customerId TEXT, customerName TEXT, description TEXT, date TEXT, cost REAL, paidTotal REAL, status TEXT, syncStatus TEXT, version INTEGER, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS recipes (id TEXT PRIMARY KEY, tenantId TEXT, productId TEXT, productName TEXT, name TEXT, batchYield REAL, status TEXT, updatedAt TEXT);
                      CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, tenantId TEXT, entityType TEXT, entityId TEXT, mutationType TEXT, payload TEXT, status TEXT, attempts INTEGER, errorMessage TEXT, createdAt TEXT, updatedAt TEXT, syncedAt TEXT);
                      CREATE TABLE IF NOT EXISTS syncConflicts (id TEXT PRIMARY KEY, tenantId TEXT, entityType TEXT, entityId TEXT, localPayload TEXT, serverPayload TEXT, status TEXT, reason TEXT, createdAt TEXT, resolvedAt TEXT);
                      CREATE TABLE IF NOT EXISTS syncRuns (id TEXT PRIMARY KEY, tenantId TEXT, status TEXT, startedAt TEXT, finishedAt TEXT, processed INTEGER, failed INTEGER, pulled INTEGER);
                  ",
              }
          ]
      )
  ```

---

## 8. Pengujian & Verifikasi End-to-End

### Pengujian Lokal (Tauri)
1. Jalankan tauri dev server: `npm run dev` dan `npm run tauri dev`.
2. Buka DevTools di aplikasi desktop Tauri.
3. Periksa tab Console untuk memverifikasi log: `SQLite Tauri database loaded`.
4. Lakukan penambahan data produk baru (misal: "Barang A" seharga `Rp 50.000`).
5. Verifikasi di SQLite database apakah data ter-insert dengan benar.

### Verifikasi Sync ke Server
1. Hubungkan aplikasi web ke backend lokal API (`http://localhost:3010`).
2. Buat beberapa transaksi di mode offline. Periksa data tersimpan di antrean *outbox*.
3. Aktifkan koneksi internet (simulasi online) dan tekan tombol "Sinkronkan Sekarang" di halaman Sinkronisasi Offline.
4. Pastikan data terkirim ke REST API `/sync/push` Hono dan masuk ke database cloud.
5. Lakukan reload dan pastikan data terunduh dari API `/sync/pull` Hono dan tersimpan di database lokal.
