# Shared Contracts

Package `shared-contracts` berisi tipe dan validasi yang dipakai bersama oleh:

- Web app (Dexie)
- Backend API (PostgreSQL)
- Android/Desktop (SQLite)

## Entity Types

Semua entitas yang bisa disinkronkan:

```typescript
type SyncEntityType =
  | 'product'           // Produk
  | 'product_category'  // Kategori Produk
  | 'customer'          // Pelanggan
  | 'supplier'          // Pemasok
  | 'sale'              // Penjualan
  | 'payment'           // Pembayaran
  | 'stock_movement'    // Pergerakan Stok
  | 'cash'              // Kas
  | 'setting'           // Pengaturan
  | 'shift'             // Shift Kasir
  | 'purchase'          // Pembelian
  | 'return'            // Retur
  | 'service_order'     // Pesanan Jasa
```

## Mutation Types

```typescript
type SyncMutationType = 'create' | 'update' | 'delete'
```

## Status Flows

### Local Outbox Status

Status mutasi lokal sebelum sinkron:

- `queued` → **Menunggu sinkron**
- `syncing` → **Sedang sinkron**
- `synced` → **Sudah aman di cloud**
- `failed` → **Gagal, coba lagi**
- `conflict` → **Butuh pemeriksaan**

### Server Sync Status

Status mutasi di server:

- `pending` → Belum diproses
- `synced` → Sudah diterapkan
- `failed` → Gagal diterapkan
- `conflict` → Konflik data

### API Item Status

Status transport API saat push/pull:

- `pending` → Belum diproses
- `processing` → Sedang diproses
- `applied` → Berhasil diterapkan
- `conflict` → Konflik terdeteksi
- `rejected` → Ditolak (validasi gagal)

## Conflict Resolution

```typescript
type ConflictStatus = 'open' | 'resolved'
type ConflictResolution = 'use_local' | 'use_cloud' | 'manual_merge'
```

Ketika konflik terjadi, user pilih:

- **Pakai data lokal** → `use_local`
- **Pakai data cloud** → `use_cloud`
- **Gabung manual** → `manual_merge`

## Validation

Package menyediakan validator untuk:

### SyncPullQuery

```typescript
parseSyncPullQuery(input: Record<string, string | undefined>): ValidationResult<SyncPullQuery>
```

Validasi query params untuk pull:

- `tenantId` (required, UUID)
- `branchId` (optional, UUID)
- `since` (optional, ISO date)

### SyncPushBody

```typescript
parseSyncPushBody(input: unknown): ValidationResult<SyncPushBody>
```

Validasi body untuk push:

- `tenantId` (required, UUID)
- `branchId` (optional, UUID atau null)
- `deviceId` (required, string non-empty)
- `mutations` (required, array tidak kosong)

Setiap mutasi divalidasi:

- `entityId` (required, UUID)
- `entityType` (required, salah satu dari `SyncEntityType`)
- `mutationType` (required, salah satu dari `SyncMutationType`)
- `clientMutationId` (optional, string)
- `payload` (optional, any)
- `status` (optional, salah satu dari `LocalOutboxStatus`)

## Import

```typescript
import {
  parseSyncPullQuery,
  parseSyncPushBody,
  type SyncEntityType,
  type SyncMutationType,
  type LocalOutboxStatus,
  type ServerSyncStatus,
  type ApiSyncItemStatus,
  type ConflictStatus,
  type ConflictResolution,
} from '@kotacom/shared-contracts'
```

## Implementasi

- Web: `src/services/sync/`
- API: `api/src/sync/`
- Shared: `packages/shared-contracts/src/sync/`

Lihat `sync-payloads.md` untuk contoh payload lengkap setiap entity type.
