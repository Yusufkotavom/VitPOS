import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categoryFormSchema, categoryInitialValues, categoryStatusOptions, type CategoryFormValues } from '@/features/products/schemas/category-form-schema'
import { FormSection } from '@/shared/components/forms/form-section'

export function CategoryForm({ defaultValues, submitLabel, onCancel, onSubmit }: { defaultValues?: CategoryFormValues; submitLabel: string; onCancel: () => void; onSubmit: (values: CategoryFormValues) => Promise<void> }) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaultValues ?? categoryInitialValues,
  })

  useEffect(() => {
    form.reset(defaultValues ?? categoryInitialValues)
  }, [defaultValues, form])

  const errors = form.formState.errors

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection title="Detail kategori" description="Nama dan deksripsi kategori produk.">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nama kategori
          <Input aria-invalid={Boolean(errors.name)} {...form.register('name')} placeholder="Minuman" />
          {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Deskripsi (opsional)
          <Input aria-invalid={Boolean(errors.description)} {...form.register('description')} placeholder="Kategori untuk minuman dingin dan panas" />
          {errors.description ? <span className="text-xs text-destructive">{errors.description.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Status
          <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" {...form.register('status')}>
            {categoryStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </FormSection>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}
