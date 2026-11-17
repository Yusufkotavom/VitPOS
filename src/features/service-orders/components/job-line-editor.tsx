import { Boxes, PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { formatCurrency } from '@/lib/format-currency'
import { cn } from '@/lib/utils'
import type { LocalJobLine } from '@/services/local-db/schema'

function LineBadge({ line }: { line: LocalJobLine }) {
  const { t } = useTranslation()

  if (line.source === 'custom') {
    return (
      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
        {t('service_orders.line_custom')}
      </span>
    )
  }

  if (line.kind === 'service') {
    return (
      <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
        {t('service_orders.line_service')}
      </span>
    )
  }

  return (
    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
      {t('service_orders.line_product')}
    </span>
  )
}

export function JobLineEditor({
  line,
  onChange,
  onRemove,
  onSaveAsCatalog,
  className,
}: {
  line: LocalJobLine
  onChange: (changes: Partial<LocalJobLine>) => void
  onRemove: () => void
  onSaveAsCatalog?: () => void
  className?: string
}) {
  const { t } = useTranslation()
  const isArea = line.priceMode === 'area'

  return (
    <div className={cn('rounded-xl border bg-background p-3', className)}>
      <div className="flex items-start gap-2">
        {line.source === 'catalog'
          ? <Boxes className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          : <PenLine className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            value={line.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={t('service_orders.line_name_placeholder')}
            aria-label={t('service_orders.line_name')}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <LineBadge line={line} />
            <span>
              {line.trackStock
                ? t('service_orders.line_stock_effect')
                : t('service_orders.line_no_stock_effect')}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">{t('common.qty')}</span>
              <div className="flex h-9 items-center rounded-lg border">
                <button
                  type="button"
                  className="h-9 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={t('pos.decrease_qty', { name: line.name })}
                  onClick={() => onChange({ qty: Math.max(1, line.qty - 1) })}
                >
                  −
                </button>
                <input
                  value={line.qty}
                  inputMode="numeric"
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/\D/g, ''))
                    onChange({ qty: Number.isFinite(next) && next > 0 ? next : 1 })
                  }}
                  aria-label={t('common.qty')}
                  className="h-9 w-12 border-x bg-transparent text-center text-sm outline-none"
                />
                <button
                  type="button"
                  className="h-9 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={t('pos.increase_qty', { name: line.name })}
                  onClick={() => onChange({ qty: line.qty + 1 })}
                >
                  +
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">{t('service_orders.unit')}</span>
              <input
                value={line.unit}
                onChange={(event) => onChange({ unit: event.target.value })}
                aria-label={t('service_orders.unit')}
                className="h-9 w-20 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
              />
            </label>

            {isArea && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">{t('service_orders.width')}</span>
                  <input
                    value={line.width ?? ''}
                    inputMode="decimal"
                    onChange={(event) => onChange({ width: Number(event.target.value.replace(',', '.')) || 0 })}
                    aria-label={t('service_orders.width')}
                    className="h-9 w-16 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">{t('service_orders.height')}</span>
                  <input
                    value={line.height ?? ''}
                    inputMode="decimal"
                    onChange={(event) => onChange({ height: Number(event.target.value.replace(',', '.')) || 0 })}
                    aria-label={t('service_orders.height')}
                    className="h-9 w-16 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                  />
                </label>
              </>
            )}

            <label className="flex min-w-[132px] flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">
                {isArea ? t('service_orders.price_per_area') : t('service_orders.unit_price')}
              </span>
              <CurrencyInput
                prefix="Rp"
                value={line.unitPrice}
                onValueChange={(value) => onChange({ unitPrice: value })}
                className="h-9 text-sm"
              />
            </label>

            <div className="ml-auto flex flex-col items-end gap-1">
              <span className="text-[11px] text-muted-foreground">{t('common.subtotal')}</span>
              <span className="text-sm font-semibold">{formatCurrency(line.subtotal)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={line.priceMode}
              onChange={(event) => onChange({ priceMode: event.target.value as LocalJobLine['priceMode'] })}
              aria-label={t('service_orders.price_mode')}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
            >
              <option value="unit">{t('service_orders.price_mode_unit')}</option>
              <option value="area">{t('service_orders.price_mode_area')}</option>
            </select>
            <input
              value={line.note ?? ''}
              onChange={(event) => onChange({ note: event.target.value })}
              placeholder={t('service_orders.line_note_placeholder')}
              aria-label={t('service_orders.line_note')}
              className="h-8 min-w-[160px] flex-1 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
            />
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
              {t('common.delete')}
            </Button>
            {onSaveAsCatalog && line.name.trim() && (
              <Button type="button" variant="ghost" size="sm" onClick={onSaveAsCatalog}>
                {t('service_orders.save_as_service')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
