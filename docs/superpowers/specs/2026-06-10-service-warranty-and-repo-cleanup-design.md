# Service Warranty And Repo Cleanup Design

## Goal

Add a structured warranty system to service orders and extend the service timeline to reflect warranty events, while also defining a separate cleanup track for the repo-wide `lint` and `typecheck` blockers.

## Scope Split

This work covers two related but separate streams:

1. **Service warranty feature**
2. **Repo-wide lint/typecheck cleanup**

They should be designed together for planning visibility, but implemented as separate tracks so the service feature is not blocked by unrelated type/lint debt.

## Current State

### Service Orders

Current `LocalServiceOrder` already contains:

- core order fields
- optional `items`
- optional `notes`
- optional `timeline`

Current timeline is a simple list of:

- `id`
- `status`
- `date`
- `note`

Current detail page already appends timeline entries when service status changes.

### Verification Debt

Current repo-wide verification is blocked by many unrelated errors across:

- local DB runtime/adapters
- shared layout/settings hooks
- pages that rely on loosely-typed row data
- cash, customers, inventory, products, payments, POS, service orders, and other feature pages

Because this debt is not caused by the warranty feature, it should be handled as a separate cleanup track.

## Warranty Design

## Recommended Approach

Store warranty directly on `LocalServiceOrder` as structured fields.

This is the smallest correct design because:

- warranty belongs to one service order
- the detail page already owns status and timeline behavior
- no separate warranty subsystem is needed yet

## Data Model

Extend `LocalServiceOrder` with:

- `hasWarranty?: boolean`
- `warrantyValue?: number`
- `warrantyUnit?: 'hari' | 'bulan' | 'tahun'`
- `warrantyStartDate?: string`
- `warrantyEndDate?: string`

Timeline entry shape should also be extended with a lightweight event type:

- `type?: 'status' | 'warranty'`

This keeps old timeline entries compatible while allowing UI to distinguish warranty events from service-status events.

## Warranty Activation Rule

Warranty starts from the moment the service order status becomes `Selesai`.

Approved business rule:

- do not start warranty from creation date
- do not use a manual start date by default
- use the first transition into `Selesai` as the activation point

## Create / Edit Form Behavior

Service order create and edit flows should include:

- `Garansi` toggle
- if enabled:
  - `Durasi Garansi`
  - `Satuan` select with:
    - `hari`
    - `bulan`
    - `tahun`

Behavior:

- if `Garansi` is off, warranty fields are hidden and ignored
- if `Garansi` is on, duration and unit are required
- before service reaches `Selesai`, warranty is shown as configured but not active yet
- after service reaches `Selesai`, start/end dates are calculated and shown

## Warranty Calculation Rules

### Before Completion

If warranty is enabled but service is not yet `Selesai`:

- `warrantyStartDate` remains empty
- `warrantyEndDate` remains empty
- UI shows `Belum aktif`

### On First Completion

When status changes into `Selesai` and warranty is enabled:

- set `warrantyStartDate` to the completion timestamp
- compute `warrantyEndDate` from `warrantyStartDate + duration`

### After Completion Edits

If warranty duration or unit is changed after completion:

- keep the existing `warrantyStartDate`
- recompute `warrantyEndDate` from that same start date

### If Warranty Is Disabled Later

If user turns warranty off after it was configured:

- clear warranty fields from the record
- append a warranty-related timeline note to preserve history

## Service Page UI

Add a dedicated warranty section to the service detail page.

Display should include:

- status label
- duration summary
- activation date if available
- expiry date if available

Warranty state language:

- `Belum aktif` if service not yet `Selesai`
- `Aktif sampai ...` if warranty is active and not expired
- `Berakhir pada ...` if expiry date is in the past
- `Tanpa garansi` if warranty is disabled

This section should be visible in the service detail page, near operational details rather than hidden in notes.

## Timeline Extension

Timeline should show warranty events alongside service status events.

Examples:

- `Garansi diatur 30 hari`
- `Garansi aktif sampai 12 Oktober 2026`
- `Garansi diubah menjadi 3 bulan`
- `Garansi dihapus`

Timeline rendering should distinguish warranty events with a separate visual label or icon, but remain within the existing timeline block.

This avoids building a second history system.

## Status And Timeline Interaction

When a service order changes status:

- keep the current status timeline behavior
- if new status is `Selesai` and warranty is enabled:
  - compute warranty dates
  - append warranty activation timeline event

When warranty config changes without a status change:

- append a warranty timeline event only if the warranty meaning changed

Examples of meaningful change:

- toggle off -> on
- duration changed
- unit changed
- warranty removed

## Validation Rules

If `hasWarranty` is false:

- warranty fields are optional and ignored

If `hasWarranty` is true:

- `warrantyValue` is required
- `warrantyValue` must be a positive integer
- `warrantyUnit` is required

No manual warranty start date is required from the user.

## Compatibility Rules

Existing service orders without warranty data must continue working.

Default behavior for old records:

- `hasWarranty = false`
- no warranty section should break
- timeline rendering must support old timeline items that do not have `type`

## Testing Requirements

Add tests for:

- mapping service order form values with warranty disabled
- mapping service order form values with warranty enabled
- computing `warrantyStartDate` and `warrantyEndDate` when status becomes `Selesai`
- recomputing end date when warranty duration changes after completion
- keeping old records readable without warranty fields
- timeline event generation for:
  - warranty configured
  - warranty activated
  - warranty updated
  - warranty removed

Manual verification should cover:

- create service without warranty
- create service with warranty and mark status to `Selesai`
- edit warranty duration after completion
- view warranty details in service page
- view warranty entries in timeline

## Repo Cleanup Track

## Goal

Restore meaningful full-repo verification by fixing current `lint` and `typecheck` blockers.

## Recommended Cleanup Strategy

Do not mix cleanup logic into the service warranty implementation.

Instead, fix blockers in batches by area:

1. local-db adapter/runtime type safety
2. shared hooks/layout implicit `any`
3. table/page row typing in feature pages
4. remaining feature-specific implicit `any` and narrowed row-shape issues

This batching reduces risk and makes verification progress measurable.

## Cleanup Principles

- prefer adding correct types over `any`
- do not suppress lint/type errors unless there is a clear architectural reason
- fix root type sources where possible, especially shared table/component generics
- avoid unrelated behavior changes while cleaning typing

## Cleanup Deliverables

The cleanup track should end with:

- `npm run lint` passing
- `npm run typecheck` passing
- `npm run check` passing if no further blocker exists

## Risks

- repo-wide typing issues may reveal deeper generic/component API mismatches
- fixing shared table row types could touch many pages
- service warranty changes may require local DB version/schema updates if persistence assumptions change

## Minimal Implementation Order

1. Extend service order data model and form schema for warranty.
2. Add warranty inputs to service create/edit flow.
3. Add warranty calculation logic on transition to `Selesai`.
4. Extend service detail page warranty section.
5. Extend service timeline with warranty events.
6. Add targeted tests for warranty logic.
7. Separately execute repo-wide lint/typecheck cleanup in batches.

## Out Of Scope

Not included in this design:

- warranty claim workflow
- automatic alerts for expiring warranty
- filtering service orders by warranty status
- dashboard widgets for warranty expiry
- server-side sync schema changes beyond local model alignment
