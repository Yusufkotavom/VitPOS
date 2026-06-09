import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function updateParam(searchParams: URLSearchParams, key: 'from' | 'to', value: string) {
  const next = new URLSearchParams(searchParams)
  if (value) next.set(key, value)
  else next.delete(key)
  return next
}

export function ReportDateFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="space-y-1.5 text-sm font-medium">
        Dari Tanggal
        <Input
          type="date"
          value={from}
          onChange={(e) => setSearchParams(updateParam(searchParams, 'from', e.target.value))}
        />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        Sampai Tanggal
        <Input
          type="date"
          value={to}
          onChange={(e) => setSearchParams(updateParam(searchParams, 'to', e.target.value))}
        />
      </label>
      <Button variant="outline" onClick={() => setSearchParams(new URLSearchParams())} disabled={!from && !to}>
        Reset
      </Button>
    </div>
  )
}

export function useReportDateParams() {
  const [searchParams] = useSearchParams()
  return {
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  }
}
