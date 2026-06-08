import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { productFormSchema, productInitialValues, productStatusOptions, productTypeOptions, type ProductFormValues } from '@/features/products/schemas/product-form-schema'
import { FormSection } from '@/shared/components/forms/form-section'
import { Image, Upload, Package, Coffee, Shirt, MonitorSmartphone } from 'lucide-react'

const iconOptions = [
  { id: 'Package', icon: <Package className="size-6" /> },
  { id: 'Coffee', icon: <Coffee className="size-6" /> },
  { id: 'Shirt', icon: <Shirt className="size-6" /> },
  { id: 'MonitorSmartphone', icon: <MonitorSmartphone className="size-6" /> },
]

export function ProductForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: ProductFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: ProductFormValues) => Promise<void> }) {
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
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Gambar Produk" description="Upload foto atau pilih icon.">
        <div className="flex flex-col gap-3">
          <div className="flex gap-4 items-center">
            {previewImage ? (
              <div className="relative size-24 rounded-xl border overflow-hidden">
                <img src={previewImage} alt="Preview" className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="flex size-24 items-center justify-center rounded-xl border bg-muted/30">
                {iconOptions.find(o => o.id === selectedIcon)?.icon || <Image className="size-6 text-muted-foreground" />}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4 mr-2" /> Upload Foto
              </Button>
              {previewImage && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive h-8" onClick={clearImage}>
                  Hapus Foto
                </Button>
              )}
            </div>
          </div>
          {!previewImage && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Atau Pilih Icon Default:</p>
              <div className="flex gap-2">
                {iconOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => form.setValue('icon', opt.id, { shouldDirty: true })}
                    className={`flex size-12 items-center justify-center rounded-xl border ${selectedIcon === opt.id ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-muted'}`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FormSection>

      <FormSection title="Info produk" description="Nama, kategori, jenis, dan status produk.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nama produk
          <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder="Kopi Arabika" />
          {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Kategori
          <Input aria-invalid={Boolean(errors.category)} {...form.register('category')} placeholder="Minuman" />
          {errors.category ? <span className="text-xs text-destructive">{errors.category.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Jenis
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('type')}>
            {productTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('status')}>
            {productStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </FormSection>

      <FormSection title="Harga" description="Harga jual reguler dan grosir (opsional).">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Harga Reguler
          <Input aria-invalid={Boolean(errors.price)} inputMode="numeric" {...form.register('price')} placeholder="18000" />
          {errors.price ? <span className="text-xs text-destructive">{errors.price.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Harga Grosir / Variasi
          <Input aria-invalid={Boolean(errors.wholesalePrice)} inputMode="numeric" {...form.register('wholesalePrice')} placeholder="15000 (Opsional)" />
        </label>
      </FormSection>

      <FormSection title="Inventaris" description="Kelola stok fisik jika perlu.">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" disabled={isService} {...form.register('manageStock')} className="size-4 rounded border-input" />
          Kelola Stok {isService && <span className="text-xs text-muted-foreground font-normal">(Tidak berlaku untuk Jasa)</span>}
        </label>
        
        {isStockManaged ? (
          <label className="flex flex-col gap-1 text-sm font-medium mt-2">
            Stok Tersedia
            <Input aria-invalid={Boolean(errors.stock)} inputMode="numeric" {...form.register('stock')} placeholder="24" />
            {errors.stock ? <span className="text-xs text-destructive">{errors.stock.message}</span> : null}
          </label>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
            Stok Tidak Terbatas (Unlimited)
          </div>
        )}
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}

