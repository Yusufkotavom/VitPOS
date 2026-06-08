import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createProductId } from '@/features/catalog/lib/entity-id'
import { ProductForm } from '@/features/products/components/product-form'
import { mapProductFormToRecord, mapProductRecordToFormValues, type ProductFormValues } from '@/features/products/schemas/product-form-schema'
import { productRepository } from '@/services/local-db/repository'
import type { LocalProduct } from '@/services/local-db/schema'

export function ProductCrudActions({ product }: { product?: LocalProduct }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(product)

  async function handleSubmit(values: ProductFormValues) {
    const id = product?.id ?? createProductId()
    await productRepository.upsert(mapProductFormToRecord(values, id))
    toast.success(isEdit ? 'Produk diperbarui' : 'Produk ditambahkan')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!product) return
    await productRepository.remove(product.id)
    toast.success('Produk dihapus')
    setDeleteOpen(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetTrigger asChild>
          {product ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Produk</Button>}
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Ubah produk' : 'Tambah produk'}</SheetTitle>
            <SheetDescription>Simpan data lokal dulu. Outbox sinkron terisi otomatis.</SheetDescription>
          </SheetHeader>
          <ProductForm defaultValues={product ? mapProductRecordToFormValues(product) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan produk'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </SheetContent>
      </Sheet>
      {product ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus produk</DialogTitle>
                <DialogDescription>Produk {product.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus produk</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
