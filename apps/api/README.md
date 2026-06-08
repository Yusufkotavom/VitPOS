# KOTACOM API

Backend API terpisah untuk deploy Vercel.

## Stack

- Hono
- TypeScript
- Drizzle ORM
- PostgreSQL

## Commands

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run build
```

## Routes awal

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/login`
- `GET /api/v1/sync/pull`
- `POST /api/v1/sync/push`
- `GET /api/v1/reports/sales/summary`

## Env

- `DATABASE_URL` untuk route yang butuh query database
- `API_JWT_SECRET` opsional, fallback ke `dev-secret`

## Vercel deploy

Project ini deploy terpisah dari web.

1. Import `apps/api` sebagai project Vercel
2. Set root directory ke `apps/api`
3. Tambah env `DATABASE_URL`
4. Deploy dan cek `GET /health`
