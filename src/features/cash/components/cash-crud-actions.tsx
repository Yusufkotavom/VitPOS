import { PencilIcon, PlusIcon, Trash2Icon, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cashFormSchema, cashInitialValues, cashTypeOptions, cashStatusOptions, type CashFormValues } from '@/features/cash/schemas/cash-form-schema'
import { mapCashFormToRecord, mapCashRecordToFormValues } from '@/features/cash/schemas/cash-form-schema'
import { useCashCategories } from '@/features/cash/hooks/use-cash-categories'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { cashRepository } from '@/services/local-db/repository'
import { recordCashJournal } from '@/services/accounting/accounting-integration'
import type { LocalCash } from '@/services/local-db/schema'

export function CashCrudActions({ cash }: { cash?: LocalCash }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(cash)
  const categories = useCashCategories()
  const paymentMethods = usePaymentMethods()
  const activeCategories = categories.filter(c => c.status === 'Aktif')
  const activePaymentMethods = paymentMethods.filter(p => p.status === 'Aktif')

  const form = useForm<CashFormValues>({
    resolver: zodResolver(cashFormSchema),
    defaultValues: cash ? mapCashRecordToFormValues(cash) : cashInitialValues,
  })

  useEffect(() => {
    form.reset(cash ? mapCashRecordToFormValues(cash) : cashInitialValues)
  }, [cash, form])

  const type = useWatch({ control: form.control, name: 'type' })
  const filteredCategories = activeCategories.filter(c => c.type === type)

  async function handleSubmit(values: CashFormValues) {
    try {
      const id = cash?.id ?? crypto.randomUUID()

      let finalRef = values.ref.trim()
      if (!finalRef) {
        const allCash = await cashRepository.list()
        const existingRefs = allCash.map(c => c.ref).filter(r => r.startsWith('KAS-'))
        const maxNum = existingRefs.reduce((max, r) => {
          const num = parseInt(r.replace('KAS-', ''), 10)
          return !isNaN(num) && num > max ? num : max
        }, 0)
        finalRef = `KAS-${String(maxNum + 1).padStart(3, '0')}`
      }

      const finalValues = { ...values, ref: finalRef }
      const cashRecord = mapCashFormToRecord(finalValues, id)
      await cashRepository.upsert(cashRecord)

      // Accounting journal entry (non-blocking)
      try {
        await recordCashJournal(
          cashRecord.tenantId,
          id,
          Math.max(cashRecord.income, cashRecord.expense),
          values.category,
          values.type as 'Pemasukan' | 'Pengeluaran',
          values.date,
        )
      } catch (err) {
        console.warn('[Cash] recordCashJournal failed (non-critical):', err)
      }

      toast.success(isEdit ? t('cash.transaction_updated') : t('cash.transaction_added'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!cash) return
    try {
      await cashRepository.remove(cash.id)
      toast.success(t('cash.transaction_deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  const errors = form.formState.errors

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {cash
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button>
            : <Button><PlusIcon data-icon="inline-start" />{t('cash.add_transaction')}</Button>}
        </DialogTrigger>
        {!cash && (
          <Button variant="outline" asChild>
            <Link to="/cash/categories">
              <Settings2 data-icon="inline-start" /> {t('cash.manage_categories')}
            </Link>
          </Button>
        )}
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? t('cash.edit_transaction') : t('cash.add_transaction_title')}</DialogTitle>
              <DialogDescription>{t('cash.description')}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.ref}>
                <Label htmlFor="ref">No. Referensi</Label>
                <Input id="ref" {...form.register('ref')} aria-invalid={!!errors.ref} placeholder="Otomatis jika kosong" />
              </Field>
              <Field data-invalid={!!errors.date}>
                <Label htmlFor="date">{t('common.date')}</Label>
                <Input id="date" {...form.register('date')} aria-invalid={!!errors.date} placeholder={t('common.select_date')} />
              </Field>
              <Field data-invalid={!!errors.account}>
                <Label htmlFor="account">Akun Kas</Label>
                <Controller
                  name="account"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <SelectTrigger id="account">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {activePaymentMethods.length === 0 ? (
                            <SelectItem value="_none" disabled>{t('cash.no_payment_methods')}</SelectItem>
                          ) : (
                            activePaymentMethods.map(opt => (
                              <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                            ))
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="type">{t('common.type')}</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cashTypeOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field data-invalid={!!errors.category}>
                <Label htmlFor="category">{t('common.category')}</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Controller
                      name="category"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="category">
                            <SelectValue placeholder={t('common.select_placeholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {filteredCategories.length === 0 ? (
                                <SelectItem value="_none" disabled>{t('cash.no_categories')}</SelectItem>
                              ) : (
                                filteredCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                    <Link to="/cash/categories" title={t('cash.manage_categories')}>
                      <Settings2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Field>
              <Field data-invalid={!!errors.amount}>
                <Label htmlFor="amount">{type === 'Pemasukan' ? 'Nominal masuk' : 'Nominal keluar'}</Label>
                <Input id="amount" inputMode="numeric" {...form.register('amount')} aria-invalid={!!errors.amount} placeholder="0" />
              </Field>
              <Field>
                <Label htmlFor="status">{t('common.status')}</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder={t('common.select_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cashStatusOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? t('common.save') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {cash ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('cash.delete_transaction_title')}</DialogTitle>
                <DialogDescription>Transaksi {cash.ref} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('cash.delete_transaction_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
