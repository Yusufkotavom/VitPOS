import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/features/products/hooks/use-categories'
import { productFormSchema, productInitialValues, productStatusOptions, productTypeOptions, type ProductFormValues } from '@/features/products/schemas/product-form-schema'
import { fileToDataUrl, uploadImageToR2 } from '@/services/upload.service'

import { Image, Upload, Package, Coffee, Shirt, MonitorSmartphone, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const iconOptions = [
  { id: 'Package', icon: <Package className="size-6" /> },
  { id: 'Coffee', icon: <Coffee className="size-6" /> },
  { id: 'Shirt', icon: <Shirt className="size-6" /> },
  { id: 'MonitorSmartphone', icon: <MonitorSmartphone className="size-6" /> },
]

type ProductFormProps = {
  defaultValues?: ProductFormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: ProductFormValues) => Promise<void>
}

export function ProductForm({ defaultValues, submitLabel, onCancel, onSubmit }: ProductFormProps) {
  const { t } = useTranslation()
  const categoryRows = useCategories()
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues ?? productInitialValues,
  })

  const errors = form.formState.errors
  const type = useWatch({ control: form.control, name: 'type' })
  const manageStock = useWatch({ control: form.control, name: 'manageStock' })
  const isService = type === 'Jasa'
  const isStockManaged = !isService && manageStock

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(defaultValues?.imageUrl || null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)

  useEffect(() => {
    // setPreviewImage removed to fix react-hooks/set-state-in-effect. defaultValues is handled in useState init.
  }, [defaultValues?.imageUrl])
  const selectedIcon = useWatch({ control: form.control, name: 'icon' })
  const categoryOptions = ['Umum', ...categoryRows.filter((category) => category.status === 'Aktif').map((category) => category.name)]

  const [wholesaleOpen, setWholesaleOpen] = useState(false)
  const wholesaleTiers = useWatch({ control: form.control, name: 'wholesaleTiers' }) ?? []

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WebP')
      return
    }
    setPendingImageFile(file)
    void fileToDataUrl(file).then((dataUrl) => {
      setPreviewImage(dataUrl)
      form.setValue('imageUrl', dataUrl, { shouldDirty: true })
    })
  }

  function clearImage() {
    setPendingImageFile(null)
    setPreviewImage(null)
    form.setValue('imageUrl', '', { shouldDirty: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function addTier() {
    const current = form.getValues('wholesaleTiers') ?? []
    form.setValue('wholesaleTiers', [...current, { minQty: '', price: '' }], { shouldDirty: true })
  }

  function removeTier(index: number) {
    const current = form.getValues('wholesaleTiers') ?? []
    form.setValue('wholesaleTiers', current.filter((_, i) => i !== index), { shouldDirty: true })
  }

  function updateTier(index: number, field: 'minQty' | 'price', value: string) {
    const current = form.getValues('wholesaleTiers') ?? []
    const updated = current.map((t, i) => i === index ? { ...t, [field]: value } : t)
    form.setValue('wholesaleTiers', updated, { shouldDirty: true })
  }

  async function handleSubmit(values: ProductFormValues) {
    if (!pendingImageFile) {
      await onSubmit(values)
      return
    }

    try {
      const imageUrl = await uploadImageToR2(pendingImageFile, 'products')
      setPendingImageFile(null)
      setPreviewImage(imageUrl)
      form.setValue('imageUrl', imageUrl, { shouldDirty: true })
      await onSubmit({ ...values, imageUrl })
    } catch {
      const imageUrl = await fileToDataUrl(pendingImageFile)
      toast.warning('Gagal upload ke cloud, gambar produk disimpan lokal. Konfigurasi R2 untuk cloud storage.')
      await onSubmit({ ...values, imageUrl })
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('products.image_label')}</label>
        <div className="flex gap-4 items-center">
          {previewImage ? (
            <div className="relative size-16 rounded-lg border overflow-hidden">
              <img src={previewImage} alt="Preview" className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center rounded-lg border bg-muted/30">
              {iconOptions.find(o => o.id === selectedIcon)?.icon || <Image className="size-6 text-muted-foreground" />}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4 mr-2" /> {t('common.upload')}
                </Button>
                {previewImage && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive h-8" onClick={clearImage}>
                    {t('common.delete')}
                  </Button>
                )}
            </div>
          </div>
        </div>
        {!previewImage && (
          <div className="flex gap-2 pt-1">
            {iconOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => form.setValue('icon', opt.id, { shouldDirty: true })}
                className={`flex size-10 items-center justify-center rounded-lg border ${selectedIcon === opt.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-muted'}`}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('products.name_label')}</label>
        <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder={t('products.name_placeholder')} />
        {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('common.category')}</label>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('products.category_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(categoryOptions)).map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category ? <span className="text-xs text-destructive">{errors.category.message}</span> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('common.type')}</label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('products.type_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {productTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('products.selling_price')}</label>
          <Controller
            control={form.control}
            name="price"
            render={({ field }) => (
              <CurrencyInput prefix="Rp" aria-invalid={Boolean(errors.price)} value={field.value} onChange={field.onChange} placeholder={t('products.price_placeholder')} />
            )}
          />
          {errors.price ? <span className="text-xs text-destructive">{errors.price.message}</span> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('products.cost_price')}</label>
          <Controller
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <CurrencyInput prefix="Rp" aria-invalid={Boolean(errors.costPrice)} value={field.value} onChange={field.onChange} placeholder={t('products.cost_price_placeholder')} />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
          <label className="text-sm font-medium">{t('products.wholesale_price_label')}</label>
        <Controller
          control={form.control}
          name="wholesalePrice"
          render={({ field }) => (
            <CurrencyInput prefix="Rp" aria-invalid={Boolean(errors.wholesalePrice)} value={field.value} onChange={field.onChange} placeholder={t('products.wholesale_price_placeholder')} />
          )}
        />
      </div>

      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setWholesaleOpen(!wholesaleOpen)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 rounded-lg"
        >
          {t('products.wholesale_tiers')}
          {wholesaleOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {wholesaleOpen && (
          <div className="px-3 pb-3 space-y-2">
            <p className="text-xs text-muted-foreground">{t('products.wholesale_tiers_description')}</p>
            {wholesaleTiers.map((tier, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">{t('products.min_qty')}</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t('products.min_qty_placeholder')}
                    className="h-8 text-sm"
                    value={tier.minQty}
                    onChange={(e) => updateTier(index, 'minQty', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">{t('products.wholesale_price')}</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder={t('products.tier_price_placeholder')}
                    className="h-8 text-sm"
                    value={tier.price}
                    onChange={(e) => updateTier(index, 'price', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="mt-5 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full gap-1" onClick={addTier}>
              <Plus className="size-3.5" /> {t('products.add_tier')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('common.status')}</label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('common.select_status')} />
                </SelectTrigger>
                <SelectContent>
                  {productStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium h-9">
            <input type="checkbox" disabled={isService} {...form.register('manageStock')} className="size-4 rounded border-input" />
            {t('products.manage_stock')}
          </label>
        </div>
      </div>

      {isStockManaged && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('products.available_stock')}</label>
          <Input aria-invalid={Boolean(errors.stock)} inputMode="numeric" {...form.register('stock')} placeholder={t('products.stock_placeholder')} />
          {errors.stock ? <span className="text-xs text-destructive">{errors.stock.message}</span> : null}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
