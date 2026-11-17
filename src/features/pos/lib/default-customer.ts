import { localDb } from '@/services/local-db/client'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import type { LocalCustomer } from '@/services/local-db/schema'

export const DEFAULT_CUSTOMER_NAME = 'Pelanggan Umum'
export const DEFAULT_CUSTOMER_ID = 'default-customer-umum'

export interface PosCustomerTarget {
  id: string
  name: string
}

export function getDefaultCustomer(customers?: Partial<LocalCustomer>[]): PosCustomerTarget {
  if (customers && customers.length > 0) {
    const active = customers.filter((c) => !c.status || c.status === 'Aktif')

    // 1. Exact match for 'Pelanggan Umum' (case-insensitive)
    const exact = active.find(
      (c) => c.name?.trim().toLowerCase() === DEFAULT_CUSTOMER_NAME.toLowerCase(),
    )
    if (exact && exact.name) {
      return { id: exact.id || DEFAULT_CUSTOMER_ID, name: exact.name }
    }

    // 2. Partial match containing 'umum'
    const partial = active.find((c) => c.name?.trim().toLowerCase().includes('umum'))
    if (partial && partial.name) {
      return { id: partial.id || DEFAULT_CUSTOMER_ID, name: partial.name }
    }
  }

  return { id: DEFAULT_CUSTOMER_ID, name: DEFAULT_CUSTOMER_NAME }
}

export async function ensureDefaultCustomer(baseTenantId?: string): Promise<LocalCustomer> {
  const tenantId = resolveTenantId(baseTenantId)
  const existing = await localDb.customers.where('tenantId').equals(tenantId).toArray()
  const found = existing.find(
    (c) => c.name.trim().toLowerCase() === DEFAULT_CUSTOMER_NAME.toLowerCase(),
  )
  if (found) return found

  const newCustomer: LocalCustomer = {
    id: `${tenantId}-customer-umum`,
    tenantId,
    name: DEFAULT_CUSTOMER_NAME,
    phone: '081234567890',
    city: 'Surabaya',
    receivable: 0,
    orders: 0,
    status: 'Aktif',
    syncStatus: 'synced',
    version: 1,
    updatedAt: new Date().toISOString(),
  }

  await localDb.customers.put(newCustomer)
  return newCustomer
}
