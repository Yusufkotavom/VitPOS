import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { runSync } from '@/services/sync/sync-engine'
import { cn } from '@/lib/utils'

type SyncPhase = 'syncing' | 'done' | 'error'

const DONE_DELAY_MS = 1_200
const FADE_OUT_MS = 400

const SYNC_PHRASES = [
  'Menyinkronkan data\u2026',
  'Mengambil profil toko\u2026',
  'Menyiapkan katalog produk\u2026',
  'Memeriksa stok terbaru\u2026',
  'Memuat riwayat transaksi\u2026',
]

export function InitialSyncScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<SyncPhase>('syncing')
  const [fadeOut, setFadeOut] = useState(false)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (phase !== 'syncing') return
    const timer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % SYNC_PHRASES.length)
    }, 1500)
    return () => clearInterval(timer)
  }, [phase])

  const handleSkip = useCallback(() => {
    localStorage.setItem('vitpos-initial-sync-done', 'true')
    setFadeOut(true)
    setTimeout(() => onDone(), FADE_OUT_MS)
  }, [onDone])

  const triggerSync = useCallback(async () => {
    setPhase('syncing')
    try {
      const result = await Promise.race([
        runSync(),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 8_000)),
      ])
      if (!mountedRef.current) return

      if (result === 'timeout') {
        handleSkip()
        return
      }

      localStorage.setItem('vitpos-initial-sync-done', 'true')
      setPhase('done')
      setTimeout(() => {
        if (mountedRef.current) {
          setFadeOut(true)
          setTimeout(() => { if (mountedRef.current) onDone() }, FADE_OUT_MS)
        }
      }, DONE_DELAY_MS)
    } catch {
      if (mountedRef.current) setPhase('error')
    }
  }, [onDone, handleSkip])

  useEffect(() => {
    let active = true
    if (active) {
       // Start sync on next tick to prevent synchronous setState inside effect
       setTimeout(() => {
         if (mountedRef.current) void triggerSync()
       }, 0)
    }
    return () => { active = false; mountedRef.current = false }
  }, [triggerSync])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-[400ms]',
        fadeOut ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex size-14 items-center justify-center">
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-all duration-300',
              phase === 'done' ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
            )}
          >
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-all duration-300',
              phase === 'done' ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
            )}
          >
            <CheckCircle2 className="size-7 text-emerald-600" />
          </div>
          {phase === 'error' && (
            <AlertCircle className="size-7 text-destructive" />
          )}
        </div>

        <p
          className={cn(
            'text-sm font-medium transition-all duration-300',
            phase === 'syncing' && 'text-foreground',
            phase === 'done' && 'text-emerald-600',
            phase === 'error' && 'text-destructive',
          )}
        >
          {phase === 'syncing' && SYNC_PHRASES[phraseIndex]}
          {phase === 'done' && 'Sinkron selesai'}
          {phase === 'error' && 'Gagal terhubung'}
        </p>

        {phase === 'error' && (
          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={triggerSync}>Coba Lagi</Button>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Jalankan di Latar
            </Button>
          </div>
        )}

        {phase === 'syncing' && (
          <button
            type="button"
            onClick={handleSkip}
            className="pt-2 text-xs text-muted-foreground/70 underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Jalankan di Latar
          </button>
        )}
      </div>
    </div>
  )
}
