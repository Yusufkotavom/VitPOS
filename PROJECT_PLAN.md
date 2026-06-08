# Project Plan

## 1. Management Summary

KOTACOM Business Suite dibangun sebagai platform modular, offline-first, multi-tenant untuk UMKM Indonesia dengan target:

- web app utama
- Android shell via Capacitor
- desktop shell via Tauri
- backend API Hono terpisah untuk deploy Vercel

## 2. Delivery model

Gunakan multi-agent parallel delivery.

Engine:

1. web-app
2. backend-api
3. android-shell
4. desktop-shell
5. shared-contracts

Plan detail terbaru:

- `docs/superpowers/plans/2026-06-07-kotacom-multi-track.md`

## 3. Current reality

Yang sudah jalan:

- web foundation
- local-first runtime Dexie
- auth UI mock
- POS/dashboard/admin screens
- Neon schema push
- test/lint/build pipeline

Yang belum jalan penuh:

- backend Hono terpisah
- Capacitor shell
- Tauri shell
- SQLite adapter nyata
- sync bridge ke cloud API

## 4. Worktree recommendation

Setelah branch paralel dibuat, pakai worktree:

- `VitPOS-web`
- `VitPOS-api`
- `VitPOS-android`
- `VitPOS-desktop`
- `VitPOS-contracts`

## 5. Merge order

1. shared-contracts
2. web repository seam
3. backend Hono scaffold
4. android/desktop shell bootstrap
5. sync bridge and real mutations
6. expansion modules
