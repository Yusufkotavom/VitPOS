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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createCustomerId } from '@/features/catalog/lib/entity-id'
import { customerFormSchema, customerInitialValues, customerStatusOptions, type CustomerFormValues } from '@/features/customers/schemas/customer-form-schema'
import { mapCustomerFormToRecord, mapCustomerRecordToFormValues } from '@/features/customers/schemas/customer-form-schema'
import { customerRepository } from '@/services/local-db/repository'
import type { LocalCustomer } from '@/services/local-db/schema'

export function CustomerCrudActions({ customer }: { customer?: LocalCustomer }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(customer)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ? mapCustomerRecordToFormValues(customer) : customerInitialValues,
  })

  useEffect(() => {
    form.reset(customer ? mapCustomerRecordToFormValues(customer) : customerInitialValues)
  }, [customer, form])

  async function handleSubmit(values: CustomerFormValues) {
    try {
      const id = customer?.id ?? createCustomerId()

      const existingCustomers = await customerRepository.list()
      const isDuplicatePhone = existingCustomers.some(
        (c) => c.phone === values.phone.trim() && c.id !== id
      )

      if (isDuplicatePhone) {
        form.setError('phone', { type: 'manual', message: t('customers.phone_duplicate') })
        return
      }

      await customerRepository.upsert(mapCustomerFormToRecord(values, id, customer))
      toast.success(isEdit ? t('customers.updated') : t('customers.added'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!customer) return
    try {
      await customerRepository.remove(customer.id)
      toast.success(t('customers.deleted'))
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
          {customer ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button> : <Button><PlusIcon data-icon="inline-start" />{t('customers.add')}</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? t('customers.edit_title') : t('customers.add_title')}</DialogTitle>
              <DialogDescription>{t('customers.save_local_description')}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <Label htmlFor="name">{t('common.name')}</Label>
                <Input id="name" {...form.register('name')} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </Field>
              <Field data-invalid={!!errors.phone}>
                <Label htmlFor="phone">{t('common.whatsapp')}</Label>
                <Input id="phone" {...form.register('phone')} aria-invalid={!!errors.phone} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </Field>
              <Field data-invalid={!!errors.city}>
                <Label htmlFor="city">{t('common.address')}</Label>
                <Textarea id="city" {...form.register('city')} aria-invalid={!!errors.city} className="min-h-[3.5rem]" />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
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
                          {customerStatusOptions.map(opt => (
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
      {customer ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('customers.delete_title')}</DialogTitle>
                <DialogDescription>{t('customers.delete_warning', { name: customer.name })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('customers.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
