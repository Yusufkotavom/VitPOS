# Product Wholesale Tier Design

## Goal

Improve product pricing so:

- edit product reliably loads `Harga Jual`, `Modal / HPP`, and other saved price data
- `Harga Grosir` uses tiered pricing with `Minimal Qty + Harga`
- wholesale pricing is optional and controlled by a toggle

## Current Problem

Current product pricing has two issues:

1. In edit mode, `Harga Jual`, `Modal / HPP`, and `Harga Grosir` are not reliably hydrated into the form UI.
2. Wholesale pricing only supports one flat `wholesalePrice`, which does not support quantity-based pricing tiers.

## Scope

This change covers:

- product form UI
- product form schema and validation
- product record mapping to and from form values
- local product data shape for wholesale pricing
- product list summary display for wholesale pricing
- regression coverage for mapping and validation

This change does not include:

- CSV import/export support for wholesale tiers
- POS pricing rule application at checkout
- automatic migration from old single `wholesalePrice` into tiers

## Recommended Approach

Replace the single optional wholesale price field with an explicit wholesale-pricing feature:

- `Harga Jual` remains the retail/base price
- `Harga Grosir` becomes a toggle
- when enabled, users can add one or more tier rows
- each tier row has:
  - `Minimal Qty`
  - `Harga`

This is the smallest design that supports real wholesale pricing without introducing a separate subsystem.

## Data Model

### Product Form Values

Extend the form values with:

- `hasWholesalePricing: boolean`
- `wholesaleTiers: Array<{ minQty: string; price: string }>`

Remove the form dependency on single-field `wholesalePrice` for new UI behavior.

### Product Record

Extend local product data with a tier array, for example:

```ts
wholesaleTiers?: Array<{
  minQty: number
  price: number
}>
```

Existing `price` remains the retail price.

Existing old `wholesalePrice` may still exist in stored records temporarily, but the new form should not auto-convert it into tier rows.

## Old Data Behavior

For legacy products that only have a single `wholesalePrice`:

- do not auto-convert
- do not synthesize a fake tier
- when editing, wholesale toggle should default from tier presence only
- if the product has no `wholesaleTiers`, the tier UI starts empty

This matches the approved requirement: user fills wholesale tiers manually.

## Form Behavior

### Retail Fields

- `Harga Jual` always visible
- `Modal / HPP` always visible

### Wholesale Toggle

- show a toggle labeled `Harga Grosir`
- when `off`, tier section is hidden
- when `on`, tier section appears

### Tier Rows

Each row contains:

- `Minimal Qty`
- `Harga`
- remove action

Section contains:

- add-tier action

Default behavior when toggle becomes `on`:

- create one empty tier row to guide user input

## Validation Rules

### Edit Hydration

The edit form must correctly hydrate all saved pricing values every time the modal/sheet opens.

### Wholesale Tier Validation

When wholesale toggle is `on`:

- at least one tier is required
- `Minimal Qty` must be a valid integer
- `Minimal Qty >= 2`
- `Harga` must be a valid positive number
- tiers must be strictly ascending by `Minimal Qty`
- duplicate `Minimal Qty` values are invalid

When wholesale toggle is `off`:

- tier rows are ignored during save

## Mapping Rules

### Form to Record

- parse `Harga Jual` into numeric `price`
- parse `Modal / HPP` into numeric `costPrice`
- if wholesale toggle is `on`, save parsed `wholesaleTiers`
- if wholesale toggle is `off`, save `wholesaleTiers` as empty or undefined

### Record to Form

- map numeric `price` to string form value
- map numeric `costPrice` to string form value
- map `wholesaleTiers` into repeatable form rows
- `hasWholesalePricing = wholesaleTiers.length > 0`
- old single `wholesalePrice` should not create tiers automatically

## UI Display Outside Form

In products list/card views:

- keep retail price display
- if wholesale tiers exist, show concise summary such as:

`Retail Rp15.200 / Grosir mulai 10 pcs Rp14.000`

Only the first tier needs to be summarized in the list.

## Root Cause Fix For Edit Load

The likely root cause is the interaction between `CurrencyInput` local display state and `react-hook-form` reset/default value behavior.

Implementation should ensure:

- field display state updates when form values reset on edit open
- product form preview image state also stays aligned with incoming `defaultValues`

The intended result is that edit mode always shows the current saved values instead of stale or zeroed UI state.

## Testing

Add or update tests for:

- mapping record to form values with retail fields populated
- mapping record to form values with wholesale tiers populated
- mapping record with old `wholesalePrice` but no tiers does not auto-fill tier rows
- mapping form to record with wholesale toggle off
- mapping form to record with ordered wholesale tiers
- validation failure for empty tiers when wholesale is enabled
- validation failure for duplicate or descending `Minimal Qty`

Manual verification should cover:

- create product without wholesale tiers
- create product with multiple wholesale tiers
- edit product and confirm retail fields hydrate
- edit product with wholesale tiers and confirm all tiers hydrate
- turn wholesale toggle off and save

## Risks

- product schema changes may require updates anywhere that assumes `wholesalePrice` is a single number
- any UI using `wholesalePrice` summary must be updated to read from `wholesaleTiers`
- CSV import/export remains single-price based until separately updated

## Minimal Implementation Sequence

1. Fix `CurrencyInput` / product form hydration behavior.
2. Extend product form schema with wholesale toggle and tier rows.
3. Update product record mapping functions.
4. Update product form UI.
5. Update list/card price summary.
6. Add regression tests.
7. Run lint, typecheck, tests, and build.
