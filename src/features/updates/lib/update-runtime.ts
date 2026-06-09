import { Capacitor } from '@capacitor/core'

export type RuntimePlatform = 'web' | 'android-apk' | 'tauri-windows' | 'tauri-linux' | 'tauri-macos'

function userAgent() {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase()
}

export function isTauriRuntime() {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
}

export function isCapacitorRuntime() {
  return Capacitor.isNativePlatform()
}

export function detectRuntimePlatform(): RuntimePlatform {
  const agent = userAgent()

  if (isCapacitorRuntime()) {
    return 'android-apk'
  }

  if (isTauriRuntime()) {
    if (agent.includes('mac os')) return 'tauri-macos'
    if (agent.includes('linux')) return 'tauri-linux'
    return 'tauri-windows'
  }

  return 'web'
}

export async function getRuntimeVersion() {
  if (isCapacitorRuntime()) {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    return info.version || __APP_VERSION__
  }

  if (isTauriRuntime()) {
    const { getVersion } = await import('@tauri-apps/api/app')
    return await getVersion()
  }

  return __APP_VERSION__
}

export async function openExternalUrl(url: string) {
  if (isCapacitorRuntime()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
    return
  }

  if (isTauriRuntime()) {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
