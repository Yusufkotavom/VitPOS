# Android Shell + SQLite Adapter Plan

## Goal

Bungkus web app ke Android via Capacitor dan siapkan seam SQLite tanpa mengubah kontrak feature web.

## Safe first step

1. Tetap jadikan web app sebagai UI source.
2. Tambah seam adapter lokal agar Dexie web bisa diganti SQLite mobile.
3. Tunda `npx cap init` sampai backend contract dan build flow web stabil.

## Adapter seam

Target file:

- `src/services/local-db/adapters/index.ts`
- `src/services/local-db/adapters/indexeddb.adapter.ts`
- `src/services/local-db/adapters/sqlite.adapter.ts`

## Android runtime plan

- web build output jadi source Capacitor webDir
- SQLite dipakai untuk entity operasional dan outbox
- foreground/background sync trigger di layer mobile shell
- auth/session tetap lewat backend API terpisah

## Next scaffold

Saat mulai Engine C:

- `apps/mobile/package.json`
- `apps/mobile/capacitor.config.ts`
- `apps/mobile/android/`
- plugin SQLite config
