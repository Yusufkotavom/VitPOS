import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ReturnForm } from '@/features/returns/components/return-form'
import { mapReturnFormToRecord, mapReturnRecordToFormValues, type ReturnFormValues } from '@/features/returns/schemas/return-form-schema'
import { returnRepository } from '@/services/local-db/repository'
import type { LocalReturn } from '@/services/local-db/schema'

export function ReturnCrudActions({ ret }: { ret?: LocalReturn }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(ret)

  async function handleSubmit(values: ReturnFormValues) {
    const id = ret?.id ?? crypto.randomUUID()
    await returnRepository.upsert(mapReturnFormToRecord(values, id, ret))
    toast.success(isEdit ? 'Retur diperbarui' : 'Retur dibuat')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!ret) return
    await returnRepository.remove(ret.id)
    toast.success('Retur dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {ret ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Buat Retur</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah retur' : 'Buat retur baru'}</SheetTitle>
            <SheetDescription>Retur tersimpan lokal dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <ReturnForm defaultValues={ret ? mapReturnRecordToFormValues(ret) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Buat retur'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      {ret ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus retur</DialogTitle>
                <DialogDescription>Retur {ret.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus retur</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
