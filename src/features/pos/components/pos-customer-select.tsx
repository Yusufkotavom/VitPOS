import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { usePosStore } from '@/features/pos/stores/pos-store'
import { useCustomers } from '@/features/customers/hooks/use-customers'
import { customerFormSchema, customerInitialValues, customerStatusOptions, type CustomerFormValues } from '@/features/customers/schemas/customer-form-schema'
import { mapCustomerFormToRecord } from '@/features/customers/schemas/customer-form-schema'
import { createCustomerId } from '@/features/catalog/lib/entity-id'
import { customerRepository } from '@/services/local-db/repository'

export function PosCustomerSelect() {
  const { t } = useTranslation()
  const customerName = usePosStore(state => state.customerName)
  const setCustomer = usePosStore(state => state.setCustomer)
  const localCustomers = useCustomers()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const activeCustomers = localCustomers.filter(c => c.status === 'Aktif')

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { ...customerInitialValues, receivable: '0', orders: '0' },
  })

  function handleInputChange(name: string) {
    const match = activeCustomers.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (match) {
      setCustomer(match.id, match.name)
    } else if (name === '') {
      setCustomer(null, null)
    } else {
      setCustomer(`custom-${Date.now()}`, name)
    }
  }

  async function handleAddSave(values: CustomerFormValues) {
    try {
      const id = createCustomerId()
      await customerRepository.upsert(mapCustomerFormToRecord(values, id))
      setCustomer(id, values.name.trim())
      toast.success(t('customers.added'))
      setIsAddOpen(false)
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error_generic'))
    }
  }

  const errors = form.formState.errors

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1">
        <Combobox items={activeCustomers} value={customerName || ''} onValueChange={handleInputChange}>
          <ComboboxInput id="pos-customer-select" placeholder="Cari / Pilih Pelanggan" />
          <ComboboxContent>
            {activeCustomers.length === 0 ? (
              <ComboboxEmpty>{t('customers.none')}</ComboboxEmpty>
            ) : (
              <ComboboxList>
                {(item: unknown) => {
                  const customer = item as (typeof activeCustomers)[number]

                  return (
                    <ComboboxItem key={customer.id} value={customer.name} className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.phone}</span>
                    </ComboboxItem>
                  )
                }}
              </ComboboxList>
            )}
          </ComboboxContent>
        </Combobox>
      </div>

      <Button variant="outline" className="h-9 w-9 shrink-0" onClick={() => setIsAddOpen(true)}>
        <Plus className="size-4" />
      </Button>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleAddSave)}>
            <DialogHeader>
              <DialogTitle>{t('customers.add_new')}</DialogTitle>
              <DialogDescription>{t('common.save_local_first')}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <Label htmlFor="name">{t('common.name')}</Label>
                <Input id="name" {...form.register('name')} aria-invalid={!!errors.name} autoFocus />
              </Field>
              <Field data-invalid={!!errors.phone}>
                <Label htmlFor="phone">WhatsApp</Label>
                <Input id="phone" {...form.register('phone')} aria-invalid={!!errors.phone} />
              </Field>
              <Field data-invalid={!!errors.city}>
                <Label htmlFor="city">{t('common.address')}</Label>
                <Textarea id="city" {...form.register('city')} aria-invalid={!!errors.city} className="min-h-[3.5rem]" />
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
              <Button type="submit" disabled={form.formState.isSubmitting}>{t('common.add')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
