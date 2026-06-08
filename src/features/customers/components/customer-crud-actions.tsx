import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createCustomerId } from '@/features/catalog/lib/entity-id'
import { CustomerForm } from '@/features/customers/components/customer-form'
import { mapCustomerFormToRecord, mapCustomerRecordToFormValues, type CustomerFormValues } from '@/features/customers/schemas/customer-form-schema'
import { customerRepository } from '@/services/local-db/repository'
import type { LocalCustomer } from '@/services/local-db/schema'

export function CustomerCrudActions({ customer }: { customer?: LocalCustomer }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(customer)

  async function handleSubmit(values: CustomerFormValues) {
    const id = customer?.id ?? createCustomerId()
    await customerRepository.upsert(mapCustomerFormToRecord(values, id))
    toast.success(isEdit ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!customer) return
    await customerRepository.remove(customer.id)
    toast.success('Pelanggan dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {customer ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Pelanggan</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah pelanggan' : 'Tambah pelanggan'}</SheetTitle>
            <SheetDescription>Simpan lokal lebih dulu. Outbox sinkron jalan otomatis.</SheetDescription>
          </SheetHeader>
          <CustomerForm defaultValues={customer ? mapCustomerRecordToFormValues(customer) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan pelanggan'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
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
