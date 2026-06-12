# 404 Page and Header Language Switcher Implementation Plan

Related spec: [404 Page and Header Language Switcher Design](../specs/2026-06-12-404-page-and-header-language-switcher-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan halaman 404 dalam app shell dengan aksi pemulihan yang jelas, serta dropdown switcher bahasa di header yang persisten.

**Architecture:** Router internal mendapat fallback `*` yang merender komponen `NotFoundPage` di dalam `AppLayout`. Pilihan bahasa dikelola langsung lewat `i18next`, dibaca dari local storage saat init, lalu diubah dari komponen dropdown header global.

**Tech Stack:** React, TypeScript, React Router, react-i18next, shadcn/ui, Vitest, Testing Library

---

### Task 1: Tambah kunci i18n dan persistensi bahasa

**Files:**
- Modify: `src/lib/i18n/index.ts`

- [ ] **Step 1: Tulis test yang mendeskripsikan pemilihan bahasa awal dan fallback**

```ts
// Tambahkan test yang memverifikasi:
// - localStorage language = 'en' -> i18n memakai 'en'
// - localStorage invalid -> fallback ke 'id'
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `npm test -- --runInBand`
Expected: FAIL karena helper/persistensi bahasa belum ada

- [ ] **Step 3: Implementasi pembacaan bahasa awal dan key baru i18n**

```ts
const LANGUAGE_STORAGE_KEY = 'vitpos-language'
const SUPPORTED_LANGUAGES = ['id', 'en'] as const

function getInitialLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'en' || stored === 'id' ? stored : 'id'
}
```

Tambahkan juga key translation untuk 404 dan switcher bahasa di resource `id` dan `en`.

- [ ] **Step 4: Jalankan test ulang**

Run: `npm test -- --runInBand`
Expected: PASS untuk test i18n yang baru

### Task 2: Buat komponen language switcher header

**Files:**
- Create: `src/shared/components/nav/language-switcher.tsx`
- Modify: `src/shared/components/layout/app-layout.tsx`

- [ ] **Step 1: Tulis test render dan interaksi switcher**

```tsx
// Render switcher
// Klik trigger
// Pilih English
// Assert i18n.changeLanguage dipanggil dengan 'en'
// Assert localStorage language diperbarui
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `npm test -- --runInBand`
Expected: FAIL karena komponen switcher belum ada

- [ ] **Step 3: Implementasi dropdown switcher**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">ID</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleLanguageChange('id')}>
      Bahasa Indonesia
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
      English
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Masukkan komponen ke area header kanan `AppLayout`.

- [ ] **Step 4: Jalankan test ulang**

Run: `npm test -- --runInBand`
Expected: PASS untuk test switcher

### Task 3: Tambah halaman 404 dan fallback route internal

**Files:**
- Create: `src/shared/components/feedback/not-found-page.tsx`
- Modify: `src/app/router.tsx`

- [ ] **Step 1: Tulis test untuk route internal yang tidak ditemukan**

```tsx
// Render router dengan initialEntries ['/does-not-exist']
// Assert heading 404 tampil
// Assert tombol Ke Dashboard, Kembali, dan Buka POS tampil
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `npm test -- --runInBand`
Expected: FAIL karena fallback route belum ada

- [ ] **Step 3: Implementasi komponen 404 dan route `*`**

```tsx
{ path: '*', element: <NotFoundPage /> }
```

Komponen 404 harus memakai layout card, copy i18n, dan aksi:
- primary ke `/`
- secondary back dengan fallback `/`
- tertiary ke `/pos`

- [ ] **Step 4: Jalankan test ulang**

Run: `npm test -- --runInBand`
Expected: PASS untuk fallback route internal

### Task 4: Verifikasi terpadu

**Files:**
- Modify as needed from tasks above

- [ ] **Step 1: Jalankan lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 2: Jalankan typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Jalankan tests**

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Jalankan build**

Run: `npm run build`
Expected: PASS
