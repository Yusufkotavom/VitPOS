import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { usePosStore } from '@/features/pos/stores/pos-store'

export function ProductSearch() {
  const searchQuery = usePosStore((state) => state.searchQuery)
  const setSearchQuery = usePosStore((state) => state.setSearchQuery)

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Cari produk / scan barcode"
        className="h-12 pl-10"
      />
    </div>
  )
}
