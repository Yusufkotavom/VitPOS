import { Boxes, ReceiptText, Wallet } from 'lucide-react'

import { formatCurrency } from '@/lib/format-currency'

export function PosSummaryStrip({
  itemCount,
  subtotal,
  total,
}: {
  itemCount: number
  subtotal: number
  total: number
}) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Boxes className="text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Item aktif</p>
            <p className="text-lg font-semibold">{itemCount}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ReceiptText className="text-sky-600" />
          <div>
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="text-lg font-semibold">{formatCurrency(subtotal)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Wallet className="text-emerald-600" />
          <div>
            <p className="text-xs text-muted-foreground">Total bayar</p>
            <p className="text-lg font-semibold">{formatCurrency(total)}</p>
          </div>
        </div>
      </article>
    </section>
  )
}
