import type { LocalPurchase, LocalPurchaseItem, PurchaseStatus } from '@/services/local-db/schema'

export const purchaseStatusOptions = ['Draft', 'Dikirim', 'Diterima', 'Batal'] as const

const STATUS_MAP: Record<string, PurchaseStatus> = {
  draft: 'Draft',
  dikirim: 'Dikirim',
  shipped: 'Dikirim',
  diterima: 'Diterima',
  received: 'Diterima',
  batal: 'Batal',
  cancelled: 'Batal',
  canceled: 'Batal',
}

/**
 * The cloud API stores purchase status as lowercase English
 * (`draft | shipped | received | cancelled`). Older local rows can also hold
 * arbitrary values after a sync pull, so every read path funnels through here.
 */
export function normalizePurchaseStatus(value: unknown): PurchaseStatus {
  if (typeof value !== 'string') return 'Draft'

  const raw = value.trim()
  if (!raw) return 'Draft'

  const direct = STATUS_MAP[raw.toLowerCase()]
  if (direct) return direct

  const match = purchaseStatusOptions.find((option) => option.toLowerCase() === raw.toLowerCase())
  return match ?? 'Draft'
}

export function normalizePurchaseItems(items: unknown, fallbackTenantId: string, purchaseId: string): LocalPurchaseItem[] {
  if (!Array.isArray(items)) return []

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => {
      const qty = Number(item.qty ?? 0)
      const unitPrice = Number(item.unitPrice ?? 0)

      return {
        id: typeof item.id === 'string' && item.id ? item.id : `${purchaseId}-item-${index}`,
        tenantId: typeof item.tenantId === 'string' ? item.tenantId : fallbackTenantId,
        purchaseId,
        productId: typeof item.productId === 'string' ? item.productId : '',
        name: typeof item.name === 'string' ? item.name : '',
        qty: Number.isFinite(qty) ? qty : 0,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
        subtotal: Number.isFinite(Number(item.subtotal)) ? Number(item.subtotal) : qty * unitPrice,
      }
    })
}

export function normalizePurchase(purchase: LocalPurchase, items?: LocalPurchaseItem[]): LocalPurchase {
  const resolvedItems = items && items.length > 0
    ? items
    : normalizePurchaseItems(purchase.items, purchase.tenantId, purchase.id)

  return {
    ...purchase,
    status: normalizePurchaseStatus(purchase.status),
    items: resolvedItems,
  }
}
