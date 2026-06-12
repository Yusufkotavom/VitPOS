import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createProductId } from '@/features/catalog/lib/entity-id'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import { useCategories } from '@/features/products/hooks/use-categories'
import { productRepository } from '@/services/local-db/repository'
import { FormSection } from '@/shared/components/forms/form-section'

export function ProductFormSheet() {
  const { t } = useTranslation()
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Umum')
  const [costPrice, setCostPrice] = useState('0')
  const [price, setPrice] = useState('0')
  const [stock, setStock] = useState('0')
  const categoryOptions = ['Umum', ...categories.filter((row) => row.status === 'Aktif').map((row) => row.name)]

  async function saveProduct() {
    if (!name.trim()) return
    try {
      await productRepository.upsert({
        id: createProductId(),
        tenantId: resolveTenantId(),
        name: name.trim(),
        category: category.trim() || 'Umum',
        type: 'Produk Fisik',
        costPrice: parseDigits(costPrice),
        price: parseDigits(price),
        stock: parseDigits(stock),
        status: 'Aktif',
        syncStatus: 'pending',
        version: 1,
        updatedAt: new Date().toISOString(),
      })

      setName('')
      setCategory('Umum')
      setCostPrice('0')
      setPrice('0')
      setStock('0')
      setOpen(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>{t('products.add')}</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t('products.add_title')}</SheetTitle>
          <SheetDescription>{t('products.form_description') || 'Tambah produk lokal...'}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
          <FormSection title={t('products.basic_info')} description={t('products.basic_info_description')}>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('products.name_placeholder')} />
            <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              {Array.from(new Set(categoryOptions)).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FormSection>
          <FormSection title={t('products.price_and_stock')} description={t('products.price_and_stock_description')}>
            <Input inputMode="numeric" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} placeholder={t('products.cost_price') || 'Modal / HPP'} />
            <Input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={t('products.selling_price') || 'Harga'} />
            <Input inputMode="numeric" value={stock} onChange={(event) => setStock(event.target.value)} placeholder={t('products.stock_placeholder') || 'Stok'} />
          </FormSection>
          <Button onClick={saveProduct} disabled={!name.trim()}>{t('products.save')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
