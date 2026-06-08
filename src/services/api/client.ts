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

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null) as { message?: string } | null
  return payload?.message ?? `API request failed: ${response.status}`
}

export async function apiGet<T>(path: string, query?: URLSearchParams) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const response = await fetch(query ? `${url}?${query.toString()}` : url)

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}
