import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ReturnForm } from '@/features/returns/components/return-form'
import { mapReturnFormToRecord, mapReturnRecordToFormValues, type ReturnFormValues } from '@/features/returns/schemas/return-form-schema'
import { returnRepository } from '@/services/local-db/repository'
import { recordReturnJournal } from '@/services/accounting/accounting-integration'
import type { LocalReturn } from '@/services/local-db/schema'

export function ReturnCrudActions({ ret }: { ret?: LocalReturn }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(ret)

  async function handleSubmit(values: ReturnFormValues) {
    try {
      const id = ret?.id ?? crypto.randomUUID()

      let finalCode = values.code.trim()
      if (!finalCode) {
        const allReturns = await returnRepository.list()
        const existingCodes = allReturns.map(r => r.code).filter(c => c.startsWith('RET-'))
        const maxNum = existingCodes.reduce((max, c) => {
          const num = parseInt(c.replace('RET-', ''), 10)
          return !isNaN(num) && num > max ? num : max
        }, 0)
        finalCode = `RET-${String(maxNum + 1).padStart(3, '0')}`
      }

      const finalValues = { ...values, code: finalCode }
      const returnRecord = mapReturnFormToRecord(finalValues, id, ret)
      await returnRepository.upsert(returnRecord)

      // Accounting journal entry (non-blocking)
      if (returnRecord.type === 'Penjualan') {
        try {
          const totalCost = returnRecord.items.reduce(
            (sum, item) => sum + (item.unitPrice * item.qty),
            0,
          )
          await recordReturnJournal(
            returnRecord.tenantId,
            returnRecord.id,
            returnRecord.total,
            totalCost,
            'tunai', // default payment method for returns
            returnRecord.date,
          )
        } catch (err) {
          console.warn('[Returns] recordReturnJournal failed (non-critical):', err)
        }
      }

      toast.success(isEdit ? t('returns.updated') : t('returns.created'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!ret) return
    try {
      await returnRepository.remove(ret.id)
      toast.success(t('returns.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {ret ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button> : <Button><PlusIcon data-icon="inline-start" />{t('returns.create')}</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('returns.edit_title') : t('returns.create_title')}</DialogTitle>
            <DialogDescription>{t('returns.save_local_description')}</DialogDescription>
          </DialogHeader>
          <ReturnForm defaultValues={ret ? mapReturnRecordToFormValues(ret) : undefined} submitLabel={isEdit ? t('common.save_changes') : t('returns.create')} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
      {ret ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('returns.delete_title')}</DialogTitle>
                <DialogDescription>{t('returns.delete_description', { code: ret.code })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('returns.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
