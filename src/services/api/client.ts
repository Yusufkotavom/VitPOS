import { useAuthStore } from '@/features/auth/stores/auth-store'

export function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '')
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
  const state = useAuthStore.getState()
  if (state.token) {
    headers['authorization'] = `Bearer ${state.token}`
  } else if (state.currentUser) {
    headers['authorization'] = `Bearer dev-${state.currentUser.id}`
    headers['x-user-id'] = state.currentUser.id
  }
  return headers
}

export type ApiRequestOptions = {
  timeoutMs?: number
  signal?: AbortSignal
}

function createTimeoutSignal(timeoutMs = 10_000, externalSignal?: AbortSignal): AbortSignal {
  if (externalSignal) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
      const timeoutSignal = typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(timeoutMs)
        : createFallbackTimeoutSignal(timeoutMs)
      return AbortSignal.any([externalSignal, timeoutSignal])
    }
    return externalSignal
  }

  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs)
  }

  return createFallbackTimeoutSignal(timeoutMs)
}

function createFallbackTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null) as { message?: string } | null
  return payload?.message ?? `API request failed: ${response.status}`
}

export async function apiGet<T>(path: string, query?: URLSearchParams, options?: ApiRequestOptions) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const signal = createTimeoutSignal(options?.timeoutMs ?? 10_000, options?.signal)
  const response = await fetch(query ? `${url}?${query.toString()}` : url, {
    headers: getAuthHeaders(),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown, options?: ApiRequestOptions) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const signal = createTimeoutSignal(options?.timeoutMs ?? 10_000, options?.signal)
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown, options?: ApiRequestOptions) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const signal = createTimeoutSignal(options?.timeoutMs ?? 10_000, options?.signal)
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}

export async function apiDelete<T = { ok: boolean }>(path: string, options?: ApiRequestOptions) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010'
  const url = buildApiUrl(baseUrl, path)
  const signal = createTimeoutSignal(options?.timeoutMs ?? 10_000, options?.signal)
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<T>
}
