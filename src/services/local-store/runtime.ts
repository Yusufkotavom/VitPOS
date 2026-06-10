import { Capacitor } from '@capacitor/core'

import type { RuntimeTarget } from '@/services/local-store/adapter'

export function getRuntimeTarget(): RuntimeTarget {
  if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
    return 'desktop'
  }

  if (Capacitor.isNativePlatform()) {
    return 'mobile'
  }

  return 'web'
}