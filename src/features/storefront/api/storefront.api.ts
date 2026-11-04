export interface StoreInfo {
  id: string
  slug: string
  name: string
  address?: string
  phone?: string
  logoUrl?: string
  description?: string
}

export interface StoreProduct {
  id: string
  name: string
  price: number
  imageUrl?: string
  category?: string
  description?: string
}

export interface TrackedOrder {
  id: string
  orderNumber?: string
  code?: string
  date: string
  grandTotal: number
  paidTotal: number
  status: string
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

export async function getStore(slug: string): Promise<StoreInfo> {
  const baseUrl = getBaseUrl()
  return publicFetch<StoreInfo>(`${baseUrl}/api/v1/store/${encodeURIComponent(slug)}`)
}

export async function getStoreProducts(slug: string): Promise<StoreProduct[]> {
  const baseUrl = getBaseUrl()
  return publicFetch<StoreProduct[]>(`${baseUrl}/api/v1/store/${encodeURIComponent(slug)}/products`)
}

export async function trackOrders(slug: string, phone: string): Promise<TrackedOrder[]> {
  const baseUrl = getBaseUrl()
  const params = new URLSearchParams({ phone })
  return publicFetch<TrackedOrder[]>(
    `${baseUrl}/api/v1/store/${encodeURIComponent(slug)}/track?${params.toString()}`,
  )
}
