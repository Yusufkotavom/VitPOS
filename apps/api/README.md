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
npm run typecheck
npm run build
```

## Routes awal

- `GET /health`
- `GET /sync/pull`
- `POST /sync/push`

## Env

Butuh `DATABASE_URL` saat mulai pakai DB query nyata.
