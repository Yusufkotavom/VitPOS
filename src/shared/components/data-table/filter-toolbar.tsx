import { Search } from 'lucide-react'
import { type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function FilterToolbar({
  placeholder = 'Cari data...',
  action,
}: {
  placeholder?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="relative md:w-96">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={placeholder} className="pl-10" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Export</Button>
        {action}
      </div>
    </div>
  )
}
