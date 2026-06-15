import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { cashCategoryFormSchema, cashCategoryInitialValues, cashCategoryTypeOptions, type CashCategoryFormValues } from '@/features/cash/schemas/cash-category-schema'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { cashCategoryRepository } from '@/services/local-db/repository'
import { canDeleteCashCategory } from '@/shared/lib/delete-guard'
import type { LocalCashCategory } from '@/services/local-db/schema'

export function CashCategoryCrudActions({ category }: { category?: LocalCashCategory }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [hasReferences, setHasReferences] = useState(false)
  const [referenceReason, setReferenceReason] = useState<string>()
  const isEdit = Boolean(category)

  useEffect(() => {
    if (!category) {
      setHasReferences(false)
      setReferenceReason(undefined)
      return
    }
    const tenantId = resolveTenantId(category.tenantId)
    canDeleteCashCategory(category.name, tenantId).then((result) => {
      setHasReferences(!result.allowed)
      setReferenceReason(result.reason)
    })
  }, [category])

  const form = useForm<CashCategoryFormValues>({
    resolver: zodResolver(cashCategoryFormSchema),
    defaultValues: category
      ? { name: category.name, type: category.type, status: category.status }
      : cashCategoryInitialValues,
  })

  useEffect(() => {
    form.reset(category
      ? { name: category.name, type: category.type, status: category.status }
      : cashCategoryInitialValues)
  }, [category, form])

  async function handleSubmit(values: CashCategoryFormValues) {
    try {
      const id = category?.id ?? crypto.randomUUID()
      const now = new Date().toISOString()
      await cashCategoryRepository.upsert({
        id,
        tenantId: resolveTenantId(category?.tenantId),
        name: values.name.trim(),
        type: values.type,
        status: values.status,
        syncStatus: 'pending',
        version: (category?.version ?? 0) + 1,
        updatedAt: now,
      })
      toast.success(isEdit ? t('cash.category_updated') : t('cash.category_added'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!category) return
    // Safety net: cek sekali lagi sebelum hapus
    const tenantId = resolveTenantId(category.tenantId)
    const guard = await canDeleteCashCategory(category.name, tenantId)
    if (!guard.allowed) {
      toast.error(guard.reason)
      setDeleteOpen(false)
      return
    }
    try {
      await cashCategoryRepository.remove(category.id)
      toast.success(t('cash.category_deleted'))
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
          {category
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button>
            : <Button size="sm"><PlusIcon data-icon="inline-start" />{t('common.add')}</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? t('cash.edit_category') : t('cash.add_category')}</DialogTitle>
              <DialogDescription>{t('cash.category_description')}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <Label htmlFor="name">{t('cash.category_name')}</Label>
                <Input id="name" {...form.register('name')} aria-invalid={!!errors.name} placeholder="Penjualan" />
              </Field>
              <Field>
                <Label htmlFor="type">{t('common.type')}</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('common.select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cashCategoryTypeOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="category-status">{t('common.status')}</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                      <SelectTrigger id="category-status">
                        <SelectValue placeholder={t('common.select_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Aktif">{t('common.active')}</SelectItem>
                          <SelectItem value="Nonaktif">{t('common.inactive')}</SelectItem>
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
      {category ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="destructive" size="sm" disabled={hasReferences} onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
              </span>
            </TooltipTrigger>
            {hasReferences && referenceReason ? (
              <TooltipContent side="bottom" className="text-xs max-w-48">{referenceReason}</TooltipContent>
            ) : null}
          </Tooltip>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('cash.delete_category_title')}</DialogTitle>
                <DialogDescription>Kategori {category.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('cash.delete_category_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
