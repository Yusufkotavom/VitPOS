import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SalesOrderForm } from '@/features/sales-orders/components/sales-order-form'
import { mapSalesOrderFormToRecord, mapSalesOrderRecordToFormValues, type SalesOrderFormValues } from '@/features/sales-orders/schemas/sales-order-form-schema'
import { salesOrderRepository } from '@/services/local-db/repository'
import type { LocalSalesOrder } from '@/services/local-db/schema'

export function SalesOrderCrudActions({ order }: { order?: LocalSalesOrder }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(order)

  async function handleSubmit(values: SalesOrderFormValues) {
    const id = order?.id ?? crypto.randomUUID()
    await salesOrderRepository.upsert(mapSalesOrderFormToRecord(values, id, order))
    toast.success(isEdit ? 'Invoice diperbarui' : 'Invoice dibuat')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!order) return
    await salesOrderRepository.remove(order.id)
    toast.success('Invoice dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {order
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button>
            : <Button><PlusIcon data-icon="inline-start" />Buat Invoice</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah invoice' : 'Buat invoice baru'}</SheetTitle>
            <SheetDescription>Invoice tersimpan lokal dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <SalesOrderForm
            defaultValues={order ? mapSalesOrderRecordToFormValues(order) : undefined}
            submitLabel={isEdit ? 'Simpan perubahan' : 'Buat invoice'}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
      {order ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus invoice</DialogTitle>
                <DialogDescription>Invoice {order.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus invoice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
