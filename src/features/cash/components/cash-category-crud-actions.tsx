import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cashCategoryFormSchema, cashCategoryInitialValues, cashCategoryTypeOptions, type CashCategoryFormValues } from '@/features/cash/schemas/cash-category-schema'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { cashCategoryRepository } from '@/services/local-db/repository'
import type { LocalCashCategory } from '@/services/local-db/schema'

export function CashCategoryCrudActions({ category }: { category?: LocalCashCategory }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(category)

  const form = useForm<CashCategoryFormValues>({
    resolver: zodResolver(cashCategoryFormSchema),
    defaultValues: category
      ? { name: category.name, type: category.type, status: category.status }
      : cashCategoryInitialValues,
  })

  useEffect(() => {
    form.reset(category
      ? { name: category.name, type: category.type, status: category.status }
      : cashCategoryInitialValues)
  }, [category, form])

  async function handleSubmit(values: CashCategoryFormValues) {
    try {
      const id = category?.id ?? crypto.randomUUID()
      const now = new Date().toISOString()
      await cashCategoryRepository.upsert({
        id,
        tenantId: resolveTenantId(category?.tenantId),
        name: values.name.trim(),
        type: values.type,
        status: values.status,
        syncStatus: 'pending',
        version: (category?.version ?? 0) + 1,
        updatedAt: now,
      })
      toast.success(isEdit ? 'Kategori diperbarui' : 'Kategori ditambahkan')
      setFormOpen(false)
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!category) return
    try {
      await cashCategoryRepository.remove(category.id)
      toast.success('Kategori dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  const errors = form.formState.errors

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {category
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button>
            : <Button size="sm"><PlusIcon data-icon="inline-start" />Tambah</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Ubah kategori' : 'Tambah kategori'}</DialogTitle>
              <DialogDescription>Kategori untuk pemasukan atau pengeluaran kas.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <Label htmlFor="name">Nama Kategori</Label>
                <Input id="name" {...form.register('name')} aria-invalid={!!errors.name} placeholder="Penjualan" />
              </Field>
              <Field>
                <Label htmlFor="type">Tipe</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cashCategoryTypeOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="category-status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="category-status">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Batal</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {category ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus kategori</DialogTitle>
                <DialogDescription>Kategori {category.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus kategori</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
