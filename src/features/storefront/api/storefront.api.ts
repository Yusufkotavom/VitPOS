export interface StoreInfo {
  tenantId: string
  name: string
  address?: string | null
  phone?: string | null
  icon?: string | null
  logoUrl?: string | null
  description?: string | null
}

export interface StoreProduct {
  id: string
  name: string
  price: number | string
  imageUrl?: string | null
  icon?: string | null
  category?: string | null
  type?: string
}

export interface TrackedOrderItem {
  id: string
  productId?: string | null
  name: string
  qty: number
  unitPrice: number
  subtotal: number
}

export interface TrackedOrder {
  id: string
  orderNumber?: string
  code?: string
  date: string
  grandTotal: number
  paidTotal: number
  subtotal?: number
  status: string
  notes?: string | null
  itemCount?: number
  items?: TrackedOrderItem[]
}

export interface CheckoutInput {
  customer: {
    name?: string
    phone?: string
    address?: string
    notes?: string
  }
  orderType: 'delivery' | 'pickup'
  items: Array<{
    productId: string
    qty: number
    notes?: string
  }>
}

export interface CheckoutResponse {
  ok: boolean
  order: {
    id: string
    orderNumber: string
    grandTotal: number
    status: string
    orderType: string
    date: string
  }
  customer: {
    id: string
    name: string
    phone: string
  }
  store: {
    name: string
    phone: string
  }
  whatsappUrl: string | null
  whatsappMessage: string
}

const getBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010').replace(/\/+$/, '')

async function publicFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

// The API always answers with an `ok` envelope (`{ ok, store }`, `{ ok, products }`,
// `{ ok, customer, orders }`), so unwrap it here rather than leaking it to callers.
export async function getStore(slug: string): Promise<StoreInfo> {
  const baseUrl = getBaseUrl()
  const res = await publicFetch<{ ok: boolean; store: StoreInfo }>(
    `${baseUrl}/api/v1/store/${encodeURIComponent(slug)}`,
  )
  return res.store
}

export async function getStoreProducts(slug: string): Promise<StoreProduct[]> {
  const baseUrl = getBaseUrl()
  const res = await publicFetch<{ ok: boolean; products: StoreProduct[] }>(
    `${baseUrl}/api/v1/store/${encodeURIComponent(slug)}/products`,
  )
  return res.products ?? []
}

export async function trackOrders(slug: string, phone: string): Promise<TrackedOrder[]> {
  const baseUrl = getBaseUrl()
  const params = new URLSearchParams({ phone })
  const res = await publicFetch<{ ok: boolean; orders: TrackedOrder[] }>(
    `${baseUrl}/api/v1/store/${encodeURIComponent(slug)}/track?${params.toString()}`,
  )
  return res.orders ?? []
}

export async function submitStoreCheckout(slug: string, payload: CheckoutInput): Promise<CheckoutResponse> {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/v1/store/${encodeURIComponent(slug)}/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = (await res.json().catch(() => null)) as (CheckoutResponse & { message?: string }) | null
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message ?? `Gagal memproses pesanan (${res.status})`)
  }

  return data
}
