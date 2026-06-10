export type RuntimeTarget = 'web' | 'desktop' | 'mobile'

type WindowWithCapacitor = Window & {
  Capacitor?: unknown
}

export function getRuntimeTarget(): RuntimeTarget {
  // Always return web for test environments
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return 'web'
  }
  
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return 'desktop'
  }
  
  if (typeof window !== 'undefined' && (window as WindowWithCapacitor).Capacitor) {
    return 'mobile'
  }
  
  return 'web'
}
