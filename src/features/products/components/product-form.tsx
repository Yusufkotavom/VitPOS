import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { productFormSchema, productInitialValues, productStatusOptions, productTypeOptions, type ProductFormValues } from '@/features/products/schemas/product-form-schema'
import { FormSection } from '@/shared/components/forms/form-section'

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

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
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
      <FormSection title="Harga & stok" description="Harga jual dan stok lokal awal.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Harga jual
          <Input aria-invalid={Boolean(errors.price)} inputMode="numeric" {...form.register('price')} placeholder="18000" />
          {errors.price ? <span className="text-xs text-destructive">{errors.price.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Stok
          <Input aria-invalid={Boolean(errors.stock)} disabled={type === 'Jasa'} inputMode="numeric" {...form.register('stock')} placeholder="24" />
          {errors.stock ? <span className="text-xs text-destructive">{errors.stock.message}</span> : null}
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
