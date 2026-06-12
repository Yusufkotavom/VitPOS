import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CategoryForm } from '@/features/products/components/category-form'
import { mapCategoryFormToRecord, mapCategoryRecordToFormValues, type CategoryFormValues } from '@/features/products/schemas/category-form-schema'
import { productCategoryRepository } from '@/services/local-db/repository'
import type { LocalProductCategory } from '@/services/local-db/schema'

export function CategoryCrudActions({ category }: { category?: LocalProductCategory }) {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(category)

  async function handleSubmit(values: CategoryFormValues) {
    try {
      const categoryId = category?.id ?? `product_category-${crypto.randomUUID()}`
      await productCategoryRepository.upsert(mapCategoryFormToRecord(values, categoryId, category))
      toast.success(isEdit ? t('categories.updated') : t('categories.added'))
      setFormOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!category) return
    try {
      await productCategoryRepository.remove(category.id)
      toast.success(t('categories.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {category ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />{t('common.edit')}</Button> : <Button><PlusIcon data-icon="inline-start" />{t('categories.add')}</Button>}
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('categories.edit_title') : t('categories.add_title')}</DialogTitle>
          </DialogHeader>
          <CategoryForm defaultValues={category ? mapCategoryRecordToFormValues(category) : undefined} submitLabel={isEdit ? t('common.save_changes') : t('categories.save')} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
      {category ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />{t('common.delete')}</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('categories.delete_title')}</DialogTitle>
                <DialogDescription>{t('categories.delete_warning', { name: category.name })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
                <Button variant="destructive" onClick={handleDelete}>{t('categories.delete_confirm')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
