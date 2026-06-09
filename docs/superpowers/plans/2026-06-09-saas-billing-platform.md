# SaaS Billing & Platform Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real SaaS billing structures in the DB, automate the 14-day trial during registration, and connect the Platform Admin page to a live backend API instead of mock data.

**Architecture:** We will extend the `tenants` table schema with subscription tracking columns. We will update the `authRoutes` to initialize these columns upon registration. We will create a new `platformRoutes` to query and expose a list of tenants and their owners to the frontend, and finally, connect the React UI to this new endpoint.

**Tech Stack:** Drizzle ORM, Hono, React, TanStack Query

---

### Task 1: Update Database Schema

**Files:**
- Modify: `src/db/schema/core.ts`

- [ ] **Step 1: Add Subscription Columns to Tenants**

Modify the `tenants` table definition in `src/db/schema/core.ts` to include billing fields.

```typescript
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trial', 'active', 'past_due', 'suspended', 'cancelled'])

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 160 }).notNull(),
  legalName: varchar('legal_name', { length: 200 }),
  npwp: varchar('npwp', { length: 64 }),
  nib: varchar('nib', { length: 64 }),
  phone: varchar('phone', { length: 40 }),
  email: varchar('email', { length: 160 }),
  address: text('address'),
  planCode: varchar('plan_code', { length: 40 }).default('free').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial').notNull(),
  planValidUntil: timestamp('plan_valid_until', { withTimezone: true }),
  storageLimitMb: integer('storage_limit_mb').default(512).notNull(),
  maxBranches: integer('max_branches').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
})
```

- [ ] **Step 2: Push Schema to Database**

Run: `npm run db:push`
Expected: Successfully pushed schema changes to Neon DB.

### Task 2: Update Registration Logic (Onboarding)

**Files:**
- Modify: `apps/api/src/features/auth/routes.ts`

- [ ] **Step 1: Set Trial Dates upon Registration**

Update the `authRoutes.post('/register')` route to automatically assign a 14-day trial period and subscription statuses.

```typescript
// Add these imports if needed
import { addDays } from 'date-fns'

// Inside authRoutes.post('/register', async (c) => { ... })
// Update the db.insert(tenants) call:
    const [tenant] = await db.insert(tenants).values({
      name: body.tenantName,
      planCode: 'starter', // Or 'trial'
      subscriptionStatus: 'trial',
      planValidUntil: addDays(new Date(), 14),
      storageLimitMb: 1024, // 1GB
      maxBranches: 1
    }).returning()
```

### Task 3: Create Platform Admin API Route

**Files:**
- Create: `apps/api/src/features/platform/routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create Platform Routes**

Create `apps/api/src/features/platform/routes.ts`:

```typescript
import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { tenants, tenantMembers, users } from '../../../../src/db/schema/core'

export const platformRoutes = new Hono()

platformRoutes.get('/tenants', async (c) => {
  const result = await db.select({
    id: tenants.id,
    tenantName: tenants.name,
    ownerName: users.name,
    city: tenants.address,
    packageName: tenants.planCode,
    subscriptionStatus: tenants.subscriptionStatus,
    planValidUntil: tenants.planValidUntil,
    storageLimitGb: sql<number>`${tenants.storageLimitMb} / 1024.0`,
    isActive: tenants.isActive
  })
  .from(tenants)
  .leftJoin(tenantMembers, eq(tenants.id, tenantMembers.tenantId))
  .leftJoin(users, eq(tenantMembers.userId, users.id))
  .where(eq(tenantMembers.role, 'owner'))

  return c.json({ ok: true, items: result })
})
```

- [ ] **Step 2: Mount Route in App**

Modify `apps/api/src/app.ts` to attach `platformRoutes`:

```typescript
import { platformRoutes } from './features/platform/routes'

// Inside app.ts
app.route('/api/v1/platform', platformRoutes)
```

### Task 4: Connect UI to Real API

**Files:**
- Create: `src/services/api/platform-admin.service.ts`
- Modify: `src/features/platform-admin/pages/platform-admin-page.tsx`

- [ ] **Step 1: Create API Client Service**

Create `src/services/api/platform-admin.service.ts`:

```typescript
import { apiGet } from '@/services/api/client'

export type PlatformTenant = {
  id: string
  tenantName: string
  ownerName: string | null
  city: string | null
  packageName: string
  subscriptionStatus: string
  planValidUntil: string | null
  storageLimitGb: number
  isActive: boolean
}

export const platformAdminService = {
  async getTenants(): Promise<PlatformTenant[]> {
    const res = await apiGet<{ ok: boolean, items: PlatformTenant[] }>('/platform/tenants')
    return res.items
  }
}
```

- [ ] **Step 2: Connect React Component**

Modify `src/features/platform-admin/pages/platform-admin-page.tsx` to use TanStack Query instead of mock data:

```typescript
import { useQuery } from '@tanstack/react-query'
import { platformAdminService } from '@/services/api/platform-admin.service'
import { format } from 'date-fns'
// (Keep existing imports)

export function PlatformAdminPage() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: platformAdminService.getTenants
  })

  return (
    // Replace mock data mappings with `tenants.map(tenant => ...)`
    // Example row:
    // <TableCell className="font-medium">{tenant.tenantName}</TableCell>
    // <TableCell>{tenant.ownerName ?? '-'}</TableCell>
    // <TableCell>{tenant.packageName}</TableCell>
    // <TableCell><StatusBadge label={tenant.subscriptionStatus} tone={tenant.subscriptionStatus === 'active' ? 'success' : 'warning'} /></TableCell>
    // <TableCell>{tenant.planValidUntil ? format(new Date(tenant.planValidUntil), 'dd MMM yyyy') : '-'}</TableCell>
  )
}
```
