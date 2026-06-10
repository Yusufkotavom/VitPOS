import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
    
    let finalCode = values.code.trim()
    if (!finalCode) {
      const allReturns = await returnRepository.list()
      const existingCodes = allReturns.map(r => r.code).filter(c => c.startsWith('RET-'))
      const maxNum = existingCodes.reduce((max, c) => {
        const num = parseInt(c.replace('RET-', ''), 10)
        return !isNaN(num) && num > max ? num : max
      }, 0)
      finalCode = `RET-${String(maxNum + 1).padStart(3, '0')}`
    }

    const finalValues = { ...values, code: finalCode }
    await returnRepository.upsert(mapReturnFormToRecord(finalValues, id, ret))
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
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {ret ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Buat Retur</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah retur' : 'Buat retur baru'}</DialogTitle>
            <DialogDescription>Retur tersimpan lokal dulu, lalu masuk antrean sinkron.</DialogDescription>
          </DialogHeader>
          <ReturnForm defaultValues={ret ? mapReturnRecordToFormValues(ret) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Buat retur'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
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
