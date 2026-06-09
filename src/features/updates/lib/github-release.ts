import { detectRuntimePlatform, type RuntimePlatform } from '@/features/updates/lib/update-runtime'

export type UpdateChannel = 'web' | 'apk' | 'desktop'

export type ReleaseAsset = {
  name: string
  browser_download_url: string
}

export type GithubReleaseResponse = {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
  assets: ReleaseAsset[]
}

export type AvailableUpdate = {
  version: string
  releaseUrl: string
  notes: string
  publishedAt: string
  webUrl: string
  apkUrl?: string
  desktopUrl?: string
  preferredUrl?: string
  preferredChannel: UpdateChannel
}

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/Yusufkotavom/VitPOS/releases/latest'
const PUBLIC_WEB_URL = 'https://vit-pos-8vle.vercel.app'

function normalizeVersion(version: string) {
  return version.replace(/^v/i, '').trim()
}

function toSemverParts(version: string) {
  return normalizeVersion(version).split('.').map((part) => Number.parseInt(part, 10) || 0)
}

export function isVersionNewer(currentVersion: string, nextVersion: string) {
  const current = toSemverParts(currentVersion)
  const next = toSemverParts(nextVersion)
  const max = Math.max(current.length, next.length)

  for (let index = 0; index < max; index += 1) {
    const currentPart = current[index] || 0
    const nextPart = next[index] || 0
    if (nextPart > currentPart) return true
    if (nextPart < currentPart) return false
  }

  return false
}

function pickAsset(assets: ReleaseAsset[], matchers: RegExp[]) {
  return assets.find((asset) => matchers.some((matcher) => matcher.test(asset.name)))
}

export function resolvePreferredAsset(platform: RuntimePlatform, assets: ReleaseAsset[]) {
  const apk = pickAsset(assets, [/release\.apk$/i, /app-release.*\.apk$/i])
  const windows = pickAsset(assets, [/\.msi$/i, /setup.*\.exe$/i, /_x64-setup\.exe$/i, /\.exe$/i])
  const linux = pickAsset(assets, [/\.AppImage$/i, /\.deb$/i])
  const mac = pickAsset(assets, [/\.dmg$/i, /\.app\.tar\.gz$/i])

  switch (platform) {
    case 'android-apk':
      return { preferredChannel: apk ? 'apk' as const : 'web' as const, preferredUrl: apk?.browser_download_url, apkUrl: apk?.browser_download_url }
    case 'tauri-windows':
      return { preferredChannel: windows ? 'desktop' as const : 'web' as const, preferredUrl: windows?.browser_download_url, desktopUrl: windows?.browser_download_url }
    case 'tauri-linux':
      return { preferredChannel: linux ? 'desktop' as const : 'web' as const, preferredUrl: linux?.browser_download_url, desktopUrl: linux?.browser_download_url }
    case 'tauri-macos':
      return { preferredChannel: mac ? 'desktop' as const : 'web' as const, preferredUrl: mac?.browser_download_url, desktopUrl: mac?.browser_download_url }
    default:
      return { preferredChannel: 'web' as const, preferredUrl: PUBLIC_WEB_URL }
  }
}

export async function fetchLatestUpdate() {
  const response = await fetch(GITHUB_RELEASES_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error('Gagal mengambil info update dari GitHub')
  }

  const release = await response.json() as GithubReleaseResponse
  const platform = detectRuntimePlatform()
  const resolved = resolvePreferredAsset(platform, release.assets)

  return {
    version: normalizeVersion(release.tag_name),
    releaseUrl: release.html_url,
    notes: release.body || '',
    publishedAt: release.published_at,
    webUrl: PUBLIC_WEB_URL,
    apkUrl: resolved.apkUrl,
    desktopUrl: resolved.desktopUrl,
    preferredUrl: resolved.preferredUrl || PUBLIC_WEB_URL,
    preferredChannel: resolved.preferredChannel,
  } satisfies AvailableUpdate
}
