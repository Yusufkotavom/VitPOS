# VitPOS / KOTACOM Business Suite

Offline-first POS, CRM & Accounting untuk UKM Indonesia. Satu kode React untuk Web (PWA), Android (Capacitor), dan Desktop (Tauri).

## Arsitektur

## Documentation

- [Documentation Index](docs/README.md)
- [Architecture Docs](docs/architecture/README.md)
- [Sync Engine](docs/SYNC_ENGINE.md)
- [Superpowers Plans and Specs](docs/superpowers/README.md)

```text
src/
├── app/              # Router, providers, navigation config
├── components/       # Global UI primitives (shadcn/ui)
├── features/         # 23 modul bisnis (pos, products, sales-orders, dll)
│   └── feature-x/
│       ├── components/
│       ├── hooks/
│       ├── schemas/   # Zod + react-hook-form
│       └── pages/
├── services/
│   ├── local-db/     # Jantung offline-first — lihat diagram bawah
│   ├── sync/         # Outbox sync engine
│   └── api/          # HTTP client
├── shared/
│   ├── components/   # Layout, sync indicator, dll
│   └── utils/
├── db/               # Drizzle ORM schema (cloud Postgres)
├── lib/              # Utility helpers
└── types/
```

### Offline-First Engine (local-db)

Ini layer paling kritis. Semua operasi baca/tulis lewat abstraction ini, bukan langsung ke Dexie atau SQLite.

```text
┌─────────────────────────────────────────────────────┐
│  feature code (repository.upsert, localDb.table.x)  │
├─────────────────────────────────────────────────────┤
│  client.ts  ──  Proxy ke adapter                    │
│    - Lazy: storageTable() dipanggil pas method       │
│      diakses, bukan pas module dievaluasi            │
│    - Emulasi method Dexie (where, orderBy, dll)      │
│      untuk adapter yg ga punya                      │
├─────────────────────────────────────────────────────┤
│  factory.ts  ──  pilih adapter sesuai platform       │
│    Web    → dexieAdapter (IndexedDB)                 │
│    Mobile → sqliteAdapter (Capacitor SQLite)         │
│    Tauri  → tauriSqlAdapter (dynamic import)         │
├─────────────────────────────────────────────────────┤
│  sqlite.adapter.ts   │  indexeddb.adapter.ts        │
│  (CREATE TABLE,      │  (Dexie wrapper)              │
│   ALTER TABLE migrasi)│                              │
└─────────────────────────────────────────────────────┘
```

### Alur Init & Lazy Loading

```
AppProviders.useEffect → bootstrapLocalDb() → initLocalDb()
                                                    │
                    ┌───────────────────────────────┘
                    ▼
          adapter.init() (buka koneksi SQLite / open Dexie)

Sementara itu, komponen React mungkin akses repository.
Dulu ini CRASH (storageTable throw karena db blom init).
Sekarang aman karena client.ts pake Proxy lazy:

  localDb.products  →  return Proxy (blom panggil storageTable)
  proxy.get('toArray')  →  baru panggil storageTable() → pake koneksi db
```

### Alur Save (Repository + Outbox)

```
User klik Save
  → handleSubmit (try/catch → toast.error bila gagal)
  → productRepository.upsert(data)
      → table.put(data)          # simpan ke SQLite / IndexedDB
      → enqueueMutation(...)     # tulis ke tabel outbox
          → outbox.put({ entityType, entityId, mutationType, payload, status: 'queued', attempts: 0 })
  → toast.success()
  → setFormOpen(false)
```

Outbox kemudian diproses oleh `sync-engine.ts` secara berkala (tiap 15 detik via `useAutoSync`).

### Platform Targets

| Target | Shell | Local DB | Build |
|--------|-------|----------|-------|
| Web (PWA) | Vite dev server | IndexedDB (Dexie) | `npm run build` |
| Android | Capacitor (`apps/mobile/`) | `@capacitor-community/sqlite` | `npm run build && cd apps/mobile && npm run build:android` |
| Desktop | Tauri (`apps/desktop/`) | `@tauri-apps/plugin-sql` | `npm run build && cd apps/desktop && cargo tauri build` |

## Prasyarat

- Node.js 22+
- Java 21+ (untuk build Android)
- Android SDK (untuk build Android)

## Development

```bash
# Web (development)
npm install
npm run dev              # Vite + Hono API concurrently

# Cek kualitas
npm run check            # lint → typecheck → test → build

# Script penting lain
npm run test             # vitest
npm run lint             # eslint
npm run typecheck        # tsc --noEmit

# Database (cloud Postgres)
npm run db:generate      # Generate migration Drizzle
npm run db:migrate       # Apply migration
npm run db:studio        # Drizzle Studio UI
```

## Android

### Build APK

```bash
npm run build                                    # build web dulu
cd apps/mobile
npm install                                      # include @capacitor-community/sqlite
npx cap sync                                     # sync plugin ke Android project
npm run build:android                            # build APK
# APK output: apps/mobile/android/app/build/outputs/apk/release/
```

### Cek Log

```bash
# USB debug
adb logcat -c && adb logcat | grep -i "error\|vitpos\|sqlite\|capacitor"

# Filter console.log dari webview
adb logcat -s "Capacitor/Console"

# Chrome DevTools remote debug
# Buka chrome://inspect → inspect VitPOS → lihat Console & Network

# Android Studio
# Buka apps/mobile/android/ → Tab Logcat → filter com.kotacom.vitpos
```

### CI Release

Tag `v*` push → GitHub Actions build APK otomatis & attach ke Release.

```bash
git tag v1.2.0 && git push origin v1.2.0
```

## Architecture Decisions

### Kenapa Proxy + Adapter Pattern?

Agar semua kode fitur (POS, produk, sales order) **tidak peduli** backend database-nya. Kode cukup panggil `localDb.products.put(...)`. Di web dia pake Dexie, di Android pake SQLite native — tanpa import kondisional atau platform check di tiap file.

### Kenapa Lazy Proxy?

Karena module dievaluasi saat import. Dulu `repository.ts` akses `localDb.settings` di module level → langsung panggil `adapter.storageTable('settings')` → throw karena SQLite blom `init()`. Sekarang Proxy menunda panggilan `storageTable()` sampai method beneran dipanggil (pas user action atau useEffect jalan).

### Sync Engine & Local Adapters
Penjelasan teknis detail mengenai penanganan gap arsitektur SQLite/Tauri SQL dengan JSON dan boolean (serta _fallback_ mitigasinya) dapat dibaca di **[Dokumentasi Sync Engine & Adapters](docs/SYNC_ENGINE.md)**.

### Schema SQLite vs TypeScript

Semua SQLite schema didefinisikan di `sqlite.adapter.ts:298-325`. **Setiap kolom harus cocok** dengan tipe TypeScript di `schema.ts`. Migrasi kolom baru ditambah via `ALTER TABLE` di `initializeSchema()` — lihat pattern `outbox.attempts`.

## Cara Nambah Fitur Baru

1. Tambah schema TypeScript di `schema.ts`
2. Tambah definisi tabel di `sqlite.adapter.ts` (`tableSchemas`)
3. Tambah ALTER TABLE migration bila kolom baru
4. Buat repository baru di `repository.ts` (atau pake yg ada)
5. Buat fitur di `src/features/` dengan struktur:
   ```
   components/    # Form, table, dialog
   hooks/         # Custom hooks
   schemas/       # Zod validation
   pages/         # Full page (untuk router)
   ```
6. Form submit handler WAJIB punya **try/catch + toast.error**

## Struktur Fitur (23 modul)

| Feature | Path | Description |
|---------|------|-------------|
| auth | `features/auth/` | Login, register, onboarding |
| pos | `features/pos/` | Point of Sale — cart, checkout, payment |
| products | `features/products/` | CRUD produk, kategori, resep |
| sales-orders | `features/sales-orders/` | Pesanan penjualan |
| customers | `features/customers/` | Manajemen pelanggan |
| payments | `features/payments/` | Riwayat pembayaran |
| purchases | `features/purchases/` | Pembelian supplier |
| suppliers | `features/suppliers/` | Manajemen supplier |
| stock | `features/inventory/` | Stok & gudang |
| returns | `features/returns/` | Retur penjualan & pembelian |
| service-orders | `features/service-orders/` | Pesanan jasa/service |
| reports | `features/reports/` | Laporan penjualan, pembayaran |
| cash | `features/cash/` | Buku kas |
| shift | `features/shift/` | Shift kasir |
| settings | `features/settings/` | Pengaturan toko, payment method |
| sync | `features/sync/` | Pusat sinkronisasi |
| billing | `features/billing/` | Subscription & billing |
| dashboard | `features/dashboard/` | Dashboard utama |
| platform-admin | `features/platform-admin/` | Admin panel SaaS |
| updates | `features/updates/` | Update announcer |
| catalog | `features/catalog/` | Shared catalog libs |
| production | `features/production/` | Produksi / BOM |
| recipes | `features/recipes/` | Resep produksi |
