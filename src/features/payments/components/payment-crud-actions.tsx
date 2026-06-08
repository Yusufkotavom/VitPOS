import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PaymentForm } from '@/features/payments/components/payment-form'
import { mapPaymentFormToRecord, mapPaymentRecordToFormValues, type PaymentFormValues } from '@/features/payments/schemas/payment-form-schema'
import { paymentRepository } from '@/services/local-db/repository'
import type { LocalPayment } from '@/services/local-db/schema'

export function PaymentCrudActions({ payment }: { payment?: LocalPayment }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(payment)

  async function handleSubmit(values: PaymentFormValues) {
    const id = payment?.id ?? crypto.randomUUID()
    await paymentRepository.upsert(mapPaymentFormToRecord(values, id, payment))
    toast.success(isEdit ? 'Pembayaran diperbarui' : 'Pembayaran dicatat')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!payment) return
    await paymentRepository.remove(payment.id)
    toast.success('Pembayaran dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {payment
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button>
            : <Button><PlusIcon data-icon="inline-start" />Record Payment</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah pembayaran' : 'Catat pembayaran'}</SheetTitle>
            <SheetDescription>Pembayaran tersimpan lokal dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <PaymentForm
            defaultValues={payment ? mapPaymentRecordToFormValues(payment) : undefined}
            submitLabel={isEdit ? 'Simpan perubahan' : 'Catat pembayaran'}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
      {payment ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus pembayaran</DialogTitle>
                <DialogDescription>Pembayaran {payment.ref} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus pembayaran</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
