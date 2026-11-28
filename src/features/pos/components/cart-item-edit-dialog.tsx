import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format-currency'
import { type PosCartItem } from '@/features/pos/types/pos.types'

export function CartItemEditDialog({
  item,
  open,
  onOpenChange,
  onSave,
}: {
  item: PosCartItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<PosCartItem>) => void
}) {
  const [price, setPrice] = useState(item?.price ?? 0)
  const [note, setNote] = useState(item?.note ?? '')

  const { t } = useTranslation()
  if (!item) return null

  function handleSave() {
    onSave({ price, note: note.trim() || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('pos.edit_item_title', { name: item.name })}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">{t('pos.unit_price')}</label>
            <CurrencyInput
              id="price"
              prefix="Rp"
              value={price}
              onValueChange={setPrice}
              className="h-11 text-base font-semibold"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {t('pos.subtotal')}: {formatCurrency(price * item.qty)}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">{t('pos.note_optional', { defaultValue: 'Catatan (opsional)' })}</label>
            <Textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('pos.note_item_placeholder', { defaultValue: 'Mis. custom, warna, ukuran, permintaan khusus…' })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('pos.cancel')}</Button>
          <Button onClick={handleSave}>{t('pos.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
