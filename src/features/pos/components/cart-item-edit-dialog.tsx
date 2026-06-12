import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
    onSave({ price, note })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pos.edit_item_title', { name: item.name })}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">{t('pos.unit_price')}</label>
            <Input 
              id="price" 
              type="number" 
              value={price || ''} 
              onChange={(e) => setPrice(Number(e.target.value))} 
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">{t('pos.note_label')}</label>
            <Textarea 
              id="note" 
              rows={2} 
              placeholder={t('pos.note_placeholder')} 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
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
