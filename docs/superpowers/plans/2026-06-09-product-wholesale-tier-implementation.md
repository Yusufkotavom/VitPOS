# Product Wholesale Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix product edit price hydration and replace the single wholesale price field with an optional tiered `Minimal Qty + Harga` model.

**Architecture:** Keep product pricing centered in the existing product form/schema flow. Extend `LocalProduct` with a `wholesaleTiers` array, update record/form mappers, and make the form UI conditional on a `hasWholesalePricing` toggle. Preserve retail `price` as the fallback price and do not auto-convert legacy `wholesalePrice` into tiers.

**Tech Stack:** React, TypeScript, React Hook Form, Zod, Dexie/local DB types, Vitest, Vite.

---

## File Map

- Modify: `src/services/local-db/schema.ts`
  - Extend `LocalProduct` with `wholesaleTiers`.
- Modify: `src/features/products/schemas/product-form-schema.ts`
  - Add toggle/tier fields, validation, and mapper updates.
- Modify: `src/features/products/schemas/product-form-schema.test.ts`
  - Add tests for wholesale tier validation and mapper behavior.
- Modify: `src/shared/components/forms/currency-input.tsx`
  - Ensure displayed value reacts correctly to form resets in edit mode.
- Modify: `src/features/products/components/product-form.tsx`
  - Replace single wholesale field with toggle + repeatable tier rows.
- Modify: `src/features/products/pages/products-page.tsx`
  - Update list/card wholesale summary display.
- Optional follow-up only if needed during implementation: `src/features/products/components/product-crud-actions.tsx`
  - Only touch if form open/reset behavior needs a small guard.

### Task 1: Extend Product Data Shape

**Files:**
- Modify: `src/services/local-db/schema.ts`
- Test: `src/features/products/schemas/product-form-schema.test.ts`

- [ ] **Step 1: Write the failing type-level test expectation in schema tests**

Add a mapper expectation that includes `wholesaleTiers`:

```ts
expect(result.wholesaleTiers).toEqual([
  { minQty: 10, price: 14000 },
  { minQty: 50, price: 13000 },
])
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test -- src/features/products/schemas/product-form-schema.test.ts`
Expected: FAIL because `wholesaleTiers` is not part of `LocalProduct` mapping yet.

- [ ] **Step 3: Extend `LocalProduct` with tiered wholesale pricing**

Update `src/services/local-db/schema.ts` around `LocalProduct`:

```ts
export type LocalWholesaleTier = {
  minQty: number
  price: number
}

export type LocalProduct = {
  id: string
  tenantId: string
  name: string
  category: string
  type: ProductType
  price: number
  costPrice?: number
  wholesalePrice?: number
  wholesaleTiers?: LocalWholesaleTier[]
  stock: number
  manageStock?: boolean
  // ...existing fields
}
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS or only fail on downstream code that still needs updating for new type usage.

- [ ] **Step 5: Commit**

```bash
git add src/services/local-db/schema.ts src/features/products/schemas/product-form-schema.test.ts
git commit -m "feat(products): add wholesale tier product type"
```

### Task 2: Update Product Form Schema And Mappers

**Files:**
- Modify: `src/features/products/schemas/product-form-schema.ts`
- Modify: `src/features/products/schemas/product-form-schema.test.ts`

- [ ] **Step 1: Write failing tests for new form shape and mapper rules**

Add tests covering:

```ts
it('maps wholesale tiers when enabled', () => {
  const result = mapProductFormToRecord(
    {
      ...productInitialValues,
      name: 'Pulpen',
      category: 'ATK',
      type: 'Produk Fisik',
      price: '15000',
      costPrice: '10000',
      hasWholesalePricing: true,
      wholesaleTiers: [
        { minQty: '10', price: '14000' },
        { minQty: '50', price: '13000' },
      ],
      status: 'Aktif',
    },
    'product-1',
  )

  expect(result.wholesaleTiers).toEqual([
    { minQty: 10, price: 14000 },
    { minQty: 50, price: 13000 },
  ])
})

it('does not auto-convert legacy wholesalePrice to tiers', () => {
  const values = mapProductRecordToFormValues({
    id: 'product-1',
    tenantId: 'tenant-1',
    name: 'Pulpen',
    category: 'ATK',
    type: 'Produk Fisik',
    price: 15000,
    costPrice: 10000,
    wholesalePrice: 14000,
    stock: 5,
    manageStock: true,
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: '2026-06-09T00:00:00.000Z',
  })

  expect(values.hasWholesalePricing).toBe(false)
  expect(values.wholesaleTiers).toEqual([])
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test -- src/features/products/schemas/product-form-schema.test.ts`
Expected: FAIL because the new fields and mapper behavior do not exist yet.

- [ ] **Step 3: Extend form types and validation minimally**

Update `src/features/products/schemas/product-form-schema.ts` with explicit tier schemas:

```ts
const wholesaleTierSchema = z.object({
  minQty: z.string().trim(),
  price: z.string().trim(),
})

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama produk wajib diisi'),
    category: z.string().trim().min(1, 'Kategori wajib diisi'),
    type: z.enum(productTypeOptions),
    costPrice: z.string().trim().optional(),
    price: z.string().trim().min(1, 'Harga wajib diisi'),
    stock: z.string().trim().optional(),
    manageStock: z.boolean(),
    hasWholesalePricing: z.boolean(),
    wholesaleTiers: z.array(wholesaleTierSchema),
    status: z.enum(productStatusOptions),
    imageUrl: z.string().trim().optional(),
    icon: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.hasWholesalePricing) return
    if (values.wholesaleTiers.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['wholesaleTiers'], message: 'Minimal satu tier grosir wajib diisi' })
      return
    }

    let prevQty = 0
    values.wholesaleTiers.forEach((tier, index) => {
      const minQty = parseDigits(tier.minQty)
      const price = parseDigits(tier.price)
      if (minQty < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['wholesaleTiers', index, 'minQty'], message: 'Minimal qty harus 2 atau lebih' })
      }
      if (price <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['wholesaleTiers', index, 'price'], message: 'Harga grosir wajib lebih dari 0' })
      }
      if (index > 0 && minQty <= prevQty) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['wholesaleTiers', index, 'minQty'], message: 'Minimal qty harus urut naik' })
      }
      prevQty = minQty
    })
  })
```

- [ ] **Step 4: Update initial values and mapper functions**

Use this shape in the same file:

```ts
export const productInitialValues: ProductFormValues = {
  name: '',
  category: 'Umum',
  type: 'Produk Fisik',
  costPrice: '0',
  price: '0',
  stock: '0',
  manageStock: true,
  hasWholesalePricing: false,
  wholesaleTiers: [],
  status: 'Aktif',
  imageUrl: '',
  icon: 'Package',
}
```

And in `mapProductFormToRecord` / `mapProductRecordToFormValues`:

```ts
const parsedWholesaleTiers = values.hasWholesalePricing
  ? values.wholesaleTiers.map((tier) => ({
      minQty: parseDigits(tier.minQty),
      price: parseDigits(tier.price),
    }))
  : undefined

return {
  // ...existing fields
  wholesalePrice: undefined,
  wholesaleTiers: parsedWholesaleTiers,
}
```

```ts
wholesaleTiers: (product.wholesaleTiers ?? []).map((tier) => ({
  minQty: String(tier.minQty),
  price: String(tier.price),
})),
hasWholesalePricing: (product.wholesaleTiers?.length ?? 0) > 0,
```

- [ ] **Step 5: Run targeted tests**

Run: `npm run test -- src/features/products/schemas/product-form-schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/products/schemas/product-form-schema.ts src/features/products/schemas/product-form-schema.test.ts
git commit -m "feat(products): add wholesale tier validation"
```

### Task 3: Fix Currency Input Edit Hydration

**Files:**
- Modify: `src/shared/components/forms/currency-input.tsx`
- Modify: `src/features/products/components/product-form.tsx`

- [ ] **Step 1: Reproduce the hydration bug manually**

Open an existing product in edit mode and confirm one of these fields shows stale or zeroed display:

- `Harga Jual`
- `Modal / HPP`
- legacy `Harga Grosir` before it is replaced

Expected: UI does not reflect saved values consistently after `form.reset(...)`.

- [ ] **Step 2: Make `CurrencyInput` controlled-display sync explicit**

In `src/shared/components/forms/currency-input.tsx`, keep the local display value but normalize updates from external form values:

```ts
React.useEffect(() => {
  if (value === undefined || value === null || value === '') {
    setDisplayValue('')
    return
  }

  setDisplayValue(formatNumber(String(value)))
}, [value])
```

Keep `handleChange` passing raw numeric strings back into React Hook Form.

- [ ] **Step 3: Sync preview image state with edit resets**

In `src/features/products/components/product-form.tsx`, add:

```ts
useEffect(() => {
  setPreviewImage(defaultValues?.imageUrl || null)
}, [defaultValues?.imageUrl])
```

This prevents stale form UI state when switching between products.

- [ ] **Step 4: Run lint and typecheck**

Run:

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/forms/currency-input.tsx src/features/products/components/product-form.tsx
git commit -m "fix(products): hydrate price fields on edit"
```

### Task 4: Replace Wholesale Input With Toggle And Tier Rows

**Files:**
- Modify: `src/features/products/components/product-form.tsx`
- Modify: `src/features/products/schemas/product-form-schema.ts`

- [ ] **Step 1: Add repeatable tier form behavior**

In `src/features/products/components/product-form.tsx`, import `useFieldArray` and wire it to `wholesaleTiers`:

```ts
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

const hasWholesalePricing = useWatch({ control: form.control, name: 'hasWholesalePricing' })
const { fields, append, remove, replace } = useFieldArray({
  control: form.control,
  name: 'wholesaleTiers',
})
```

- [ ] **Step 2: Add toggle behavior with one starter row**

Use a checkbox or switch-like control with this logic:

```ts
function handleWholesaleToggle(nextValue: boolean) {
  form.setValue('hasWholesalePricing', nextValue, { shouldDirty: true })
  if (nextValue && form.getValues('wholesaleTiers').length === 0) {
    append({ minQty: '', price: '' })
  }
  if (!nextValue) {
    replace([])
  }
}
```

- [ ] **Step 3: Replace the old wholesale field markup**

Replace the single field block:

```tsx
<div className="space-y-2">
  <label className="flex items-center gap-2 text-sm font-medium">
    <input
      type="checkbox"
      checked={hasWholesalePricing}
      onChange={(event) => handleWholesaleToggle(event.target.checked)}
      className="size-4 rounded border-input"
    />
    Harga Grosir
  </label>

  {hasWholesalePricing ? (
    <div className="space-y-3 rounded-lg border p-3">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Minimal Qty</label>
            <Input inputMode="numeric" {...form.register(`wholesaleTiers.${index}.minQty`)} placeholder="10" />
            {errors.wholesaleTiers?.[index]?.minQty ? <span className="text-xs text-destructive">{errors.wholesaleTiers[index]?.minQty?.message}</span> : null}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Harga</label>
            <CurrencyInput prefix="Rp" {...form.register(`wholesaleTiers.${index}.price`)} placeholder="14000" />
            {errors.wholesaleTiers?.[index]?.price ? <span className="text-xs text-destructive">{errors.wholesaleTiers[index]?.price?.message}</span> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>Hapus</Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => append({ minQty: '', price: '' })}>
        Tambah Tier
      </Button>

      {typeof errors.wholesaleTiers?.message === 'string' ? <span className="text-xs text-destructive">{errors.wholesaleTiers.message}</span> : null}
    </div>
  ) : null}
</div>
```

- [ ] **Step 4: Run the app manually for form behavior**

Verify:

- toggle off hides tier rows
- toggle on creates first empty row
- add/remove works
- editing a record with tiers rehydrates all rows

- [ ] **Step 5: Commit**

```bash
git add src/features/products/components/product-form.tsx src/features/products/schemas/product-form-schema.ts
git commit -m "feat(products): add wholesale tier product form"
```

### Task 5: Update Product List Summary

**Files:**
- Modify: `src/features/products/pages/products-page.tsx`

- [ ] **Step 1: Add a helper for wholesale summary**

In `src/features/products/pages/products-page.tsx`, add:

```ts
function displayWholesaleSummary(product: { price: number; wholesaleTiers?: Array<{ minQty: number; price: number }> }) {
  const firstTier = product.wholesaleTiers?.[0]
  if (!firstTier) return formatCurrency(product.price)
  return `${formatCurrency(product.price)} / Grosir mulai ${firstTier.minQty} pcs ${formatCurrency(firstTier.price)}`
}
```

- [ ] **Step 2: Replace old `wholesalePrice` summary usage**

Change table/card usage from:

```tsx
row.wholesalePrice ? `${formatCurrency(row.price)} / Grosir ${formatCurrency(row.wholesalePrice)}` : formatCurrency(row.price)
```

to:

```tsx
displayWholesaleSummary(row)
```

- [ ] **Step 3: Run targeted app verification**

Open `/products` and confirm:

- products without tiers show only retail price
- products with tiers show `Grosir mulai ...`

- [ ] **Step 4: Commit**

```bash
git add src/features/products/pages/products-page.tsx
git commit -m "feat(products): summarize wholesale tiers in product list"
```

### Task 6: Full Verification

**Files:**
- Modify: any touched files from Tasks 1-5 if fixes are needed

- [ ] **Step 1: Run targeted schema tests**

Run: `npm run test -- src/features/products/schemas/product-form-schema.test.ts`
Expected: PASS.

- [ ] **Step 2: Run project lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Run project typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Run full project verification**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Run platform scaffold checks**

Run:

```bash
npm run check --prefix apps/desktop
npm run check --prefix apps/mobile
```

Expected: both PASS.

- [ ] **Step 6: Final commit**

```bash
git add src/services/local-db/schema.ts src/features/products/schemas/product-form-schema.ts src/features/products/schemas/product-form-schema.test.ts src/shared/components/forms/currency-input.tsx src/features/products/components/product-form.tsx src/features/products/pages/products-page.tsx
git commit -m "feat(products): support tiered wholesale pricing"
```

## Self-Review

- Spec coverage checked: hydration bug, wholesale toggle, tier rows, no auto-convert, validation, summary display, and verification are all covered.
- Placeholder scan checked: no `TODO`, `TBD`, or missing command placeholders remain.
- Type consistency checked: plan uses `hasWholesalePricing`, `wholesaleTiers`, `minQty`, and `price` consistently across schema, UI, and tests.
