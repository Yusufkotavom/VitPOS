import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SupplierForm } from '@/features/suppliers/components/supplier-form'
import { mapSupplierFormToRecord, mapSupplierRecordToFormValues, type SupplierFormValues } from '@/features/suppliers/schemas/supplier-form-schema'
import { supplierRepository } from '@/services/local-db/repository'
import type { LocalSupplier } from '@/services/local-db/schema'

export function SupplierCrudActions({ supplier }: { supplier?: LocalSupplier }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(supplier)

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

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {supplier ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Supplier</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah supplier' : 'Tambah supplier'}</SheetTitle>
            <SheetDescription>Simpan lokal lebih dulu. Outbox sinkron jalan otomatis.</SheetDescription>
          </SheetHeader>
          <SupplierForm defaultValues={supplier ? mapSupplierRecordToFormValues(supplier) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan supplier'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
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
