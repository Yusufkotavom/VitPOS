import { PencilIcon, PlusIcon, Trash2Icon, Settings2, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
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
    const newRecord = mapProductFormToRecord(values, id, product)
    const oldStock = product?.stock ?? 0
    const newStock = newRecord.stock

    await productRepository.upsert(newRecord)

    // Log stock movement if stock changed (including initial stock > 0)
    if (newStock !== oldStock && newRecord.manageStock) {
      const diff = newStock - oldStock
      const warehouseName = 'Gudang Utama'
      const movementId = crypto.randomUUID()
      const nowIso = new Date().toISOString()
      
      const movement = {
        id: movementId,
        tenantId: newRecord.tenantId,
        productId: newRecord.id,
        productName: newRecord.name,
        warehouseName,
        type: 'adjustment' as const,
        qty: diff,
        notes: product ? 'Update dari halaman Produk' : 'Stok awal produk',
        syncStatus: 'pending' as const,
        updatedAt: nowIso,
      }
      
      let status = 'Aman'
      if (newStock <= 0) status = 'Habis'
      else if (newStock <= 5) status = 'Stok Rendah'

      const inventory = {
        id: `${newRecord.tenantId}_${newRecord.id}_${warehouseName}`,
        tenantId: newRecord.tenantId,
        product: newRecord.name,
        warehouse: warehouseName,
        stockSystem: newStock,
        stockSafe: 5,
        movement: `${diff >= 0 ? '+' : ''}${diff} (adjustment)`,
        status,
      }

      const { localDb } = await import('@/services/local-db/client')
      const { stockMovementRepository } = await import('@/services/local-db/repository')
      
      await localDb.stockMovements.put(movement)
      await localDb.inventory.put(inventory)
      await stockMovementRepository.upsert(movement)
    }

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
        {!product && (
          <>
            <Button variant="outline" asChild>
              <Link to="/products/categories">
                <Settings2 data-icon="inline-start" /> Kelola Kategori
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products/recipes">
                <BookOpen data-icon="inline-start" /> Resep / BOM
              </Link>
            </Button>
          </>
        )}
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah produk' : 'Tambah produk'}</DialogTitle>
          </DialogHeader>
          <ProductForm defaultValues={product ? mapProductRecordToFormValues(product) : undefined} submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan produk'} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
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
                <DialogClose asChild>
                  <Button variant="outline">Batal</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>Hapus produk</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
