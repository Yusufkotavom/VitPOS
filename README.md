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
- dashboard modular
- POS foundation + summary strip + held draft banner
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

`npm run check` menjalankan:

- lint
- typecheck
- test
- build

`npm run api:check` menjalankan:

- API test
- API typecheck
- API build

## Catatan penting

- `.env.local` dipakai untuk secret lokal dan sudah di-ignore.
- Web local DB pakai Dexie.
- Android/Desktop akan pakai SQLite adapter.
- Cloud DB siap pakai PostgreSQL, termasuk Neon atau Supabase.
- Backend tetap terpisah dari frontend dan deploy ke Vercel sendiri.
- Schema stok memakai `stock_movements`, bukan angka stok final tunggal.
