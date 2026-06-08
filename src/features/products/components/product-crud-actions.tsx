import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
    await productRepository.upsert(mapProductFormToRecord(values, id, product))
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
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {product ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button> : <Button><PlusIcon data-icon="inline-start" />Tambah Produk</Button>}
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah produk' : 'Tambah produk'}</DialogTitle>
            <DialogDescription>Simpan data lokal dulu. Outbox sinkron terisi otomatis.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ProductForm defaultValues={product ? mapProductRecordToFormValues(product) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan produk'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
          </div>
        </DialogContent>
      </Dialog>
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
