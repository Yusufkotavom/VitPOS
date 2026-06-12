# Laporan UMKM + Onboarding ATK & Printing Implementation Plan

Related spec: [Laporan Ringan dan Onboarding Siap Pakai untuk UMKM Indonesia](../specs/2026-06-12-laporan-onboarding-umkm-design.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah onboarding jadi business-playbook ATK & printing dan merapikan dashboard/laporan agar terasa siap pakai untuk UMKM Indonesia.

**Architecture:** Tambah preset business vertical/mode di layer auth data, lalu pakai preset itu untuk seed data lokal, dashboard cards, dan daftar laporan utama. Implementasi dibagi jadi unit kecil: playbook data, seed generator, wizard onboarding baru, preset dashboard, preset laporan, lalu test coverage dan full verification.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Router, Dexie local DB, Zustand auth store, shadcn/ui, lucide-react

---

## File Map

### Existing files to modify

- `src/features/auth/data/template-data.ts`
  - Ganti preset generik jadi model `businessVertical` + `businessMode` + playbook ATK & printing.
- `src/features/auth/pages/onboarding-page.tsx`
  - Pecah logic inline. Ubah wizard jadi flow ringan berbasis playbook.
- `src/features/auth/pages/onboarding-page-data.test.ts`
  - Update ekspektasi seed dan metadata tenant/business mode.
- `src/features/auth/pages/onboarding-registration.test.ts`
  - Update wizard flow baru.
- `src/services/local-db/seeds.ts`
  - Tambah generator seed realistis ATK & printing.
- `src/features/reports/pages/reports-page.tsx`
  - Ubah daftar kartu laporan jadi preset-driven.
- `src/features/dashboard/pages/dashboard-page.tsx`
  - Sisipkan preset-aware owner dashboard blocks.

### Existing files likely to read while implementing

- `src/services/local-db/schema.ts`
  - Cek apakah tenant type cukup untuk simpan vertical/mode, atau perlu setting-based metadata.
- `src/services/local-db/repository.ts`
  - Reuse helper settings/upsert bila perlu.
- `src/features/settings/components/company-settings-form.tsx`
  - Pastikan istilah profil usaha tetap konsisten.

### New files to create

- `src/features/auth/data/business-playbooks.ts`
  - Sumber utama vertical, mode, preview labels, seed definitions.
- `src/features/auth/components/onboarding/vertical-selector.tsx`
  - Step pilih vertikal.
- `src/features/auth/components/onboarding/business-mode-selector.tsx`
  - Step pilih mode usaha.
- `src/features/auth/components/onboarding/business-identity-form.tsx`
  - Step data inti usaha.
- `src/features/auth/components/onboarding/template-preview-card.tsx`
  - Preview isi template bisnis.
- `src/features/auth/components/onboarding/setup-review-panel.tsx`
  - Review cepat item aktif, harga, stok awal, layanan.
- `src/features/auth/components/onboarding/post-setup-checklist.tsx`
  - Checklist setelah onboarding selesai.
- `src/features/dashboard/config/dashboard-presets.ts`
  - Preset dashboard per mode usaha.
- `src/features/reports/config/report-presets.ts`
  - Preset laporan utama per mode usaha.
- `src/services/local-db/seed-playbooks.ts`
  - Mapper playbook → local DB rows.
- `src/services/local-db/seed-playbooks.test.ts`
  - Test generator seed ATK/printing.
- `src/features/dashboard/config/dashboard-presets.test.ts`
  - Test rules dashboard.
- `src/features/reports/config/report-presets.test.ts`
  - Test rules laporan.

## Task 1: Definisikan business playbook ATK & printing

**Files:**
- Create: `src/features/auth/data/business-playbooks.ts`
- Modify: `src/features/auth/data/template-data.ts`
- Test: `src/features/auth/data/business-playbooks.test.ts`

- [ ] **Step 1: Write failing test for vertical + mode definitions**

```ts
import { describe, expect, it } from 'vitest'

import {
  BUSINESS_PLAYBOOKS,
  DEFAULT_BUSINESS_MODE,
  DEFAULT_VERTICAL,
} from '@/features/auth/data/business-playbooks'

describe('business playbooks', () => {
  it('defines atk & printing vertical with all three modes', () => {
    expect(DEFAULT_VERTICAL).toBe('atk_printing')
    expect(DEFAULT_BUSINESS_MODE).toBe('atk_printing_combo')

    const playbook = BUSINESS_PLAYBOOKS.atk_printing
    expect(playbook.label).toBe('ATK & Printing')
    expect(playbook.modes.map((mode) => mode.id)).toEqual([
      'atk_only',
      'printing_only',
      'atk_printing_combo',
    ])
  })

  it('provides realistic default categories, products, services, and payment methods', () => {
    const combo = BUSINESS_PLAYBOOKS.atk_printing.modes.find(
      (mode) => mode.id === 'atk_printing_combo',
    )

    expect(combo?.categories).toContain('Kertas')
    expect(combo?.categories).toContain('Jasa Dokumen')
    expect(combo?.products.some((item) => item.name === 'Kertas A4 70gsm')).toBe(true)
    expect(combo?.products.some((item) => item.name === 'Print warna per lembar')).toBe(true)
    expect(combo?.paymentMethods.map((item) => item.name)).toEqual([
      'Tunai',
      'QRIS',
      'Transfer',
      'Piutang',
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/auth/data/business-playbooks.test.ts`
Expected: FAIL with module not found for `business-playbooks.ts`

- [ ] **Step 3: Create `business-playbooks.ts` with explicit types and ATK/printing data**

```ts
export type BusinessVerticalId = 'atk_printing'
export type BusinessModeId = 'atk_only' | 'printing_only' | 'atk_printing_combo'

export type PlaybookItemType = 'Produk Fisik' | 'Jasa'

export type PlaybookProduct = {
  name: string
  category: string
  price: number
  cost: number
  type: PlaybookItemType
  unit: string
  stock: number
  minStock: number
  tags: string[]
}

export type BusinessModePlaybook = {
  id: BusinessModeId
  label: string
  description: string
  categories: string[]
  products: PlaybookProduct[]
  paymentMethods: Array<{ name: string; provider: string; type: string }>
  cashCategories: Array<{ name: string; type: 'Pemasukan' | 'Pengeluaran' }>
  quickActions: string[]
  reportKeys: Array<'ringkasan' | 'penjualan' | 'stok' | 'kas' | 'piutang'>
  dashboardFocus: string[]
}

export type BusinessVerticalPlaybook = {
  id: BusinessVerticalId
  label: string
  description: string
  modes: BusinessModePlaybook[]
}

const SHARED_PAYMENT_METHODS = [
  { name: 'Tunai', provider: 'Tunai', type: 'tunai' },
  { name: 'QRIS', provider: 'QRIS', type: 'qris' },
  { name: 'Transfer', provider: 'Bank', type: 'transfer' },
  { name: 'Piutang', provider: 'Pelanggan', type: 'piutang' },
] as const

export const BUSINESS_PLAYBOOKS: Record<BusinessVerticalId, BusinessVerticalPlaybook> = {
  atk_printing: {
    id: 'atk_printing',
    label: 'ATK & Printing',
    description: 'Toko alat tulis, fotokopi, print dokumen, dan layanan dokumen umum.',
    modes: [
      {
        id: 'atk_only',
        label: 'ATK saja',
        description: 'Fokus jual barang dan kontrol stok.',
        categories: ['Kertas', 'Alat Tulis', 'Map & Arsip', 'Perlengkapan Sekolah'],
        products: [
          { name: 'Kertas A4 70gsm', category: 'Kertas', price: 65000, cost: 52000, type: 'Produk Fisik', unit: 'rim', stock: 12, minStock: 4, tags: ['atk', 'stok'] },
          { name: 'Pulpen Faster', category: 'Alat Tulis', price: 3500, cost: 2200, type: 'Produk Fisik', unit: 'pcs', stock: 120, minStock: 24, tags: ['atk', 'laris'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Penjualan ATK', type: 'Pemasukan' },
          { name: 'Pembelian Stok', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Tambah stok', 'Lihat barang hampir habis'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['stok', 'barang_laris', 'restok'],
      },
      {
        id: 'printing_only',
        label: 'Printing saja',
        description: 'Fokus jasa dokumen dan bahan habis pakai.',
        categories: ['Jasa Dokumen', 'Printer & Tinta', 'Laminating & Jilid'],
        products: [
          { name: 'Print hitam putih per lembar', category: 'Jasa Dokumen', price: 500, cost: 200, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
          { name: 'Print warna per lembar', category: 'Jasa Dokumen', price: 2000, cost: 900, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Pendapatan Jasa Print', type: 'Pemasukan' },
          { name: 'Beli Kertas dan Tinta', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Catat pengeluaran', 'Cek jasa terlaris'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['jasa_laris', 'omzet_layanan', 'bahan_habis_pakai'],
      },
      {
        id: 'atk_printing_combo',
        label: 'Gabungan ATK + Printing',
        description: 'Fokus barang + jasa dalam satu dashboard owner.',
        categories: ['Kertas', 'Alat Tulis', 'Map & Arsip', 'Printer & Tinta', 'Jasa Dokumen', 'Laminating & Jilid'],
        products: [
          { name: 'Kertas A4 70gsm', category: 'Kertas', price: 65000, cost: 52000, type: 'Produk Fisik', unit: 'rim', stock: 12, minStock: 4, tags: ['atk', 'stok'] },
          { name: 'Pulpen Faster', category: 'Alat Tulis', price: 3500, cost: 2200, type: 'Produk Fisik', unit: 'pcs', stock: 120, minStock: 24, tags: ['atk', 'laris'] },
          { name: 'Print hitam putih per lembar', category: 'Jasa Dokumen', price: 500, cost: 200, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
          { name: 'Print warna per lembar', category: 'Jasa Dokumen', price: 2000, cost: 900, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
          { name: 'Laminating', category: 'Laminating & Jilid', price: 7000, cost: 2500, type: 'Jasa', unit: 'lembar', stock: 0, minStock: 0, tags: ['printing', 'jasa'] },
        ],
        paymentMethods: [...SHARED_PAYMENT_METHODS],
        cashCategories: [
          { name: 'Penjualan Barang', type: 'Pemasukan' },
          { name: 'Pendapatan Jasa Print', type: 'Pemasukan' },
          { name: 'Pembelian Stok', type: 'Pengeluaran' },
          { name: 'Operasional Mesin Print', type: 'Pengeluaran' },
        ],
        quickActions: ['Transaksi baru', 'Tambah stok', 'Catat pengeluaran', 'Input piutang', 'Lihat barang hampir habis'],
        reportKeys: ['ringkasan', 'penjualan', 'stok', 'kas', 'piutang'],
        dashboardFocus: ['barang', 'layanan', 'stok', 'kas'],
      },
    ],
  },
}

export const DEFAULT_VERTICAL: BusinessVerticalId = 'atk_printing'
export const DEFAULT_BUSINESS_MODE: BusinessModeId = 'atk_printing_combo'
```

- [ ] **Step 4: Re-export compatibility helpers from `template-data.ts`**

```ts
import {
  BUSINESS_PLAYBOOKS,
  DEFAULT_BUSINESS_MODE,
  DEFAULT_VERTICAL,
  type BusinessModeId,
  type BusinessVerticalId,
} from '@/features/auth/data/business-playbooks'

export type TemplatePreset = {
  businessVertical: BusinessVerticalId
  businessMode: BusinessModeId
  categories: { name: string; description?: string }[]
  products: { name: string; category: string; price: number; type: 'Produk Fisik' | 'Jasa' }[]
  paymentMethods: { name: string; provider: string; type: string }[]
  cashCategories: { name: string; type: 'Pemasukan' | 'Pengeluaran' }[]
  customer: { name: string; phone: string; city: string }
  supplier: { name: string; phone: string; city: string }
}

const combo = BUSINESS_PLAYBOOKS[DEFAULT_VERTICAL].modes.find(
  (mode) => mode.id === DEFAULT_BUSINESS_MODE,
)!

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
  atk_printing: {
    businessVertical: DEFAULT_VERTICAL,
    businessMode: DEFAULT_BUSINESS_MODE,
    categories: combo.categories.map((name) => ({ name })),
    products: combo.products.map((item) => ({
      name: item.name,
      category: item.category,
      price: item.price,
      type: item.type,
    })),
    paymentMethods: [...combo.paymentMethods],
    cashCategories: [...combo.cashCategories],
    customer: { name: 'Pelanggan Umum', phone: '081234567890', city: 'Surabaya' },
    supplier: { name: 'Supplier ATK Utama', phone: '081234567891', city: 'Surabaya' },
  },
}
```

- [ ] **Step 5: Run tests to verify playbook passes**

Run: `npm run test -- src/features/auth/data/business-playbooks.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/data/business-playbooks.ts src/features/auth/data/template-data.ts src/features/auth/data/business-playbooks.test.ts
git commit -m "feat: add atk printing business playbook"
```

## Task 2: Tambah seed generator lokal berbasis playbook

**Files:**
- Create: `src/services/local-db/seed-playbooks.ts`
- Test: `src/services/local-db/seed-playbooks.test.ts`
- Modify: `src/services/local-db/seeds.ts`

- [ ] **Step 1: Write failing test for seed generator**

```ts
import { describe, expect, it } from 'vitest'

import { buildAtkPrintingSeed } from '@/services/local-db/seed-playbooks'

describe('seed playbooks', () => {
  it('builds realistic combo seed rows with stock and jasa entries', () => {
    const seed = buildAtkPrintingSeed({
      tenantId: 'tenant-1',
      businessMode: 'atk_printing_combo',
      tenantName: 'Mitra Print & ATK',
      ownerName: 'Rina',
      city: 'Surabaya',
      initialCash: 500000,
    })

    expect(seed.products.some((item) => item.name === 'Kertas A4 70gsm')).toBe(true)
    expect(seed.products.some((item) => item.name === 'Print warna per lembar')).toBe(true)
    expect(seed.products.find((item) => item.name === 'Kertas A4 70gsm')?.stock).toBeGreaterThan(0)
    expect(seed.paymentMethods.map((item) => item.name)).toContain('QRIS')
    expect(seed.settings.some((item) => item.setting === 'business_mode')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/services/local-db/seed-playbooks.test.ts`
Expected: FAIL with missing module error

- [ ] **Step 3: Create playbook seed builder**

```ts
import { BUSINESS_PLAYBOOKS, type BusinessModeId } from '@/features/auth/data/business-playbooks'
import type { LocalProduct, LocalSetting } from '@/services/local-db/schema'

type BuildSeedInput = {
  tenantId: string
  businessMode: BusinessModeId
  tenantName: string
  ownerName: string
  city: string
  initialCash: number
}

export function buildAtkPrintingSeed(input: BuildSeedInput) {
  const mode = BUSINESS_PLAYBOOKS.atk_printing.modes.find((item) => item.id === input.businessMode)
  if (!mode) throw new Error(`Unknown business mode: ${input.businessMode}`)

  const now = new Date().toISOString()

  const products: LocalProduct[] = mode.products.map((item) => ({
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    name: item.name,
    category: item.category,
    type: item.type,
    price: item.price,
    stock: item.stock,
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: now,
  }))

  const settings: LocalSetting[] = [
    {
      id: `${input.tenantId}:business-vertical`,
      tenantId: input.tenantId,
      area: 'System',
      setting: 'business_vertical',
      value: 'atk_printing',
      updatedAt: now,
      status: 'Lengkap',
    },
    {
      id: `${input.tenantId}:business-mode`,
      tenantId: input.tenantId,
      area: 'System',
      setting: 'business_mode',
      value: input.businessMode,
      updatedAt: now,
      status: 'Lengkap',
    },
    {
      id: `${input.tenantId}:initial-cash`,
      tenantId: input.tenantId,
      area: 'Kas',
      setting: 'kas_awal',
      value: String(input.initialCash),
      updatedAt: now,
      status: 'Lengkap',
    },
  ]

  return {
    categories: mode.categories.map((name) => ({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name,
      description: '',
      status: 'Aktif' as const,
      syncStatus: 'pending' as const,
      version: 1,
      updatedAt: now,
    })),
    products,
    paymentMethods: mode.paymentMethods.map((item) => ({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name: item.name,
      provider: item.provider,
      type: item.type,
      status: 'Aktif' as const,
      updatedAt: now,
    })),
    cashCategories: mode.cashCategories.map((item) => ({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      name: item.name,
      type: item.type,
      status: 'Aktif' as const,
      syncStatus: 'pending' as const,
      version: 1,
      updatedAt: now,
    })),
    customers: [
      {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        name: 'Pelanggan Umum',
        phone: '081234567890',
        city: input.city,
        receivable: 0,
        orders: 0,
        status: 'Aktif' as const,
        syncStatus: 'pending' as const,
        version: 1,
        updatedAt: now,
      },
    ],
    suppliers: [
      {
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        name: 'Supplier ATK Utama',
        phone: '081234567891',
        city: input.city,
        payable: 0,
        orders: 0,
        status: 'Aktif' as const,
        syncStatus: 'pending' as const,
        version: 1,
        updatedAt: now,
      },
    ],
    settings,
  }
}
```

- [ ] **Step 4: Refactor `seeds.ts` to expose playbook-ready helpers**

```ts
import { buildAtkPrintingSeed } from '@/services/local-db/seed-playbooks'

export function createDemoAtkPrintingSeed() {
  return buildAtkPrintingSeed({
    tenantId: DEMO_TENANT_ID,
    businessMode: 'atk_printing_combo',
    tenantName: 'Demo ATK Printing',
    ownerName: 'Demo Owner',
    city: 'Surabaya',
    initialCash: 1000000,
  })
}
```

Then replace static `demoProducts` source with `const demoSeed = createDemoAtkPrintingSeed()` and persist `demoSeed.categories`, `demoSeed.products`, `demoSeed.paymentMethods`, `demoSeed.cashCategories`, `demoSeed.customers`, `demoSeed.suppliers`, `demoSeed.settings` in `seedLocalDemoData()`.

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- src/services/local-db/seed-playbooks.test.ts src/features/auth/pages/onboarding-page-data.test.ts`
Expected: PASS for seed generator, existing onboarding test may still FAIL until Task 4

- [ ] **Step 6: Commit**

```bash
git add src/services/local-db/seed-playbooks.ts src/services/local-db/seed-playbooks.test.ts src/services/local-db/seeds.ts
git commit -m "feat: add atk printing local seed generator"
```

## Task 3: Split onboarding UI into focused components

**Files:**
- Create: `src/features/auth/components/onboarding/vertical-selector.tsx`
- Create: `src/features/auth/components/onboarding/business-mode-selector.tsx`
- Create: `src/features/auth/components/onboarding/business-identity-form.tsx`
- Create: `src/features/auth/components/onboarding/template-preview-card.tsx`
- Create: `src/features/auth/components/onboarding/setup-review-panel.tsx`
- Create: `src/features/auth/components/onboarding/post-setup-checklist.tsx`
- Modify: `src/features/auth/pages/onboarding-page.tsx`
- Test: `src/features/auth/pages/onboarding-registration.test.ts`

- [ ] **Step 1: Write failing test for new onboarding flow copy**

```ts
it('shows vertical, mode, and review steps for atk printing onboarding', async () => {
  renderOnboarding()

  expect(screen.getByText('Pilih jenis usaha')).toBeInTheDocument()
  expect(screen.getByText('ATK & Printing')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
  expect(screen.getByText('Pilih model usaha')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Gabungan ATK + Printing'))
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
  expect(screen.getByText('Data inti usaha')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
  expect(screen.getByText('Review setup')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/auth/pages/onboarding-registration.test.ts`
Expected: FAIL because current wizard still shows `Informasi Perusahaan` first

- [ ] **Step 3: Create small presentational components**

Use these skeletons.

`vertical-selector.tsx`

```tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BusinessVerticalPlaybook, BusinessVerticalId } from '@/features/auth/data/business-playbooks'

type Props = {
  verticals: BusinessVerticalPlaybook[]
  selectedVertical: BusinessVerticalId
  onSelect: (value: BusinessVerticalId) => void
}

export function VerticalSelector({ verticals, selectedVertical, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {verticals.map((vertical) => (
        <Card
          key={vertical.id}
          className={selectedVertical === vertical.id ? 'border-primary ring-1 ring-primary' : ''}
          onClick={() => onSelect(vertical.id)}
        >
          <CardHeader>
            <CardTitle>{vertical.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{vertical.description}</p>
            <div className="flex flex-wrap gap-2">
              {vertical.modes.map((mode) => (
                <Badge key={mode.id} variant="secondary">{mode.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

`business-mode-selector.tsx`

```tsx
import type { BusinessModePlaybook, BusinessModeId } from '@/features/auth/data/business-playbooks'

export function BusinessModeSelector({
  modes,
  selectedMode,
  onSelect,
}: {
  modes: BusinessModePlaybook[]
  selectedMode: BusinessModeId
  onSelect: (value: BusinessModeId) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={selectedMode === mode.id ? 'rounded-xl border border-primary bg-primary/5 p-4 text-left ring-1 ring-primary' : 'rounded-xl border p-4 text-left'}
          onClick={() => onSelect(mode.id)}
        >
          <div className="font-semibold">{mode.label}</div>
          <div className="mt-1 text-sm text-muted-foreground">{mode.description}</div>
        </button>
      ))}
    </div>
  )
}
```

`business-identity-form.tsx`

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/shared/components/forms/currency-input'

export type BusinessIdentityFormValue = {
  tenantName: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
  whatsapp: string
  city: string
  address: string
  openHours: string
  initialCash: string
}

export function BusinessIdentityForm({
  value,
  showOwnerFields,
  onChange,
}: {
  value: BusinessIdentityFormValue
  showOwnerFields: boolean
  onChange: (next: BusinessIdentityFormValue) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {showOwnerFields ? (
        <>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="owner-name">Nama pemilik</Label>
            <Input id="owner-name" value={value.ownerName} onChange={(event) => onChange({ ...value, ownerName: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-email">Email pemilik</Label>
            <Input id="owner-email" type="email" value={value.ownerEmail} onChange={(event) => onChange({ ...value, ownerEmail: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-password">Kata sandi</Label>
            <Input id="owner-password" type="password" value={value.ownerPassword} onChange={(event) => onChange({ ...value, ownerPassword: event.target.value })} />
          </div>
        </>
      ) : null}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="business-name">Nama usaha</Label>
        <Input id="business-name" value={value.tenantName} onChange={(event) => onChange({ ...value, tenantName: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-whatsapp">WhatsApp usaha</Label>
        <Input id="business-whatsapp" value={value.whatsapp} onChange={(event) => onChange({ ...value, whatsapp: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-city">Kota</Label>
        <Input id="business-city" value={value.city} onChange={(event) => onChange({ ...value, city: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="business-address">Alamat usaha</Label>
        <Input id="business-address" value={value.address} onChange={(event) => onChange({ ...value, address: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-open-hours">Jam buka</Label>
        <Input id="business-open-hours" value={value.openHours} onChange={(event) => onChange({ ...value, openHours: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-cash">Kas awal</Label>
        <CurrencyInput prefix="Rp" value={value.initialCash} onValueChange={(amount) => onChange({ ...value, initialCash: String(amount) })} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Refactor onboarding page to use 5-step flow**

Target step labels in `onboarding-page.tsx`:

```ts
const steps = [
  { id: 1, title: 'Pilih jenis usaha' },
  { id: 2, title: 'Pilih model usaha' },
  { id: 3, title: 'Data inti usaha' },
  { id: 4, title: 'Preview template' },
  { id: 5, title: 'Review setup' },
]
```

State shape to introduce:

```ts
const [businessVertical, setBusinessVertical] = useState<BusinessVerticalId>(DEFAULT_VERTICAL)
const [businessMode, setBusinessMode] = useState<BusinessModeId>(DEFAULT_BUSINESS_MODE)
const [identityForm, setIdentityForm] = useState<BusinessIdentityFormValue>({
  tenantName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  whatsapp: '',
  city: 'Surabaya',
  address: '',
  openHours: '08.00 - 20.00',
  initialCash: '500000',
})
```

Use selected playbook mode to build review data instead of hand-editing giant CRUD tables.

- [ ] **Step 5: Update onboarding registration test for new step sequence**

Replace quick-skip clicks with:

```ts
fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
fireEvent.click(screen.getByText('Gabungan ATK + Printing'))
fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
fireEvent.change(screen.getByLabelText(/Nama usaha/i), { target: { value: 'Toko Regis' } })
fireEvent.change(screen.getByLabelText(/WhatsApp usaha/i), { target: { value: '081234567890' } })
fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
fireEvent.click(screen.getByRole('button', { name: /Masuk dan mulai transaksi/i }))
```

- [ ] **Step 6: Run onboarding tests**

Run: `npm run test -- src/features/auth/pages/onboarding-registration.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/components/onboarding src/features/auth/pages/onboarding-page.tsx src/features/auth/pages/onboarding-registration.test.ts
git commit -m "feat: add atk printing onboarding flow"
```

## Task 4: Hubungkan onboarding ke seed realistis dan metadata usaha

**Files:**
- Modify: `src/features/auth/pages/onboarding-page.tsx`
- Modify: `src/features/auth/pages/onboarding-page-data.test.ts`
- Modify: `src/services/local-db/seeds.ts`
- Test: `src/features/auth/pages/onboarding-page-data.test.ts`

- [ ] **Step 1: Write failing data test for business mode metadata**

Add assertions:

```ts
const settings = await localDb.settings.toArray()
expect(settings.some((item) => item.setting === 'business_vertical' && item.value === 'atk_printing')).toBe(true)
expect(settings.some((item) => item.setting === 'business_mode' && item.value === 'atk_printing_combo')).toBe(true)
expect(settings.some((item) => item.setting === 'kas_awal' && item.value === '500000')).toBe(true)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/auth/pages/onboarding-page-data.test.ts`
Expected: FAIL because current onboarding does not persist those settings

- [ ] **Step 3: Replace manual seeding loop in `handleFinish` with playbook seed builder**

Use pattern:

```ts
const seed = buildAtkPrintingSeed({
  tenantId,
  businessMode,
  tenantName: identityForm.tenantName.trim(),
  ownerName: normalizedName,
  city: identityForm.city.trim(),
  initialCash: Number(identityForm.initialCash || '0'),
})

await localDb.productCategories.bulkPut(seed.categories)
await localDb.products.bulkPut(seed.products)
await localDb.paymentMethods.bulkPut(seed.paymentMethods)
await localDb.cashCategories.bulkPut(seed.cashCategories)
await localDb.customers.bulkPut(seed.customers)
await localDb.suppliers.bulkPut(seed.suppliers)
for (const setting of seed.settings) {
  await settingRepository.upsert(setting)
}
```

Also persist identity settings:

```ts
await settingRepository.upsert({
  id: `${tenantId}:company-whatsapp`,
  tenantId,
  area: 'Profil Usaha',
  setting: 'Nomor WhatsApp',
  value: identityForm.whatsapp,
  updatedAt: now,
  status: 'Lengkap',
})
```

- [ ] **Step 4: Navigate to dashboard, not billing, after setup complete**

Replace:

```ts
navigate('/billing')
```

with:

```ts
navigate('/dashboard')
```

If billing is still mandatory elsewhere, enqueue a post-setup reminder instead of hard redirect.

- [ ] **Step 5: Update data-flow test route target**

Change route stub to:

```tsx
<Route path="/dashboard" element={createElement('div', null, 'Dashboard Route')} />
```

Then expect:

```ts
expect(await screen.findByText('Dashboard Route')).toBeInTheDocument()
```

- [ ] **Step 6: Run focused tests**

Run: `npm run test -- src/features/auth/pages/onboarding-page-data.test.ts src/features/auth/pages/onboarding-registration.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/pages/onboarding-page.tsx src/features/auth/pages/onboarding-page-data.test.ts src/features/auth/pages/onboarding-registration.test.ts src/services/local-db/seeds.ts
git commit -m "feat: seed onboarding with atk printing data"
```

## Task 5: Tambah preset dashboard owner per mode usaha

**Files:**
- Create: `src/features/dashboard/config/dashboard-presets.ts`
- Create: `src/features/dashboard/config/dashboard-presets.test.ts`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] **Step 1: Write failing test for dashboard preset selection**

```ts
import { describe, expect, it } from 'vitest'

import { getDashboardPreset } from '@/features/dashboard/config/dashboard-presets'

describe('dashboard presets', () => {
  it('returns combo layout with barang and layanan focus', () => {
    const preset = getDashboardPreset('atk_printing_combo')

    expect(preset.heroTitle).toBe('Ringkasan usaha hari ini')
    expect(preset.focusBlocks).toEqual(['barang', 'layanan', 'stok', 'kas'])
    expect(preset.quickActions).toContain('Transaksi baru')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/dashboard/config/dashboard-presets.test.ts`
Expected: FAIL with missing module

- [ ] **Step 3: Create preset config and helper**

```ts
import type { BusinessModeId } from '@/features/auth/data/business-playbooks'

export type DashboardPreset = {
  heroTitle: string
  heroDescription: string
  focusBlocks: string[]
  quickActions: string[]
}

const DASHBOARD_PRESETS: Record<BusinessModeId, DashboardPreset> = {
  atk_only: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Fokus stok, barang laris, dan restok cepat.',
    focusBlocks: ['stok', 'barang_laris', 'restok', 'kas'],
    quickActions: ['Transaksi baru', 'Tambah stok', 'Lihat barang hampir habis'],
  },
  printing_only: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Fokus jasa laris, omzet layanan, dan bahan habis pakai.',
    focusBlocks: ['jasa_laris', 'omzet_layanan', 'bahan_habis_pakai', 'kas'],
    quickActions: ['Transaksi baru', 'Catat pengeluaran', 'Cek jasa terlaris'],
  },
  atk_printing_combo: {
    heroTitle: 'Ringkasan usaha hari ini',
    heroDescription: 'Pantau barang, layanan, stok, dan kas dari satu layar.',
    focusBlocks: ['barang', 'layanan', 'stok', 'kas'],
    quickActions: ['Transaksi baru', 'Tambah stok', 'Catat pengeluaran', 'Input piutang'],
  },
}

export function getDashboardPreset(mode: BusinessModeId): DashboardPreset {
  return DASHBOARD_PRESETS[mode]
}
```

- [ ] **Step 4: Wire dashboard page to preset-aware header section**

Add top section in `dashboard-page.tsx`:

```tsx
import { getDashboardPreset } from '@/features/dashboard/config/dashboard-presets'

const preset = getDashboardPreset('atk_printing_combo')

<section className="rounded-2xl border bg-card p-5 shadow-sm">
  <h1 className="text-xl font-semibold">{preset.heroTitle}</h1>
  <p className="mt-1 text-sm text-muted-foreground">{preset.heroDescription}</p>
  <div className="mt-4 flex flex-wrap gap-2">
    {preset.quickActions.map((action) => (
      <span key={action} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {action}
      </span>
    ))}
  </div>
</section>
```

For now hardcode `atk_printing_combo`. In later pass, swap to setting-based mode lookup.

- [ ] **Step 5: Run dashboard preset tests**

Run: `npm run test -- src/features/dashboard/config/dashboard-presets.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/config/dashboard-presets.ts src/features/dashboard/config/dashboard-presets.test.ts src/features/dashboard/pages/dashboard-page.tsx
git commit -m "feat: add atk printing dashboard preset"
```

## Task 6: Rapikan information architecture laporan

**Files:**
- Create: `src/features/reports/config/report-presets.ts`
- Create: `src/features/reports/config/report-presets.test.ts`
- Modify: `src/features/reports/pages/reports-page.tsx`

- [ ] **Step 1: Write failing test for report preset keys**

```ts
import { describe, expect, it } from 'vitest'

import { getReportPreset } from '@/features/reports/config/report-presets'

describe('report presets', () => {
  it('returns five owner-first report cards for atk printing combo', () => {
    const preset = getReportPreset('atk_printing_combo')

    expect(preset.cards.map((card) => card.title)).toEqual([
      'Ringkasan',
      'Penjualan',
      'Stok',
      'Kas',
      'Piutang',
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/reports/config/report-presets.test.ts`
Expected: FAIL with missing module

- [ ] **Step 3: Create report preset config**

```ts
import { ReceiptText, Boxes, Wallet, BadgeDollarSign, ClipboardList } from 'lucide-react'
import type { BusinessModeId } from '@/features/auth/data/business-playbooks'

export type ReportCardPreset = {
  to: string
  title: string
  description: string
  icon: typeof ReceiptText
}

const SHARED_OWNER_CARDS: ReportCardPreset[] = [
  { to: '/reports', title: 'Ringkasan', description: 'Omzet, laba kotor, stok, kas, piutang', icon: ClipboardList },
  { to: '/reports/sales', title: 'Penjualan', description: 'Omzet, transaksi, produk dan jasa laris', icon: ReceiptText },
  { to: '/reports/inventory', title: 'Stok', description: 'Barang hampir habis, mutasi, restok', icon: Boxes },
  { to: '/reports/payments', title: 'Kas', description: 'Uang masuk, uang keluar, saldo berjalan', icon: Wallet },
  { to: '/reports/payments', title: 'Piutang', description: 'Tagihan belum lunas dan histori bayar', icon: BadgeDollarSign },
]

export function getReportPreset(_mode: BusinessModeId) {
  return { cards: SHARED_OWNER_CARDS }
}
```

- [ ] **Step 4: Replace static report cards in `reports-page.tsx`**

```tsx
import { getReportPreset } from '@/features/reports/config/report-presets'

const preset = getReportPreset('atk_printing_combo')

{preset.cards.map((card) => (
  <Link key={card.title} to={card.to} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <card.icon className="h-5 w-5 text-primary" />
    </div>
    <div className="flex flex-col gap-1">
      <p className="font-semibold text-foreground">{card.title}</p>
      <p className="text-sm text-muted-foreground">{card.description}</p>
    </div>
  </Link>
))}
```

Also update page description to:

```tsx
description="Ringkasan owner, penjualan, stok, kas, dan piutang untuk usaha harian."
```

- [ ] **Step 5: Run report preset tests**

Run: `npm run test -- src/features/reports/config/report-presets.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/reports/config/report-presets.ts src/features/reports/config/report-presets.test.ts src/features/reports/pages/reports-page.tsx
git commit -m "feat: simplify reports for atk printing owners"
```

## Task 7: Tambah post-setup checklist dan polish dashboard/onboarding copy

**Files:**
- Create: `src/features/auth/components/onboarding/post-setup-checklist.tsx`
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`
- Modify: `src/features/auth/pages/onboarding-page.tsx`
- Test: `src/features/auth/pages/auth-polish.test.ts`

- [ ] **Step 1: Write failing UI copy test**

```ts
it('shows onboarding-to-usage checklist for new atk printing tenant', async () => {
  renderDashboard()

  expect(screen.getByText('Tambah 5 produk utama')).toBeInTheDocument()
  expect(screen.getByText('Catat transaksi pertama')).toBeInTheDocument()
  expect(screen.getByText('Lihat ringkasan hari ini')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/auth/pages/auth-polish.test.ts`
Expected: FAIL because checklist block does not exist yet

- [ ] **Step 3: Create checklist component**

```tsx
const DEFAULT_SETUP_CHECKLIST = [
  'Tambah 5 produk utama',
  'Cek harga jasa',
  'Catat transaksi pertama',
  'Cek stok minimum',
  'Lihat ringkasan hari ini',
]

export function PostSetupChecklist() {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Checklist mulai pakai</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {DEFAULT_SETUP_CHECKLIST.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: Render checklist in dashboard below hero section**

```tsx
import { PostSetupChecklist } from '@/features/auth/components/onboarding/post-setup-checklist'

<PostSetupChecklist />
```

- [ ] **Step 5: Run polish test**

Run: `npm run test -- src/features/auth/pages/auth-polish.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/components/onboarding/post-setup-checklist.tsx src/features/dashboard/pages/dashboard-page.tsx src/features/auth/pages/auth-polish.test.ts
git commit -m "feat: add post setup checklist"
```

## Task 8: Full verification

**Files:**
- Modify: none expected
- Test: whole project

- [ ] **Step 1: Run targeted tests for touched areas**

Run: `npm run test -- src/features/auth/data/business-playbooks.test.ts src/services/local-db/seed-playbooks.test.ts src/features/auth/pages/onboarding-page-data.test.ts src/features/auth/pages/onboarding-registration.test.ts src/features/dashboard/config/dashboard-presets.test.ts src/features/reports/config/report-presets.test.ts`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS with no errors

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Run full check**

Run: `npm run check`
Expected: PASS

- [ ] **Step 6: Commit verification-safe final state**

```bash
git add .
git commit -m "feat: add atk printing onboarding and owner reports"
```

## Self-Review

### Spec coverage

- Onboarding gabungan ringan: covered by Tasks 3 and 4.
- Vertikal awal ATK & printing: covered by Tasks 1 and 2.
- Data awal realistis: covered by Tasks 1 and 2.
- Dashboard owner adaptif: covered by Task 5.
- Laporan 5 menu utama: covered by Task 6.
- Checklist pasca-onboarding: covered by Task 7.
- Testing + verification: covered by Task 8.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders kept.
- Each task includes explicit files, commands, and code snippets.

### Type consistency

- Shared ids use `BusinessVerticalId` and `BusinessModeId` from `business-playbooks.ts`.
- Preset helpers use same mode keys: `atk_only`, `printing_only`, `atk_printing_combo`.
- Report and dashboard preset accessors use same `BusinessModeId` domain.
