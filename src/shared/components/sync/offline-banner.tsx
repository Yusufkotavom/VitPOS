import { WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useRefresh } from '@/shared/providers/refresh-provider'

export function OfflineBanner({ visible }: { visible: boolean }) {
  const { isRefreshing, refreshAll } = useRefresh()

  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4" />
        <span>Anda sedang offline. Perubahan disimpan lokal dan akan disinkronkan saat koneksi kembali.</span>
      </div>
      <Button size="sm" variant="outline" className="border-orange-200 bg-background" onClick={() => void refreshAll()} disabled={isRefreshing}>
        {isRefreshing ? 'Mencoba...' : 'Coba lagi'}
      </Button>
    </div>
  )
}
