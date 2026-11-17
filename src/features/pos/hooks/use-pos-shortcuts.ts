import { useEffect, useRef } from 'react'

type PosShortcutHandlers = {
  onFocusSearch: () => void
  onOpenPayment: () => void
  onClose: () => void
}

export function usePosShortcuts(handlers: PosShortcutHandlers, enabled = true) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handlersRef.current.onClose()
        return
      }

      if (event.key === 'F2') {
        event.preventDefault()
        handlersRef.current.onFocusSearch()
        return
      }

      if (event.key === 'F4') {
        event.preventDefault()
        handlersRef.current.onOpenPayment()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}
