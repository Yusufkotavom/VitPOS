import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createEntityId } from '@/features/catalog/lib/entity-id'
import { PaymentMethodForm } from '@/features/settings/components/payment-method-form'
import { mapPaymentMethodFormToRecord, mapPaymentMethodRecordToFormValues, type PaymentMethodFormValues } from '@/features/settings/schemas/payment-method-schema'
import { paymentMethodRepository } from '@/services/local-db/repository'
import type { LocalPaymentMethod } from '@/services/local-db/schema'

export function PaymentMethodCrudActions({ paymentMethod }: { paymentMethod?: LocalPaymentMethod }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(paymentMethod)

  async function handleSubmit(values: PaymentMethodFormValues) {
    try {
      const id = paymentMethod?.id ?? createEntityId('pm')
      await paymentMethodRepository.upsert(mapPaymentMethodFormToRecord(values, id))
      toast.success(isEdit ? 'Metode pembayaran diperbarui' : 'Metode pembayaran ditambahkan')
      setFormOpen(false)
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!paymentMethod) return
    try {
      await paymentMethodRepository.remove(paymentMethod.id)
      toast.success('Metode pembayaran dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {paymentMethod ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Metode</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah Metode Pembayaran' : 'Tambah Metode Pembayaran'}</SheetTitle>
            <SheetDescription>Konfigurasi channel pembayaran untuk transaksi.</SheetDescription>
          </SheetHeader>
          <PaymentMethodForm defaultValues={paymentMethod ? mapPaymentMethodRecordToFormValues(paymentMethod) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan metode pembayaran'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      {paymentMethod ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus metode pembayaran</DialogTitle>
                <DialogDescription>Metode {paymentMethod.name} akan dihapus dari data lokal.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus metode</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
