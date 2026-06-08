import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ServiceOrderForm } from '@/features/service-orders/components/service-order-form'
import { mapServiceOrderFormToRecord, mapServiceOrderRecordToFormValues, type ServiceOrderFormValues } from '@/features/service-orders/schemas/service-order-form-schema'
import { serviceOrderRepository } from '@/services/local-db/repository'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export function ServiceOrderCrudActions({ order }: { order?: LocalServiceOrder }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(order)

  async function handleSubmit(values: ServiceOrderFormValues) {
    const id = order?.id ?? crypto.randomUUID()
    await serviceOrderRepository.upsert(mapServiceOrderFormToRecord(values, id, order))
    toast.success(isEdit ? 'Service order diperbarui' : 'Service order dibuat')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!order) return
    await serviceOrderRepository.remove(order.id)
    toast.success('Service order dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {order ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Buat Service Order</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah service order' : 'Buat service order'}</SheetTitle>
            <SheetDescription>Service order tersimpan lokal dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <ServiceOrderForm defaultValues={order ? mapServiceOrderRecordToFormValues(order) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Buat service order'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      {order ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus service order</DialogTitle>
                <DialogDescription>Service order {order.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus service order</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
