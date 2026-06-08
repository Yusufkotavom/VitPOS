# Product Category CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menerapkan fitur manajemen Kategori Produk end-to-end dengan persistensi IndexedDB lokal (Dexie), integrasi ke sistem Outbox/Sync, dan halaman UI baru untuk operasi CRUD.

**Architecture:** 
1. `shared-contracts`: Menambahkan enum entity `product_category` untuk sinkronisasi.
2. `services/local-db`: Menambahkan tabel `productCategories` dan `productCategoryRepository`.
3. `features/products`: Menambahkan halaman baru untuk daftar kategori dan komponen form untuk operasi Create/Update.

**Tech Stack:** React, Dexie, React Hook Form, Zod, Tailwind, shadcn/ui.

---

### Task 1: Update Shared Contracts

**Files:**
- Modify: `packages/shared-contracts/src/sync/enums.ts`
- Modify: `packages/shared-contracts/src/sync/validation.ts`
- Test: `packages/shared-contracts/src/tests/sync-contracts.test.ts`

- [ ] **Step 1: Write failing test**
Update `sync-contracts.test.ts` untuk memastikan `product_category`, `setting`, dan `shift` diizinkan sebagai valid `entityType`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test --prefix packages/shared-contracts`
Expected: FAIL karena tipe baru belum dimasukkan ke validator.

- [ ] **Step 3: Write minimal implementation**
Di `enums.ts`, tambahkan `'product_category'` ke `SyncEntityType`.
Di `validation.ts`, tambahkan `'product_category'`, `'setting'`, `'shift'` ke dalam `const syncEntityTypes = new Set<SyncEntityType>(...)`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test --prefix packages/shared-contracts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add packages/shared-contracts/src/sync
git commit -m "feat(sync): add product_category entity type"
```

### Task 2: Update Local Database Schema

**Files:**
- Modify: `src/services/local-db/schema.ts`
- Modify: `src/services/local-db/client.ts`
- Modify: `src/services/local-db/repository.ts`

- [ ] **Step 1: Define schema**
Di `schema.ts`, tambahkan:
```typescript
export type LocalProductCategory = {
  id: string
  name: string
  description?: string
  status: 'Aktif' | 'Arsip'
  syncStatus: SyncStatus
  version: number
  updatedAt: string
}
```

- [ ] **Step 2: Update client db**
Di `client.ts`, import `LocalProductCategory`. Tambahkan `productCategories!: EntityTable<LocalProductCategory, 'id'>`.
Tambahkan skema baru di `this.version(7).stores({ productCategories: 'id, name, status, syncStatus' })`.

- [ ] **Step 3: Add repository**
Di `repository.ts`, ekspor `productCategoryRepository`:
```typescript
export const productCategoryRepository = createRepository<LocalProductCategory>({
  table: localDb.productCategories,
  outboxTable: localDb.outbox,
  entityType: 'product_category',
})
```

- [ ] **Step 4: Test & Commit**
Run: `npm run typecheck`
```bash
git add src/services/local-db
git commit -m "feat(db): add productCategories table and repository"
```

### Task 3: Create Category Form Schema & Hook

**Files:**
- Create: `src/features/products/schemas/category-form-schema.ts`
- Create: `src/features/products/hooks/use-categories.ts`

- [ ] **Step 1: Create Schema**
Di `category-form-schema.ts`, buat zod schema `categoryFormSchema` dengan field `name` dan `description`. Buat `mapCategoryFormToRecord` dan `mapCategoryRecordToFormValues`.

- [ ] **Step 2: Create Hook**
Di `use-categories.ts`, gunakan `useLiveQuery` untuk mengambil `localDb.productCategories.toArray()`.

- [ ] **Step 3: Test & Commit**
```bash
git add src/features/products
git commit -m "feat(products): add category schema and hooks"
```

### Task 4: Create UI Components (Form & Actions)

**Files:**
- Create: `src/features/products/components/category-form.tsx`
- Create: `src/features/products/components/category-crud-actions.tsx`

- [ ] **Step 1: Create Category Form**
Buat form React Hook Form yang mengembalikan input `name` (wajib) dan `description` (opsional).

- [ ] **Step 2: Create Crud Actions**
Mirip dengan `product-crud-actions`, buat Dialog untuk *create* dan *update* kategori, dan konfirmasi hapus untuk *delete* kategori menggunakan `productCategoryRepository`.

- [ ] **Step 3: Commit**
```bash
git add src/features/products/components
git commit -m "feat(products): add category crud UI components"
```

### Task 5: Build Categories Page

**Files:**
- Create: `src/features/products/pages/categories-page.tsx`
- Modify: `src/app.tsx` (or whatever router file is handling routes)

- [ ] **Step 1: Create Page**
Buat `CategoriesPage`. Gunakan `PageShell` dan `DataTable` dari shadcn (berhubung sudah ada) untuk me-render data dari `useCategories()`. Kolom: Nama, Deskripsi, Status, Aksi (CategoryCrudActions).

- [ ] **Step 2: Add Route**
Tambahkan rute `/products/categories` di sistem routing yang ada (misalnya di Sidebar navigation).

- [ ] **Step 3: Test & Commit**
Verifikasi tabel bisa menambah, mengubah, dan menghapus kategori.
```bash
git add src/features/products/pages
git commit -m "feat(products): add categories page and routes"
```
