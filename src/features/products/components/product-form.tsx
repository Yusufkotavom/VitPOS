import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/features/products/hooks/use-categories'
import { productFormSchema, productInitialValues, productStatusOptions, productTypeOptions, type ProductFormValues } from '@/features/products/schemas/product-form-schema'

import { Image, Upload, Package, Coffee, Shirt, MonitorSmartphone } from 'lucide-react'

const iconOptions = [
  { id: 'Package', icon: <Package className="size-6" /> },
  { id: 'Coffee', icon: <Coffee className="size-6" /> },
  { id: 'Shirt', icon: <Shirt className="size-6" /> },
  { id: 'MonitorSmartphone', icon: <MonitorSmartphone className="size-6" /> },
]

export function ProductForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: ProductFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: ProductFormValues) => Promise<void> }) {
  const categoryRows = useCategories()
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues ?? productInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? productInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors
  const type = useWatch({ control: form.control, name: 'type' })
  const manageStock = useWatch({ control: form.control, name: 'manageStock' })
  const isService = type === 'Jasa'
  const isStockManaged = !isService && manageStock

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(defaultValues?.imageUrl || null)
  const selectedIcon = useWatch({ control: form.control, name: 'icon' })
  const categoryOptions = ['Umum', ...categoryRows.filter((category) => category.status === 'Aktif').map((category) => category.name)]

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPreviewImage(dataUrl)
      form.setValue('imageUrl', dataUrl, { shouldDirty: true })
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setPreviewImage(null)
    form.setValue('imageUrl', '', { shouldDirty: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Gambar Produk</label>
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
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4 mr-2" /> Upload
              </Button>
              {previewImage && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive h-8" onClick={clearImage}>
                  Hapus
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
        <label className="text-sm font-medium">Nama produk</label>
        <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder="Kopi Arabika" />
        {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih Kategori" />
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
          <label className="text-sm font-medium">Jenis</label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih Jenis" />
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
          <label className="text-sm font-medium">Harga Jual</label>
          <Input aria-invalid={Boolean(errors.price)} inputMode="numeric" {...form.register('price')} placeholder="18000" />
          {errors.price ? <span className="text-xs text-destructive">{errors.price.message}</span> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Modal / HPP</label>
          <Input aria-invalid={Boolean(errors.costPrice)} inputMode="numeric" {...form.register('costPrice')} placeholder="12000" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Harga Grosir (Opsional)</label>
        <Input aria-invalid={Boolean(errors.wholesalePrice)} inputMode="numeric" {...form.register('wholesalePrice')} placeholder="15000" />
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih Status" />
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
            Kelola Stok
          </label>
        </div>
      </div>

      {isStockManaged && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Stok Tersedia</label>
          <Input aria-invalid={Boolean(errors.stock)} inputMode="numeric" {...form.register('stock')} placeholder="24" />
          {errors.stock ? <span className="text-xs text-destructive">{errors.stock.message}</span> : null}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
