import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CategoryForm } from '@/features/products/components/category-form'
import { mapCategoryFormToRecord, mapCategoryRecordToFormValues, type CategoryFormValues } from '@/features/products/schemas/category-form-schema'
import { productCategoryRepository } from '@/services/local-db/repository'
import type { LocalProductCategory } from '@/services/local-db/schema'

export function CategoryCrudActions({ category }: { category?: LocalProductCategory }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(category)

  async function handleSubmit(values: CategoryFormValues) {
    try {
      const categoryId = category?.id ?? `product_category-${crypto.randomUUID()}`
      await productCategoryRepository.upsert(mapCategoryFormToRecord(values, categoryId, category))
      toast.success(isEdit ? 'Kategori diperbarui' : 'Kategori ditambahkan')
      setFormOpen(false)
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!category) return
    try {
      await productCategoryRepository.remove(category.id)
      toast.success('Kategori dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {category ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Kategori</Button>}
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah kategori' : 'Tambah kategori'}</DialogTitle>
          </DialogHeader>
          <CategoryForm defaultValues={category ? mapCategoryRecordToFormValues(category) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan kategori'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
      {category ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus kategori</DialogTitle>
                <DialogDescription>Kategori {category.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus kategori</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
