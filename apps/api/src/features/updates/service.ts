type ReleaseAsset = {
  name: string
  browser_download_url: string
}

type GithubReleaseResponse = {
  tag_name: string
  html_url: string
  body: string | null
  published_at: string
  assets: ReleaseAsset[]
}

export type AppUpdatePlatform = 'web' | 'android-apk' | 'tauri-windows' | 'tauri-linux' | 'tauri-macos'

export type AppUpdateResponse = {
  ok: true
  available: boolean
  version: string
  notes: string
  publishedAt: string | null
  releaseUrl: string
  webUrl: string
  preferredChannel: 'web' | 'apk' | 'desktop'
  preferredUrl: string
  apkUrl?: string
  desktopUrl?: string
  checksum?: string
}

export type DesktopUpdateResponse = {
  version: string
  notes: string
  pub_date: string
  url: string
  signature: string
}

const GITHUB_RELEASES_API_URL = process.env.GITHUB_RELEASES_API_URL ?? 'https://api.github.com/repos/Yusufkotavom/VitPOS/releases/latest'
const PUBLIC_WEB_URL = process.env.PUBLIC_WEB_URL ?? 'https://vit-pos-8vle.vercel.app'

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

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch release metadata: ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function fetchText(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch release asset text: ${response.status}`)
  }

  return response.text()
}

export async function fetchLatestRelease() {
  return fetchJson<GithubReleaseResponse>(GITHUB_RELEASES_API_URL)
}

function pickAsset(assets: ReleaseAsset[], matchers: RegExp[]) {
  return assets.find((asset) => matchers.some((matcher) => matcher.test(asset.name)))
}

function desktopMatchers(target: string, arch: string) {
  if (target === 'windows') {
    return [/\.msi$/i, new RegExp(`${arch}.*\\.exe$`, 'i'), /setup.*\.exe$/i, /\.exe$/i]
  }

  if (target === 'darwin') {
    return [/\.app\.tar\.gz$/i, /\.dmg$/i]
  }

  return [/\.AppImage$/i, /\.appimage$/i, /\.deb$/i]
}

async function resolveDesktopAsset(target: string, arch: string, assets: ReleaseAsset[]) {
  const installer = pickAsset(assets, desktopMatchers(target, arch))
  if (!installer) return null

  const signatureAsset = assets.find((asset) => asset.name === `${installer.name}.sig`)
  if (!signatureAsset) return null

  return {
    installer,
    signature: (await fetchText(signatureAsset.browser_download_url)).trim(),
  }
}

async function resolveAndroidUpdate(assets: ReleaseAsset[]) {
  const apk = pickAsset(assets, [/release\.apk$/i, /app-release.*\.apk$/i])
  if (!apk) return null

  const checksumAsset = assets.find((asset) => asset.name === `${apk.name}.sha256`)
  return {
    apk,
    checksum: checksumAsset ? (await fetchText(checksumAsset.browser_download_url)).trim() : undefined,
  }
}

export async function resolveDesktopUpdate(target: string, arch: string, currentVersion: string): Promise<DesktopUpdateResponse | null> {
  const release = await fetchLatestRelease()
  const version = normalizeVersion(release.tag_name)

  if (!isVersionNewer(currentVersion, version)) {
    return null
  }

  const desktop = await resolveDesktopAsset(target, arch, release.assets)
  if (!desktop) return null

  return {
    version,
    notes: release.body || '',
    pub_date: release.published_at,
    url: desktop.installer.browser_download_url,
    signature: desktop.signature,
  }
}

export async function resolveAppUpdate(platform: AppUpdatePlatform, currentVersion: string): Promise<AppUpdateResponse> {
  const release = await fetchLatestRelease()
  const version = normalizeVersion(release.tag_name)
  const baseResponse = {
    ok: true as const,
    available: isVersionNewer(currentVersion, version),
    version,
    notes: release.body || '',
    publishedAt: release.published_at || null,
    releaseUrl: release.html_url,
    webUrl: PUBLIC_WEB_URL,
  }

  if (!baseResponse.available) {
    return {
      ...baseResponse,
      preferredChannel: 'web',
      preferredUrl: PUBLIC_WEB_URL,
    }
  }

  if (platform === 'android-apk') {
    const android = await resolveAndroidUpdate(release.assets)
    return {
      ...baseResponse,
      apkUrl: android?.apk.browser_download_url,
      checksum: android?.checksum,
      preferredChannel: android ? 'apk' : 'web',
      preferredUrl: android?.apk.browser_download_url || PUBLIC_WEB_URL,
    }
  }

  if (platform === 'tauri-windows' || platform === 'tauri-linux' || platform === 'tauri-macos') {
    const target = platform === 'tauri-windows' ? 'windows' : platform === 'tauri-macos' ? 'darwin' : 'linux'
    const desktop = await resolveDesktopAsset(target, 'x86_64', release.assets)
    return {
      ...baseResponse,
      desktopUrl: desktop?.installer.browser_download_url,
      preferredChannel: desktop ? 'desktop' : 'web',
      preferredUrl: desktop?.installer.browser_download_url || PUBLIC_WEB_URL,
    }
  }

  return {
    ...baseResponse,
    preferredChannel: 'web',
    preferredUrl: PUBLIC_WEB_URL,
  }
}
