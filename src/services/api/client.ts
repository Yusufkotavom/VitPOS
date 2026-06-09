import { useAuthStore } from '@/features/auth/stores/auth-store'

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

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  const user = useAuthStore.getState().currentUser
  if (user) {
    headers['x-user-id'] = user.id
  }
  return headers
}

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null) as { message?: string } | null
  return payload?.message ?? `API request failed: ${response.status}`
}

export async function apiGet<T>(path: string, query?: URLSearchParams) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const response = await fetch(query ? `${url}?${query.toString()}` : url, {
    headers: getAuthHeaders(),
  })

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
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}

export async function apiDelete<T = { ok: boolean }>(path: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}
