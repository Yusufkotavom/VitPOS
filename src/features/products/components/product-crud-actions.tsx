import { PencilIcon, PlusIcon, Trash2Icon, Settings2, BookOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { createProductId } from '@/features/catalog/lib/entity-id'
import { ProductForm } from '@/features/products/components/product-form'
import { mapProductFormToRecord, mapProductRecordToFormValues, type ProductFormValues } from '@/features/products/schemas/product-form-schema'
import { productRepository } from '@/services/local-db/repository'
import { localDb } from '@/services/local-db/client'
import type { LocalProduct } from '@/services/local-db/schema'

export function ProductCrudActions({ product }: { product?: LocalProduct }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<LocalProduct | undefined>()
  const isEdit = Boolean(product)

  const defaultValues = useMemo(() => {
    const source = editProduct ?? product
    return source ? mapProductRecordToFormValues(source) : undefined
  }, [editProduct, product])

  async function handleEditClick() {
    if (!product) return
    const fresh = await localDb.products.get(product.id)
    setEditProduct(fresh ?? product)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditProduct(undefined)
  }

  async function handleSubmit(values: ProductFormValues) {
    try {
      const id = product?.id ?? createProductId()
      const base = editProduct ?? product
      const newRecord = mapProductFormToRecord(values, id, base)
      const oldStock = base?.stock ?? 0
      const newStock = newRecord.stock

      await productRepository.upsert(newRecord)

      if (newStock !== oldStock && newRecord.manageStock) {
        const diff = newStock - oldStock
        const warehouseName = t('products.default_warehouse')
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
          notes: base ? 'Update dari halaman Produk' : 'Stok awal produk',
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

        const { localDb: db } = await import('@/services/local-db/client')
        const { stockMovementRepository } = await import('@/services/local-db/repository')

        await db.stockMovements.put(movement)
        await db.inventory.put(inventory)
        await stockMovementRepository.upsert(movement)
      }

      toast.success(isEdit ? t('products.updated') : t('products.added'))
      setFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error_generic'))
    }
  }

  async function handleDelete() {
    if (!product) return
    try {
      await productRepository.remove(product.id)
      toast.success(t('products.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error_generic'))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        {product ? (
          <Button variant="outline" size="sm" onClick={handleEditClick}><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button>
        ) : (
          <Button onClick={() => { setEditProduct(undefined); setFormOpen(true); }}><PlusIcon data-icon="inline-start" />{t('products.add')}</Button>
        )}
        {!product && (
          <>
            <Button variant="outline" asChild>
              <Link to="/products/categories">
                <Settings2 data-icon="inline-start" /> {t('categories.manage')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products/recipes">
                <BookOpen data-icon="inline-start" /> {t('nav.resep_bom')}
              </Link>
            </Button>
          </>
        )}
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('products.edit_title') : t('products.add_title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('products.add_description')}
            </DialogDescription>
          </DialogHeader>
          <ProductForm key={product?.id ?? 'new'} defaultValues={defaultValues} submitLabel={isEdit ? t('common.save_changes') : t('products.save')} onCancel={handleFormClose} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
      {product ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('products.delete_title')}</DialogTitle>
                <DialogDescription>{t('products.delete_confirm')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('common.cancel')}</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>{t('products.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
