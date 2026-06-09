# Full Multi-Tenant Isolation Design

## Goal
Make all operational data tenant-scoped so one user can own and switch between multiple businesses without seeing another tenant's products, transactions, customers, stock, settings, or reports.

## Current Problem
Authentication has tenants and memberships, but business data is global. Tables such as products, customers, sales orders, payments, stock movements, settings, and service orders do not include `tenantId`. Many features read via global `toArray()` or `get(id)`, so a new business can see old tenant transactions.

## Data Model
Add `tenantId: string` to every business-owned entity:

- products
- productCategories
- customers
- salesOrders
- salesOrderItems
- payments
- stockMovements
- inventory
- cash
- cashCategories
- settings
- paymentMethods
- shifts
- suppliers
- purchases
- purchaseItems
- returns
- returnItems
- serviceOrders

Also add tenant scope to sync-owned rows where relevant:

- outbox
- syncConflicts
- syncRuns

Auth tables remain global:

- users
- tenants
- tenantMembers

## Dexie Migration
Create a new database version after version 10.

Each tenant-owned table gets a `tenantId` index and key compound indexes used for list screens.

Examples:

- `products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt'`
- `customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt'`
- `salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt'`
- `payments: 'id, tenantId, [tenantId+salesOrderId], [tenantId+date], [tenantId+status], syncStatus, updatedAt'`

Existing data without tenantId is assigned to the currently active tenant if one exists. If not, it is assigned to a generated legacy tenant named `Data Lama` and membership is created for the current user when possible.

## Access Pattern
All feature reads and writes must require tenant context.

Create tenant-aware helpers:

- `requireActiveTenantId()`
- `listByTenant(table, tenantId)`
- `getByTenant(table, tenantId, id)`
- `putForTenant(table, tenantId, row)`
- `deleteByTenant(table, tenantId, id)`

No feature page may read tenant-owned data with raw `toArray()` or raw `get(id)` unless it also verifies `row.tenantId === activeTenant.id`.

## Onboarding
When a new tenant is created:

- tenant row is created
- tenantMember row is created
- initial products are created with new `tenantId`
- payment setting row is created with new `tenantId`
- active tenant is set before redirecting to billing

## POS Transaction Flow
POS transaction service must receive `tenantId` and write all generated rows with that tenant:

- salesOrder
- salesOrderItems
- payment
- stockMovements
- product stock updates must verify product belongs to tenant

If tenantId is missing, transaction fails with clear error.

## Reporting & Detail Pages
Dashboard, customer detail, invoice print, receipt print, stock timelines, and order detail pages must only show records for active tenant.

## Sync
Outbox and sync engine records must include tenantId, and deletes/updates must match both `tenantId` and entity id.

## Testing
Add regression tests:

1. Tenant A product is invisible after switching to Tenant B.
2. Tenant A sales order is invisible in Tenant B dashboard and sales order list.
3. POS transaction writes every row with active tenantId.
4. Onboarding seeds products and payment settings with new tenantId.
5. Customer detail only loads orders for active tenant.

## Success Criteria
After sign up or adding new business, the app must show empty or seeded data for that tenant only. Old transactions from another tenant must not appear anywhere.
