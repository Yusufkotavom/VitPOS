import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
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
    const id = customer?.id ?? createCustomerId()
    await customerRepository.upsert(mapCustomerFormToRecord(values, id, customer))
    toast.success(isEdit ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!customer) return
    await customerRepository.remove(customer.id)
    toast.success('Pelanggan dihapus')
    setDeleteOpen(false)
  }

  const errors = form.formState.errors

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {customer ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Pelanggan</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Ubah pelanggan' : 'Tambah pelanggan'}</DialogTitle>
              <DialogDescription>Simpan lokal lebih dulu. Outbox sinkron jalan otomatis.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <Label htmlFor="name">Nama</Label>
                <Input id="name" {...form.register('name')} aria-invalid={!!errors.name} />
              </Field>
              <Field data-invalid={!!errors.phone}>
                <Label htmlFor="phone">WhatsApp</Label>
                <Input id="phone" {...form.register('phone')} aria-invalid={!!errors.phone} />
              </Field>
              <Field data-invalid={!!errors.city}>
                <Label htmlFor="city">Alamat</Label>
                <Textarea id="city" {...form.register('city')} aria-invalid={!!errors.city} className="min-h-[3.5rem]" />
              </Field>
              <Field>
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Pilih status" />
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
                <Button variant="outline" type="button">Batal</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {customer ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus pelanggan</DialogTitle>
                <DialogDescription>Pelanggan {customer.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus pelanggan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
