# Database Architecture

## Tujuan

Database cloud dipakai buat source of truth lintas device dan lintas cabang. Aplikasi tetap local-first di client, lalu sinkron ke Postgres lewat outbox dan status konflik.

## Stack

- Runtime ORM: Drizzle ORM
- SQL driver: `postgres`
- Database target: PostgreSQL
- Migration tool: `drizzle-kit`
- Local env loader: `dotenv`

Referensi implementasi sekarang:

- `drizzle.config.ts:1`
- `src/db/db.ts:1`
- `src/db/schema/core.ts:1`

## Arsitektur tingkat tinggi

```text
React UI
  -> feature forms / actions
  -> local-first state + Dexie
  -> outbox queue
  -> sync worker / API layer
  -> Postgres (cloud source of truth)
```

Prinsip utama:

1. Tulis operasi bisnis ke local store dulu supaya app tetap jalan saat offline.
2. Kirim perubahan ke cloud sebagai mutation terurut lewat outbox.
3. Simpan jejak status sinkron di record penting dan log outbox.
4. Jangan model stok sebagai satu angka final saja; pakai histori pergerakan stok.

## Boundary local vs cloud

### Local-first layer

Local layer cocok buat:

- draft transaksi
- cart POS aktif
- queue sinkron
- conflict review
- metadata perangkat dan status terakhir sinkron

### Cloud Postgres layer

Cloud layer cocok buat:

- data tenant dan cabang
- master produk dan pelanggan
- sales order final
- pembayaran
- histori pergerakan stok
- audit sinkron level server

## Struktur schema sekarang

Schema utama ada di `src/db/schema/core.ts:1`.

### Organisasi

- `tenants`
- `branches`
- `users`
- `tenant_members`
- `warehouses`

Semua entity bisnis penting ditautkan ke tenant. Ini jaga isolasi data per bisnis.

### Master data

- `product_categories`
- `products`
- `customers`

Record seperti `products` dan `customers` punya:

- `sync_status`
- `version`
- timestamps

Ini cocok buat local-first sync dan conflict detection dasar.

### Penjualan

- `sales_orders`
- `sales_order_items`
- `payments`

`payments` terpisah dari `sales_orders`. Ini penting buat:

- split payment
- partial payment
- refund
- receivable / piutang

### Stok

- `stock_movements`

Stok dimodelkan sebagai movement ledger, bukan kolom `stock_qty` tunggal. Tipe movement sekarang:

- `sale`
- `purchase`
- `return`
- `adjustment`
- `transfer_in`
- `transfer_out`
- `damage_lost`

Hitung stok tersedia dari agregasi movement per produk/gudang, atau simpan projection terpisah nanti bila perlu buat performa.

### Sinkronisasi

- `outbox_logs`

`outbox_logs` simpan mutation yang mau atau sudah dikirim. Kolom penting:

- `device_id`
- `entity_type`
- `entity_id`
- `mutation_type`
- `payload`
- `status`
- `attempts`
- `error_message`

## Enum bisnis

Enum Postgres didefinisikan di `src/db/schema/core.ts:4`:

- `member_role`
- `order_status`
- `payment_method`
- `payment_status`
- `product_type`
- `stock_movement_type`
- `sync_status`

Jaga enum tetap dekat domain bisnis. Tambah enum hanya bila benar perlu validasi level database.

## Koneksi environment

### File yang dipakai

`drizzle.config.ts:4` memuat `.env.local` dulu, lalu fallback ke default env process.

`src/db/db.ts:8` butuh `DATABASE_URL` dan akan throw error bila kosong.

### Rekomendasi file env

- `.env.local` untuk development lokal
- `.env.example` untuk template nilai yang aman dibagikan
- jangan commit secret asli

Contoh isi aman ada di `.env.example`.

### Format `DATABASE_URL`

Gunakan connection string PostgreSQL penuh. Contoh placeholder:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
```

Catatan:

- Untuk Neon atau Supabase, pakai URL pooled/direct sesuai kebutuhan tool.
- Untuk migrasi Drizzle, mulai dari satu `DATABASE_URL` yang stabil dulu.
- Jangan isi docs atau tracked file dengan host/password produksi asli.

## Neon / Supabase guidance

Project ini netral terhadap vendor selama kompatibel dengan PostgreSQL.

### Neon

Cocok bila butuh serverless Postgres cepat buat app web. Umum dipakai untuk:

- environment preview
- database dev/staging ringan
- branching database

### Supabase Postgres

Cocok bila nanti butuh bundle produk Supabase lain. Untuk repo ini, fokus tetap pada Postgres standar dan Drizzle.

### Rule praktis

- 1 database dev shared atau per engineer
- 1 database staging
- 1 database production
- pisahkan credential tiap environment
- jangan pakai production URL di `.env.local`

## Migration flow

Script tersedia di `package.json:13`.

### Generate migration

Bila schema TypeScript berubah:

```bash
npm run db:generate
```

Hasil keluar ke `drizzle/migrations` sesuai `drizzle.config.ts:10`.

### Apply migration

Untuk apply migration ke database target:

```bash
npm run db:migrate
```

### Push schema langsung

Ada script berikut:

```bash
npm run db:push
```

Pakai hati-hati. Cocok buat eksperimen awal atau local DB sementara. Untuk shared env, prefer migration file yang ditinjau dulu.

### Studio

Untuk inspect schema/data:

```bash
npm run db:studio
```

## Cara ubah schema dengan aman

1. Edit schema di `src/db/schema/core.ts` atau file schema terpisah baru di `src/db/schema/`.
2. Export dari `src/db/schema/index.ts` bila tambah file baru.
3. Generate migration baru.
4. Review SQL migration sebelum apply.
5. Apply ke database development.
6. Uji path bisnis yang terdampak.

## Konvensi schema

Ikuti pola yang sudah ada:

- UUID primary key
- snake_case di database
- timestamps `created_at`, `updated_at`, `deleted_at`
- foreign key ke `tenant_id` untuk entity tenant-scoped
- index untuk foreign key dan query path penting
- `sync_status` + `version` pada entity yang rawan konflik sinkron

## Arah pengembangan berikut

Dokumen ini cocok untuk fase bootstrap. Saat backend sync mulai nyata, tambahkan:

- API contract buat pull/push sync
- strategi conflict resolution per entity
- projection/materialized summary untuk laporan
- row-level security bila auth server mulai aktif
- backup/restore dan retention policy
