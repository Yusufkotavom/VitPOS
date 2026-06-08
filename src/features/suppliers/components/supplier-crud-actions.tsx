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
import { supplierFormSchema, supplierInitialValues, supplierStatusOptions, type SupplierFormValues } from '@/features/suppliers/schemas/supplier-form-schema'
import { mapSupplierFormToRecord, mapSupplierRecordToFormValues } from '@/features/suppliers/schemas/supplier-form-schema'
import { supplierRepository } from '@/services/local-db/repository'
import type { LocalSupplier } from '@/services/local-db/schema'

export function SupplierCrudActions({ supplier }: { supplier?: LocalSupplier }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(supplier)

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplier ? mapSupplierRecordToFormValues(supplier) : supplierInitialValues,
  })

  useEffect(() => {
    form.reset(supplier ? mapSupplierRecordToFormValues(supplier) : supplierInitialValues)
  }, [supplier, form])

  async function handleSubmit(values: SupplierFormValues) {
    const id = supplier?.id ?? crypto.randomUUID()
    await supplierRepository.upsert(mapSupplierFormToRecord(values, id, supplier))
    toast.success(isEdit ? 'Supplier diperbarui' : 'Supplier ditambahkan')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!supplier) return
    await supplierRepository.remove(supplier.id)
    toast.success('Supplier dihapus')
    setDeleteOpen(false)
  }

  const errors = form.formState.errors

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {supplier ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Supplier</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Ubah supplier' : 'Tambah supplier'}</DialogTitle>
              <DialogDescription>Simpan lokal lebih dulu. Outbox sinkron jalan otomatis.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <Label htmlFor="name">Nama</Label>
                <Input id="name" {...form.register('name')} aria-invalid={!!errors.name} />
              </Field>
              <Field data-invalid={!!errors.phone}>
                <Label htmlFor="phone">Telepon</Label>
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
                          {supplierStatusOptions.map(opt => (
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
      {supplier ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus supplier</DialogTitle>
                <DialogDescription>Supplier {supplier.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus supplier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
