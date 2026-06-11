import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SettingForm } from '@/features/settings/components/setting-form'
import { mapSettingFormToRecord, mapSettingRecordToFormValues, type SettingFormValues } from '@/features/settings/schemas/setting-form-schema'
import { settingRepository } from '@/services/local-db/repository'
import type { LocalSetting } from '@/services/local-db/schema'

export function SettingCrudActions({ setting }: { setting?: LocalSetting }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(setting)

  async function handleSubmit(values: SettingFormValues) {
    try {
      const id = setting?.id ?? crypto.randomUUID()
      await settingRepository.upsert(mapSettingFormToRecord(values, id))
      toast.success(isEdit ? 'Pengaturan diperbarui' : 'Pengaturan ditambahkan')
      setFormOpen(false)
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!setting) return
    try {
      await settingRepository.remove(setting.id)
      toast.success('Pengaturan dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {setting
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button>
            : <Button><PlusIcon data-icon="inline-start" />Tambah Pengaturan</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah pengaturan' : 'Tambah pengaturan'}</SheetTitle>
            <SheetDescription>Pengaturan lokal tersimpan dulu, lalu masuk antrean sinkron.</SheetDescription>
          </SheetHeader>
          <SettingForm
            defaultValues={setting ? mapSettingRecordToFormValues(setting) : undefined}
            submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan pengaturan'}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSubmit}
          />
        </SheetContent>
      </Sheet>
      {setting ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus pengaturan</DialogTitle>
                <DialogDescription>Pengaturan {setting.setting} akan dihapus dari data lokal.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus pengaturan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
