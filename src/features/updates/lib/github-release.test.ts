import { describe, expect, it } from 'vitest'

import { isVersionNewer, resolvePreferredAsset, type ReleaseAsset } from '@/features/updates/lib/github-release'

describe('github release update helpers', () => {
  it('detects newer semver versions', () => {
    expect(isVersionNewer('1.0.0', '1.0.1')).toBe(true)
    expect(isVersionNewer('1.2.0', '1.1.9')).toBe(false)
    expect(isVersionNewer('1.2.0', '1.2.0')).toBe(false)
  })

  it('picks apk asset for android runtime', () => {
    const assets: ReleaseAsset[] = [
      { name: 'vitpos_1.2.0_x64-setup.exe', browser_download_url: 'https://example.com/setup.exe' },
      { name: 'app-release.apk', browser_download_url: 'https://example.com/app-release.apk' },
    ]

    expect(resolvePreferredAsset('android-apk', assets)).toEqual({
      preferredChannel: 'apk',
      preferredUrl: 'https://example.com/app-release.apk',
      apkUrl: 'https://example.com/app-release.apk',
    })
  })

  it('picks desktop installer for tauri windows runtime', () => {
    const assets: ReleaseAsset[] = [
      { name: 'vitpos_1.2.0_x64-setup.exe', browser_download_url: 'https://example.com/setup.exe' },
      { name: 'app-release.apk', browser_download_url: 'https://example.com/app-release.apk' },
    ]

    expect(resolvePreferredAsset('tauri-windows', assets)).toEqual({
      preferredChannel: 'desktop',
      preferredUrl: 'https://example.com/setup.exe',
      desktopUrl: 'https://example.com/setup.exe',
    })
  })
})
