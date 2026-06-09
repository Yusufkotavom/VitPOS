# KOTACOM Business Suite

KOTACOM Business Suite adalah aplikasi SaaS POS + CRM + accounting ringan untuk UMKM Indonesia dengan target **web + Android + desktop**.

## Engine delivery

Project sekarang diarahkan ke 4 engine paralel:

1. **Web App** — Vite React SPA, UI utama, Dexie local-first
2. **Backend API** — Hono + Drizzle + PostgreSQL, deploy Vercel terpisah
3. **Android Shell** — Capacitor + SQLite adapter
4. **Desktop Shell** — Tauri + SQLite adapter

Plan utama parallel-agent ada di:

- `docs/superpowers/plans/2026-06-07-kotacom-multi-track.md`

## Status saat ini

Sudah ada:

- app shell responsive dengan shadcn sidebar
- login, tenant selector, onboarding UI mock
- multi-tenant local isolation per `activeTenant.id`
- dashboard modular
- POS foundation + summary strip + held draft banner
- POS checkout terintegrasi ke sales order, payment, stock movement, dan customer receivable
- invoice manual terintegrasi ke payment record dan history pembayaran riil
- halaman admin dasar reusable
- local-first runtime via Dexie
- live Dexie hooks untuk products, customers, sales orders, payments, inventory, cash
- sync queue/conflict UI
- Drizzle schema untuk PostgreSQL
- Neon/Postgres connection-ready
- Vitest setup

## Struktur proyek saat ini

```txt
src/
  app/
  components/ui/
  db/
  features/
  lib/
  services/
  shared/
  stores/
```

## Environment

1. Copy `.env.example` ke `.env.local`
2. Isi `DATABASE_URL`
3. Set `VITE_API_BASE_URL` saat web harus bicara ke API terpisah

```bash
cp .env.example .env.local
```

## Database

Lihat:

- `docs/architecture/database.md`
- `drizzle.config.ts`
- `src/db/schema/index.ts`
- `src/db/db.ts`

Script database:

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:push`
- `npm run db:studio`

## Development

Web app:

```bash
npm install
npm run dev
```

Backend API:

```bash
npm run api:dev
```

## Verification

Web:

```bash
npm run check
```

API:

```bash
npm run api:check
```

Android shell:

```bash
npm run mobile:check
```

Desktop shell:

```bash
npm run desktop:check
```

`npm run check` menjalankan:

- lint
- typecheck
- test
- build

`npm run api:check` menjalankan:

- API test
- API typecheck
- API build

`npm run mobile:check` memvalidasi konfigurasi Capacitor dan memastikan build web tersedia untuk shell Android.

`npm run desktop:check` memvalidasi scaffold Tauri tanpa perlu Rust toolchain lokal.

## Multi-Tenant

App sekarang memakai model `1 user -> banyak tenant/usaha`.

Aturan utamanya:

- `users`, `tenants`, dan `tenantMembers` tetap global untuk auth
- semua data operasional wajib punya `tenantId`
- semua list/detail operasional dibaca berdasarkan `activeTenant.id`
- onboarding tenant baru hanya membuat seed data untuk tenant yang baru dibuat

Entitas operasional yang sudah ditenantkan mencakup:

- products
- product categories
- customers
- sales orders dan items
- payments
- stock movements
- inventory
- cash dan cash categories
- settings dan payment methods
- shifts
- suppliers
- purchases dan items
- returns dan items
- service orders

Implikasi pemakaian:

1. Login
2. Pilih usaha di tenant selector
3. Semua dashboard, POS, customer, invoice, stok, dan settings hanya membaca data tenant aktif
4. Jika pindah usaha, data layar ikut pindah karena query terfilter `tenantId`

## Status Integrasi Transaksi

Yang sudah terintegrasi penuh untuk slice transaksi inti:

- POS checkout membuat `salesOrder`, `salesOrderItems`, `payment`, `stockMovements`
- POS checkout menyimpan `customerId` jika pelanggan dipilih
- invoice detail menerima pembayaran dengan membuat row `payments` sungguhan
- customer `orders` dan `receivable` dihitung ulang dari invoice tenant aktif
- WhatsApp POS dan invoice memakai template `invoice`
- history pembayaran invoice dibaca dari tabel `payments`, bukan mock UI

Yang masih belum penuh:

- print/PDF invoice dan service order masih dalam iterasi
- service order payment/settlement khusus masih belum ada
- purchase payment/hutang supplier settlement masih belum ada
- recipe/BOM belum terhubung ke proses produksi atau pengurangan bahan otomatis dari POS

## Service Order

Status implementasi saat ini:

- service order sudah tenant-scoped
- create/edit akan mencoba resolve `customerId` dari nama customer tenant aktif
- detail page WhatsApp juga memakai customer terhubung bila tersedia
- customer detail sekarang membaca service order via `customerId` atau fallback nama

Belum penuh:

- payment khusus service order
- timeline kerja yang persisted
- sinkron cloud penuh untuk `service_order`

## Purchase Receiving

Status implementasi saat ini:

- create/edit purchase order sudah mencoba resolve `supplierId`
- item PO akan mencoba resolve `productId` dari produk tenant aktif
- aksi `Terima Barang` akan:
  - ubah status PO ke `Diterima`
  - buat `stockMovements` tipe `purchase`
  - update stok produk
  - update tabel inventory
  - hitung ulang `supplier.orders` dan `supplier.payable`

Belum penuh:

- hutang supplier settlement/payment
- riwayat receiving per PO
- sinkron cloud penuh untuk `purchase` dan `supplier`

## Recipe / BOM

Status implementasi saat ini:

- modul `Resep / BOM` sudah tersedia di `/products/recipes`
- Dexie sudah punya tabel `recipes`
- recipe terhubung ke produk jadi dan daftar bahan baku tenant aktif
- CRUD dasar sudah tersedia

Belum penuh:

- HPP/costing otomatis
- produksi batch
- konsumsi bahan otomatis saat POS checkout
- sinkron cloud untuk `recipe`

## Agent reporting

Setiap agent selesai harus update:

- `docs/agent-changelog.md`

Isi minimal:

- status done / partial / failed
- file yang disentuh
- verifikasi yang dijalankan
- gap yang masih tersisa

## Catatan penting

- `.env.local` dipakai untuk secret lokal dan sudah di-ignore.
- Web local DB pakai Dexie.
- Android/Desktop akan pakai SQLite adapter.
- Cloud DB siap pakai PostgreSQL, termasuk Neon atau Supabase.
- Backend tetap terpisah dari frontend dan deploy ke Vercel sendiri.
- Schema stok memakai `stock_movements`, bukan angka stok final tunggal.
