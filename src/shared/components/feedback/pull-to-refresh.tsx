import { type ReactNode, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

const TRIGGER_DISTANCE = 72

export function PullToRefresh({ children, isRefreshing, onRefresh }: { children: ReactNode; isRefreshing: boolean; onRefresh: () => void | Promise<void> }) {
  const startY = useRef<number | null>(null)
  const [distance, setDistance] = useState(0)
  const canPull = () => typeof window !== 'undefined' && window.scrollY <= 0
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => { if (!canPull() || isRefreshing) return; startY.current = event.touches[0]?.clientY ?? null }
  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => { if (startY.current === null || isRefreshing) return; const currentY = event.touches[0]?.clientY ?? startY.current; setDistance(Math.min(Math.max(0, currentY - startY.current), 96)) }
  const handleTouchEnd = () => { const shouldRefresh = distance >= TRIGGER_DISTANCE; startY.current = null; setDistance(0); if (shouldRefresh && !isRefreshing) void onRefresh() }
  const label = isRefreshing ? 'Memuat ulang...' : distance >= TRIGGER_DISTANCE ? 'Lepas untuk refresh' : 'Tarik untuk refresh'
  return <div data-testid="pull-to-refresh" className="relative min-h-full" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}><div className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-medium shadow-sm transition-opacity md:hidden" style={{ opacity: isRefreshing || distance > 16 ? 1 : 0 }}><RotateCcw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />{label}</div>{children}</div>
}
