export function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '')
}

export function buildApiUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedBaseUrl}/api/v1${normalizedPath}`
}

export function buildTenantQuery(input: { tenantId: string; branchId?: string; from?: string; to?: string }) {
  const params = new URLSearchParams({ tenantId: input.tenantId })

  if (input.branchId) params.set('branchId', input.branchId)
  if (input.from) params.set('from', input.from)
  if (input.to) params.set('to', input.to)

  return params
}

export async function apiGet<T>(path: string, query?: URLSearchParams) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
  const url = buildApiUrl(baseUrl, path)
  const response = await fetch(query ? `${url}?${query.toString()}` : url)

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
