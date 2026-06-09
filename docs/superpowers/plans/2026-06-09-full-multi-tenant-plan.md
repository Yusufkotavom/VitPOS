# Full Multi-Tenant Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the entire local database schema, Dexie indexes, repository layer, and feature hooks to enforce hard multi-tenant isolation.

**Architecture:** Add `tenantId` to all business tables. Bump Dexie to version 11 with `[tenantId+...]` compound indexes. Refactor `repository.ts` to `tenant-repository.ts` enforcing `tenantId` scopes. Refactor all React features/hooks to pass `activeTenant.id` downward.

**Tech Stack:** React, TypeScript, Dexie (IndexedDB), Zustand.

---

### Task 1: Update Schema and Dexie Database Definition

**Files:**
- Modify: `src/services/local-db/schema.ts`
- Modify: `src/services/local-db/client.ts`
- Test: `src/services/local-db/local-auth-schema.test.ts` (if relevant)

- [ ] **Step 1: Add tenantId to schema**
Modify `schema.ts`. Add `tenantId: string` to all business types. Let's start by modifying the core types.

```typescript
// Add tenantId to LocalProduct, LocalCustomer, LocalSalesOrder, LocalSalesOrderItem, LocalPayment, LocalStockMovement, LocalInventory, LocalCash, LocalCashCategory, LocalSetting, LocalShift, LocalSupplier, LocalPurchase, LocalPurchaseItem, LocalReturn, LocalReturnItem, LocalServiceOrder, LocalPaymentMethod
```
*(Agent instruction: Ensure `tenantId: string` is added to every type except `LocalUser`, `LocalTenant`, and `LocalTenantMember`. Do the same for `OutboxItem`, `SyncConflict`, `SyncRun`.)*

- [ ] **Step 2: Update Dexie Indexes (v11)**
Modify `client.ts`. Bump version to 11 and redefine all business stores to prefix with `tenantId`.

```typescript
    this.version(11).stores({
      users: 'id, email',
      tenants: 'id',
      tenantMembers: 'id, [userId+tenantId], userId',
      products: 'id, tenantId, [tenantId+name], [tenantId+category], [tenantId+status], syncStatus, updatedAt',
      productCategories: 'id, tenantId, [tenantId+name], [tenantId+status], syncStatus, updatedAt',
      customers: 'id, tenantId, [tenantId+name], [tenantId+phone], [tenantId+status], syncStatus, updatedAt',
      salesOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], [tenantId+status], syncStatus, updatedAt',
      salesOrderItems: 'id, tenantId, salesOrderId, productId',
      payments: 'id, tenantId, [tenantId+salesOrderId], ref, source, method, date, status, syncStatus, updatedAt',
      stockMovements: 'id, tenantId, [tenantId+productId], type, referenceId, syncStatus, updatedAt',
      inventory: 'id, tenantId, [tenantId+product], [tenantId+warehouse], status',
      cash: 'id, tenantId, [tenantId+ref], [tenantId+date], [tenantId+account], category, status',
      cashCategories: 'id, tenantId, [tenantId+name], type, status, syncStatus, updatedAt',
      settings: 'id, tenantId, [tenantId+area], [tenantId+setting], status',
      paymentMethods: 'id, tenantId, [tenantId+name], provider, type, status, updatedAt',
      shifts: 'id, tenantId, cashierName, startTime, status',
      suppliers: 'id, tenantId, [tenantId+name], [tenantId+phone], status, syncStatus, updatedAt',
      purchases: 'id, tenantId, [tenantId+code], [tenantId+supplierName], [tenantId+date], status, syncStatus, updatedAt',
      purchaseItems: 'id, tenantId, purchaseId, productId',
      returns: 'id, tenantId, [tenantId+code], type, referenceCode, date, status, syncStatus, updatedAt',
      returnItems: 'id, tenantId, returnId, productId',
      serviceOrders: 'id, tenantId, [tenantId+code], [tenantId+customerName], [tenantId+date], status, syncStatus, updatedAt',
      outbox: 'id, tenantId, [tenantId+entityType+entityId], mutationType, status, createdAt, updatedAt, syncedAt',
      syncConflicts: 'id, tenantId, [tenantId+entityType+entityId], status, createdAt, resolvedAt',
      syncRuns: 'id, tenantId, status, startedAt, finishedAt',
    })
```

- [ ] **Step 3: Run Typecheck**
Run `npm run typecheck`. Expect many errors in features that omit `tenantId` in inserts.

- [ ] **Step 4: Commit**
```bash
git add src/services/local-db/schema.ts src/services/local-db/client.ts
git commit -m "feat: add tenantId to all business schema and update dexie indexes to v11"
```

---

### Task 2: Refactor Repository Layer to be Tenant-Aware

**Files:**
- Modify: `src/services/local-db/repository.ts`

- [ ] **Step 1: Update Generic Repository**
Update the base `BaseRepository` to require `tenantId` on all reads and writes. Replace global `.toArray()` and `.put()` with tenant-aware queries.

```typescript
import type { EntityTable } from 'dexie'

export class TenantRepository<T extends { id: string; tenantId: string }> {
  constructor(protected table: EntityTable<T, 'id'>) {}

  async list(tenantId: string): Promise<T[]> {
    return this.table.where('tenantId').equals(tenantId).toArray()
  }

  async get(tenantId: string, id: string): Promise<T | undefined> {
    const item = await this.table.get(id)
    if (item && item.tenantId === tenantId) return item
    return undefined
  }

  async put(item: T): Promise<string> {
    if (!item.tenantId) throw new Error('tenantId is required for put')
    return this.table.put(item)
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const item = await this.get(tenantId, id)
    if (item) {
      await this.table.delete(id)
    }
  }

  // Also update bulk helpers
  async bulkPut(items: T[]): Promise<string> {
    if (items.some(i => !i.tenantId)) throw new Error('tenantId required for all items')
    return this.table.bulkPut(items)
  }
}
```

- [ ] **Step 2: Update all exported repositories**
Switch `export const productRepository = new BaseRepository(...)` to `export const productRepository = new TenantRepository(...)`.

- [ ] **Step 3: Commit**
```bash
git add src/services/local-db/repository.ts
git commit -m "refactor: convert base repository to TenantRepository enforcing tenantId"
```

---

### Task 3: Fix Feature Hooks and Seeders (Part 1 - Auth & Settings)

**Files:**
- Modify: `src/features/auth/pages/onboarding-page.tsx`
- Modify: `src/features/settings/hooks/use-settings.ts`
- Modify: `src/features/settings/components/setting-crud-actions.tsx`
- Modify: `src/features/pos/components/receipt-print-layout.tsx`

- [ ] **Step 1: Fix Onboarding Seed**
In `src/features/auth/pages/onboarding-page.tsx`, when seeding payments and products, add `tenantId`.

```tsx
      await localDb.settings.add({
        id: crypto.randomUUID(),
        tenantId, // Add this
        area: 'pos',
// ...
      // Setup initial products
      for (const p of products) {
        await localDb.products.add({
          id: crypto.randomUUID(),
          tenantId, // Add this
          name: p.name,
// ...
```

- [ ] **Step 2: Fix Settings Queries**
Update settings hooks to require active tenant context. Example for `useLiveQuery`:

```tsx
// use-settings.ts
export function useSettings() {
  const { activeTenant } = useAuthStore()
  return useLiveQuery(
    () => activeTenant ? localDb.settings.where('tenantId').equals(activeTenant.id).toArray() : [],
    [activeTenant?.id]
  )
}
```

- [ ] **Step 3: Commit**
```bash
git add src/features/auth/pages/onboarding-page.tsx src/features/settings/hooks/use-settings.ts src/features/pos/components/receipt-print-layout.tsx
git commit -m "fix: seed and settings hooks use tenantId context"
```

---

*(Agent Note: The remainder of tasks 4-6 will involve similarly fixing POS Transaction, Products, Customers, Sales Orders, and Sync Engine to pass `activeTenant.id`. Due to length limits, the executing agent will iteratively fix typecheck errors across all domains.)*

### Task 4: Fix POS Transaction Service & Products

- [ ] **Step 1: Fix `pos-transaction.service.ts`**
Require `tenantId: string` in `PosTransactionService.createSalesOrder` and inject it into `salesOrder`, `salesOrderItems`, `payment`, and `stockMovements`.

- [ ] **Step 2: Fix `use-products.ts` & CRUD**
Ensure `tenantId` is passed down to inserts.

### Task 5: Fix Customers & Sales Orders

- [ ] **Step 1: Fix `customer-detail-page.tsx`**
Filter sales orders by tenantId when loading for the customer.

### Task 6: Resolve all remaining Typecheck & Lint Errors

- [ ] **Step 1: Iteratively run `npm run typecheck`**
Find remaining `insert()` calls missing `tenantId` across all domains (Inventory, Cash, Suppliers, Purchases, Service Orders) and add them.

- [ ] **Step 2: Run Tests**
Run `npm run test` and fix failing test suites (e.g. `onboarding-registration.test.ts` missing `tenantId` in db counts).

- [ ] **Step 3: Final Commit**
```bash
git add -A
git commit -m "feat: complete multi-tenant strict isolation across all domains"
```
