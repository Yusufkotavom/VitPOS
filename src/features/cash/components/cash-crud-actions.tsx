import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CashForm } from '@/features/cash/components/cash-form'
import { mapCashFormToRecord, mapCashRecordToFormValues, type CashFormValues } from '@/features/cash/schemas/cash-form-schema'
import { cashRepository } from '@/services/local-db/repository'
import type { LocalCash } from '@/services/local-db/schema'

export function CashCrudActions({ cash }: { cash?: LocalCash }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(cash)

  async function handleSubmit(values: CashFormValues) {
    const id = cash?.id ?? crypto.randomUUID()
    await cashRepository.upsert(mapCashFormToRecord(values, id))
    toast.success(isEdit ? 'Transaksi diperbarui' : 'Transaksi ditambahkan')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!cash) return
    await cashRepository.remove(cash.id)
    toast.success('Transaksi dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {cash
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button>
            : <Button><PlusIcon data-icon="inline-start" />Tambah Transaksi</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah transaksi kas' : 'Tambah transaksi kas'}</SheetTitle>
            <SheetDescription>Catat pemasukan atau pengeluaran. Outbox sinkron otomatis.</SheetDescription>
          </SheetHeader>
          <CashForm
            defaultValues={cash ? mapCashRecordToFormValues(cash) : undefined}
            submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan transaksi'}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
      {cash ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus transaksi</DialogTitle>
                <DialogDescription>Transaksi {cash.ref} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus transaksi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
