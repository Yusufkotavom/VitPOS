import { describe, expect, it, vi } from 'vitest'

import { apiGet, buildApiUrl, buildTenantQuery, normalizeApiBaseUrl } from '@/services/api/client'

describe('api client helpers', () => {
  it('normalizes base url without trailing slash', () => {
    expect(normalizeApiBaseUrl('https://api.kotacom.dev/')).toBe('https://api.kotacom.dev')
  })

  it('builds api v1 url from relative path', () => {
    expect(buildApiUrl('https://api.kotacom.dev/', '/reports/sales/summary')).toBe('https://api.kotacom.dev/api/v1/reports/sales/summary')
  })

  it('builds tenant query params', () => {
    expect(buildTenantQuery({ tenantId: 'tenant-1', branchId: 'branch-1', from: '2026-06-01', to: '2026-06-08' }).toString()).toBe(
      'tenantId=tenant-1&branchId=branch-1&from=2026-06-01&to=2026-06-08',
    )
  })

  it('calls fetch with timeout signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await apiGet<{ status: string }>('/health', undefined, { timeoutMs: 5000 })
    expect(res).toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.signal).toBeDefined()

    vi.unstubAllGlobals()
  })
})
