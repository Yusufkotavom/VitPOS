# WA Sender & Message Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix WhatsApp sender to use customer phone number and add configurable message templates for POS, sales orders, and service orders.

**Architecture:** Create `MessageTemplateService` with default templates stored as constants and user overrides in `LocalSetting` (Dexie). Fix WA sender in 3 places: POS checkout, sales order detail, service order detail. Add template editing UI in Settings page.

**Tech Stack:** Dexie (local DB), TypeScript, React, shadcn/ui, Zustand

**Depends on:** `src/lib/whatsapp.ts` (exists), `LocalCustomer.phone` (exists), `LocalSetting` table (exists)

---

### Task 1: Create MessageTemplateService

**Files:**
- Create: `src/services/message-template.service.ts`

- [ ] **Step 1: Create service with default templates and render function**

```typescript
import { localDb } from '@/services/local-db/client'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export type MessageTemplateType =
  | 'invoice'
  | 'shortage'
  | 'paid'
  | 'status'
  | 'product_info'
  | 'service_order'

export const TEMPLATE_LABELS: Record<MessageTemplateType, string> = {
  invoice: 'Nota / Invoice',
  shortage: 'Kekurangan Pembayaran',
  paid: 'Pembayaran Lunas',
  status: 'Update Status Pesanan',
  product_info: 'Info Produk',
  service_order: 'Service Order',
}

export const TEMPLATE_VARIABLES: Record<MessageTemplateType, string[]> = {
  invoice: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name'],
  shortage: ['code', 'customer_name', 'total', 'paid', 'remaining'],
  paid: ['code', 'customer_name', 'total', 'paid'],
  status: ['code', 'customer_name', 'status'],
  product_info: ['product_name', 'price', 'stock', 'category'],
  service_order: ['code', 'customer_name', 'device', 'problem', 'status', 'cost'],
}

export const DEFAULT_TEMPLATES: Record<MessageTemplateType, string> = {
  invoice: `🛒 *NOTA PEMBELIAN*
─────────────────
*No Nota:* {{code}}
*Tanggal:* {{date}}
*Pelanggan:* {{customer_name}}
─────────────────
{{items}}
─────────────────
*Total:* {{total}}
*Bayar:* {{paid}}
*Kembali:* {{change}}
*Metode:* {{payment_method}}
─────────────────
Terima kasih telah berbelanja!`,

  shortage: `⚠️ *PEMBERITAHUAN*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Total:* {{total}}
*Terbayar:* {{paid}}
*Sisa:* {{remaining}}
─────────────────
Mohon segera dilunasi. Terima kasih.`,

  paid: `✅ *PEMBAYARAN LUNAS*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Total:* {{total}}
*Pembayaran:* {{paid}}
*Status:* LUNAS
─────────────────
Terima kasih!`,

  status: `📋 *UPDATE STATUS PESANAN*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Status:* {{status}}
─────────────────
Terima kasih.`,

  product_info: `📦 *INFO PRODUK*
─────────────────
*Produk:* {{product_name}}
*Harga:* {{price}}
*Stok:* {{stock}}
*Kategori:* {{category}}
─────────────────`,

  service_order: `🔧 *SERVICE ORDER*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Device:* {{device}}
*Masalah:* {{problem}}
*Status:* {{status}}
*Biaya:* {{cost}}
─────────────────
Terima kasih.`,
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match
  })
}

export const messageTemplateService = {
  async getTemplate(type: MessageTemplateType): Promise<string> {
    const tenantId = resolveTenantId()
    const override = await localDb.settings.get(`msg_template_${type}`)
    if (override && override.tenantId === tenantId && override.value.trim()) {
      return override.value
    }
    return DEFAULT_TEMPLATES[type]
  },

  async render(type: MessageTemplateType, variables: Record<string, string>): Promise<string> {
    const template = await this.getTemplate(type)
    return renderTemplate(template, variables)
  },

  async setOverride(type: MessageTemplateType, value: string): Promise<void> {
    const tenantId = resolveTenantId()
    const now = new Date().toISOString()
    await localDb.settings.put({
      id: `msg_template_${type}`,
      tenantId,
      area: 'Template Pesan',
      setting: TEMPLATE_LABELS[type],
      value,
      status: value.trim() ? 'Lengkap' : 'Belum Lengkap',
      updatedAt: now,
    })
  },

  async getOverride(type: MessageTemplateType): Promise<string | null> {
    const tenantId = resolveTenantId()
    const override = await localDb.settings.get(`msg_template_${type}`)
    if (override && override.tenantId === tenantId && override.value.trim()) {
      return override.value
    }
    return null
  },

  async resetToDefault(type: MessageTemplateType): Promise<void> {
    await localDb.settings.delete(`msg_template_${type}`)
  },
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/services/message-template.service.ts 2>&1 | head -20`
Expected: No TypeScript errors

---

### Task 2: Fix WA Sender in POS Checkout

**Files:**
- Modify: `src/features/pos/components/payment-summary.tsx`
- Modify: `src/features/pos/types/pos-order.types.ts`
- Modify: `src/features/pos/components/pos-success-dialog.tsx`

- [ ] **Step 1: Add `customerId` to `PosOrderSummary` type**

In `src/features/pos/types/pos-order.types.ts`, add `customerId` field:

```typescript
export type PosOrderSummary = {
  id: string
  code: string
  date: Date
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: PosPaymentMethod
  amountPaid: number
  change: number
  items: PosCartItem[]
  customerId?: string
  customerName?: string
  cashierName: string
}
```

- [ ] **Step 2: Pass `customerId` in POS checkout handler**

In `src/features/pos/components/payment-summary.tsx`, update `handleCheckout()` to include `customerId` in successOrder:

Edit the `setSuccessOrder` call (around line 44) — add `customerId: store.customerId`:

```typescript
      setSuccessOrder({
        id: result.salesOrderId,
        code: result.code,
        date: new Date(),
        subtotal: totals.subtotal,
        tax: 0,
        discount: store.discount,
        total: totals.total,
        paymentMethod: store.paymentMethod,
        amountPaid: store.paidAmount,
        change: Math.max(store.paidAmount - totals.total, 0),
        items: store.cartItems,
        customerId: store.customerId,
        customerName: store.customerName ?? 'Umum',
        cashierName: 'Kasir',
      })
```

And update the import to include `localDb`:

Add to imports at top:
```typescript
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
```
Remove the unused import:
Remove: `import { buildWhatsAppLink } from '@/lib/whatsapp'` (moved inline inside handleWhatsApp)

- [ ] **Step 3: Rewrite `handleWhatsApp()` to use customer phone + template**

Replace the `handleWhatsApp` function (lines 66-70):

```typescript
  async function handleWhatsApp() {
    if (!successOrder) return
    const customerId = successOrder.customerId
    let phone = ''
    if (customerId) {
      const customer = await localDb.customers.get(customerId)
      phone = customer?.phone ?? ''
    }
    if (!phone) {
      toast.error('Nomor WhatsApp pelanggan tidak ditemukan')
      return
    }

    const paid = formatCurrency(successOrder.amountPaid)
    const total = formatCurrency(successOrder.total)
    const change = formatCurrency(successOrder.change)
    const items = successOrder.items
      .map((item) => `${item.name} x${item.qty} = ${formatCurrency(item.subtotal)}`)
      .join('\n')

    const templateType = successOrder.amountPaid >= successOrder.total ? 'paid' : 'shortage'
    const text = await messageTemplateService.render(templateType, {
      code: successOrder.code,
      date: successOrder.date.toLocaleDateString('id-ID'),
      customer_name: successOrder.customerName ?? 'Umum',
      items,
      total,
      paid,
      change,
      payment_method: successOrder.paymentMethod,
      store_name: '',
    })

    const { buildWhatsAppLink } = await import('@/lib/whatsapp')
    window.open(buildWhatsAppLink(phone, text), '_blank')
  }
```

- [ ] **Step 4: Remove unused `buildWhatsAppLink` import**

Remove line 11:
```typescript
import { buildWhatsAppLink } from '@/lib/whatsapp'
```

- [ ] **Step 5: Verify POS success dialog passes through correctly**

In `src/features/pos/components/pos-success-dialog.tsx`, the `PosSuccessDialogProps` already has `onWhatsApp: () => void` — no changes needed, it already calls the handler from parent.

---

### Task 3: Enable WA Button on Sales Order Detail Page

**Files:**
- Modify: `src/features/sales-orders/pages/sales-order-detail-page.tsx`

- [ ] **Step 1: Add imports for WA sender**

Add imports at top:
```typescript
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/format-currency'
```

Note: `formatCurrency` is already imported. Check and deduplicate if needed.

- [ ] **Step 2: Add `handleWhatsApp` function**

Add before the `if (!order)` check (before line 130):

```typescript
  async function handleWhatsApp() {
    if (!order) return
    if (!order.customerId) {
      toast.error('Pelanggan tidak memiliki nomor WhatsApp')
      return
    }
    const customer = await localDb.customers.get(order.customerId)
    const phone = customer?.phone
    if (!phone) {
      toast.error('Nomor WhatsApp pelanggan tidak ditemukan')
      return
    }

    const total = formatCurrency(order.grandTotal)
    const paid = formatCurrency(order.paidTotal)
    const remaining = formatCurrency(Math.max(0, order.grandTotal - order.paidTotal))

    let templateType: 'paid' | 'shortage' | 'status' = 'status'
    if (order.status === 'Lunas') templateType = 'paid'
    else if (order.status === 'Sebagian' || order.paidTotal > 0) templateType = 'shortage'

    const items = order.items
      .map((item) => `${item.name} x${item.qty} = ${formatCurrency(item.subtotal)}`)
      .join('\n')

    const text = await messageTemplateService.render(templateType, {
      code: order.code,
      date: order.date,
      customer_name: order.customerName,
      items,
      total,
      paid,
      remaining,
      status: order.status,
      change: 'Rp 0',
      payment_method: '',
      store_name: '',
    })

    window.open(buildWhatsAppLink(phone, text), '_blank')
  }
```

- [ ] **Step 3: Enable the WA button**

Change the WA button from `disabled` to calling `handleWhatsApp` (around line 160):

```typescript
          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handleWhatsApp}>
            <MessageSquare className="mr-2 h-4 w-4" />
            WA
          </Button>
```

---

### Task 4: Enable WA Button on Service Order Detail Page

**Files:**
- Modify: `src/features/service-orders/pages/service-order-detail-page.tsx`

- [ ] **Step 1: Add imports**

Add imports at top:
```typescript
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { buildWhatsAppLink } from '@/lib/whatsapp'
```

- [ ] **Step 2: Add `handleWhatsApp` function**

Add before the `if (!order)` check (before line 82):

```typescript
  async function handleWhatsApp() {
    if (!order) return
    const customerName = order.customerName
    const customer = await localDb.customers
      .where('name')
      .equals(customerName)
      .toArray()
    const phone = customer.length > 0 ? customer[0].phone : ''
    if (!phone) {
      toast.error('Nomor WhatsApp pelanggan tidak ditemukan')
      return
    }

    const text = await messageTemplateService.render('service_order', {
      code: order.code,
      customer_name: order.customerName,
      device: order.description.split('\n')[0] || order.description,
      problem: order.description,
      status: order.status,
      cost: formatCurrency(order.cost),
      date: order.date,
      total: formatCurrency(order.cost),
      paid: '',
      remaining: '',
      items: '',
      change: '',
      payment_method: '',
      store_name: '',
    })

    window.open(buildWhatsAppLink(phone, text), '_blank')
  }
```

- [ ] **Step 3: Enable the WA button**

Change the WA button from `disabled` to calling `handleWhatsApp` (around line 105):

```typescript
          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handleWhatsApp}>
            <MessageSquare className="mr-2 h-4 w-4" />
            WA
          </Button>
```

---

### Task 5: Add Template Settings Page

**Files:**
- Create: `src/features/settings/pages/message-templates-page.tsx`
- Modify: `src/app/router.tsx` (add route)
- Modify: `src/app/navigation.ts` (add nav item)

- [ ] **Step 1: Create message templates page**

Create `src/features/settings/pages/message-templates-page.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PageShell } from '@/shared/components/layout/page-shell'
import { messageTemplateService, TEMPLATE_LABELS, TEMPLATE_VARIABLES, DEFAULT_TEMPLATES, type MessageTemplateType } from '@/services/message-template.service'
import { RotateCcw, Save } from 'lucide-react'

const TEMPLATE_TYPES: MessageTemplateType[] = ['invoice', 'shortage', 'paid', 'status', 'product_info', 'service_order']

export function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const loaded: Record<string, string> = {}
      for (const type of TEMPLATE_TYPES) {
        loaded[type] = await messageTemplateService.getTemplate(type)
      }
      setTemplates(loaded)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(type: MessageTemplateType) {
    const value = templates[type]
    await messageTemplateService.setOverride(type, value)
    setEditing((prev) => ({ ...prev, [type]: false }))
    toast.success(`Template ${TEMPLATE_LABELS[type]} disimpan`)
  }

  async function handleReset(type: MessageTemplateType) {
    await messageTemplateService.resetToDefault(type)
    setTemplates((prev) => ({ ...prev, [type]: DEFAULT_TEMPLATES[type] }))
    setEditing((prev) => ({ ...prev, [type]: false }))
    toast.success(`Template ${TEMPLATE_LABELS[type]} direset ke default`)
  }

  if (loading) {
    return (
      <PageShell title="Template Pesan WhatsApp" description="Atur template pesan WhatsApp untuk berbagai keperluan">
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Template Pesan WhatsApp" description="Atur template pesan WhatsApp untuk berbagai keperluan">
      <div className="space-y-6">
        {TEMPLATE_TYPES.map((type) => (
          <div key={type} className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{TEMPLATE_LABELS[type]}</h3>
                <p className="text-xs text-muted-foreground">
                  Variable: {TEMPLATE_VARIABLES[type].map((v) => `{{${v}}}`).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                {editing[type] ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleReset(type)}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => handleSave(type)}>
                      <Save className="mr-1 h-3.5 w-3.5" />
                      Simpan
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditing((prev) => ({ ...prev, [type]: true }))}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
            {editing[type] ? (
              <Textarea
                value={templates[type]}
                onChange={(e) => setTemplates((prev) => ({ ...prev, [type]: e.target.value }))}
                rows={8}
                className="font-mono text-sm"
              />
            ) : (
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm font-mono">{templates[type]}</pre>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  )
}
```

- [ ] **Step 2: Add route for message templates page**

In `src/app/router.tsx`, add import and route:

Add import:
```typescript
const MessageTemplatesPage = lazy(() => import('@/features/settings/pages/message-templates-page').then(pick('MessageTemplatesPage')))
```

Add route inside the `/settings` children (after line 84):
```typescript
      { path: 'settings/templates', element: routeElement(MessageTemplatesPage) },
```

- [ ] **Step 3: Add navigation item**

In `src/app/navigation.ts`, add sub-item under Settings:

In the settings group items (around line 100-101), add:
```typescript
          { to: '/settings/templates', label: 'Template WhatsApp', icon: MessageSquare },
```

Add import for `MessageSquare` icon at top:
```typescript
import { ..., MessageSquare, ... } from 'lucide-react'
```

---

### Task 6: Verifikasi Build

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit 2>&1`
Expected: No TypeScript errors

- [ ] **Step 2: Run lint**

Run: `npm run lint 2>&1 | head -30`
Expected: No errors (or minor warnings)

- [ ] **Step 3: Run build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

Commit all changes:
```bash
git add -A
git commit -m "feat: WA sender with customer phone number and message template system"
```
