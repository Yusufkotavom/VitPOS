import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PurchaseForm } from '@/features/purchases/components/purchase-form'
import { mapPurchaseFormToRecord, mapPurchaseRecordToFormValues, type PurchaseFormValues } from '@/features/purchases/schemas/purchase-form-schema'
import { purchaseRepository } from '@/services/local-db/repository'
import type { LocalPurchase } from '@/services/local-db/schema'

export function PurchaseCrudActions({ purchase }: { purchase?: LocalPurchase }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(purchase)

  async function handleSubmit(values: PurchaseFormValues) {
    const id = purchase?.id ?? crypto.randomUUID()
    await purchaseRepository.upsert(mapPurchaseFormToRecord(values, id, purchase))
    toast.success(isEdit ? 'PO diperbarui' : 'PO dibuat')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!purchase) return
    await purchaseRepository.remove(purchase.id)
    toast.success('PO dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {purchase ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Buat PO</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah purchase order' : 'Buat purchase order'}</SheetTitle>
            <SheetDescription>PO tersimpan lokal dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <PurchaseForm defaultValues={purchase ? mapPurchaseRecordToFormValues(purchase) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Buat PO'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      {purchase ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus purchase order</DialogTitle>
                <DialogDescription>PO {purchase.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus PO</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
