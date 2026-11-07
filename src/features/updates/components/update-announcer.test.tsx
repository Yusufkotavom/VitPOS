import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { UpdateAnnouncer } from '@/features/updates/components/update-announcer'
import * as runtime from '@/features/updates/lib/update-runtime'
import * as useAppUpdateHook from '@/features/updates/hooks/use-app-update'

vi.mock('sonner', () => ({
  toast: {
    message: vi.fn(),
  },
}))

describe('UpdateAnnouncer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not trigger toast update on web platform', () => {
    vi.spyOn(runtime, 'detectRuntimePlatform').mockReturnValue('web')
    vi.spyOn(useAppUpdateHook, 'useAppUpdate').mockReturnValue({
      currentVersion: '1.2.5',
      latest: {
        available: true,
        version: '2.0.0',
        releaseUrl: 'https://github.com/Yusufkotavom/VitPOS/releases/tag/v2.0.0',
        notes: 'Major update',
        publishedAt: '2026-11-07T00:00:00Z',
        webUrl: 'https://vitpos.devk.my.id',
        preferredUrl: 'https://vitpos.devk.my.id',
        preferredChannel: 'web',
      },
      hasUpdate: true,
      loading: false,
      error: null,
      checkedAt: new Date().toISOString(),
      refresh: vi.fn(),
    })

    render(<UpdateAnnouncer />)

    expect(toast.message).not.toHaveBeenCalled()
  })

  it('triggers toast update on native platform (e.g. android-apk)', () => {
    vi.spyOn(runtime, 'detectRuntimePlatform').mockReturnValue('android-apk')
    vi.spyOn(useAppUpdateHook, 'useAppUpdate').mockReturnValue({
      currentVersion: '1.2.5',
      latest: {
        available: true,
        version: '2.0.0',
        releaseUrl: 'https://github.com/Yusufkotavom/VitPOS/releases/tag/v2.0.0',
        notes: 'Major update',
        publishedAt: '2026-11-07T00:00:00Z',
        webUrl: 'https://vitpos.devk.my.id',
        apkUrl: 'https://github.com/Yusufkotavom/VitPOS/releases/download/v2.0.0/app-release.apk',
        preferredUrl: 'https://github.com/Yusufkotavom/VitPOS/releases/download/v2.0.0/app-release.apk',
        preferredChannel: 'apk',
      },
      hasUpdate: true,
      loading: false,
      error: null,
      checkedAt: new Date().toISOString(),
      refresh: vi.fn(),
    })

    render(<UpdateAnnouncer />)

    expect(toast.message).toHaveBeenCalledWith(
      'Update v2.0.0 tersedia',
      expect.objectContaining({
        description: expect.stringContaining('GitHub Release'),
      }),
    )
  })
})
