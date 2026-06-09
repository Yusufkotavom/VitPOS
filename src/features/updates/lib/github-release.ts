import { buildApiUrl } from '@/services/api/client'
import { type RuntimePlatform } from '@/features/updates/lib/update-runtime'

export type UpdateChannel = 'web' | 'apk' | 'desktop'

export type AvailableUpdate = {
  available: boolean
  version: string
  releaseUrl: string
  notes: string
  publishedAt: string | null
  webUrl: string
  apkUrl?: string
  desktopUrl?: string
  checksum?: string
  preferredUrl?: string
  preferredChannel: UpdateChannel
}

const DEFAULT_API_BASE_URL = 'https://vit-pos-8vle.vercel.app'

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

export async function fetchLatestUpdate(currentVersion: string, platform: RuntimePlatform) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
  const url = buildApiUrl(baseUrl, '/updates/latest')
  const query = new URLSearchParams({ platform, currentVersion })
  const response = await fetch(`${url}?${query.toString()}`)

  if (!response.ok) {
    throw new Error('Gagal mengambil info update dari server aplikasi')
  }

  return response.json() as Promise<AvailableUpdate>
}
