import { WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4" />
        <span>Offline mode aktif. Data tetap disimpan lokal.</span>
      </div>
      <Button variant="outline" className="border-orange-200 bg-background">
        Lihat Sync
      </Button>
    </div>
  )
}
