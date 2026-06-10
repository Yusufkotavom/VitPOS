import { PencilIcon, PlusIcon, Trash2Icon, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cashFormSchema, cashInitialValues, cashTypeOptions, cashStatusOptions, type CashFormValues } from '@/features/cash/schemas/cash-form-schema'
import { mapCashFormToRecord, mapCashRecordToFormValues } from '@/features/cash/schemas/cash-form-schema'
import { useCashCategories } from '@/features/cash/hooks/use-cash-categories'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { cashRepository } from '@/services/local-db/repository'
import type { LocalCash } from '@/services/local-db/schema'

export function CashCrudActions({ cash }: { cash?: LocalCash }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isEdit = Boolean(cash)
  const categories = useCashCategories()
  const paymentMethods = usePaymentMethods()
  const activeCategories = categories.filter(c => c.status === 'Aktif')
  const activePaymentMethods = paymentMethods.filter(p => p.status === 'Aktif')

  const form = useForm<CashFormValues>({
    resolver: zodResolver(cashFormSchema),
    defaultValues: cash ? mapCashRecordToFormValues(cash) : cashInitialValues,
  })

  useEffect(() => {
    form.reset(cash ? mapCashRecordToFormValues(cash) : cashInitialValues)
  }, [cash, form])

  const type = useWatch({ control: form.control, name: 'type' })
  const filteredCategories = activeCategories.filter(c => c.type === type)

  async function handleSubmit(values: CashFormValues) {
    const id = cash?.id ?? crypto.randomUUID()
    
    let finalRef = values.ref.trim()
    if (!finalRef) {
      const allCash = await cashRepository.list()
      const existingRefs = allCash.map(c => c.ref).filter(r => r.startsWith('KAS-'))
      const maxNum = existingRefs.reduce((max, r) => {
        const num = parseInt(r.replace('KAS-', ''), 10)
        return !isNaN(num) && num > max ? num : max
      }, 0)
      finalRef = `KAS-${String(maxNum + 1).padStart(3, '0')}`
    }

    const finalValues = { ...values, ref: finalRef }
    await cashRepository.upsert(mapCashFormToRecord(finalValues, id))
    toast.success(isEdit ? 'Transaksi diperbarui' : 'Transaksi ditambahkan')
    setFormOpen(false)
  }

  async function handleDelete() {
    if (!cash) return
    await cashRepository.remove(cash.id)
    toast.success('Transaksi dihapus')
    setDeleteOpen(false)
  }

  const errors = form.formState.errors

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogTrigger asChild>
          {cash
            ? <Button variant="outline" size="sm"><PencilIcon data-icon="inline-start" />Ubah</Button>
            : <Button><PlusIcon data-icon="inline-start" />Tambah Transaksi</Button>}
        </DialogTrigger>
        {!cash && (
          <Button variant="outline" asChild>
            <Link to="/cash/categories">
              <Settings2 data-icon="inline-start" /> Kelola Kategori
            </Link>
          </Button>
        )}
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Ubah transaksi kas' : 'Tambah transaksi kas'}</DialogTitle>
              <DialogDescription>Catat pemasukan atau pengeluaran. Outbox sinkron otomatis.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!errors.ref}>
                <Label htmlFor="ref">No. Referensi</Label>
                <Input id="ref" {...form.register('ref')} aria-invalid={!!errors.ref} placeholder="Otomatis jika kosong" />
              </Field>
              <Field data-invalid={!!errors.date}>
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" {...form.register('date')} aria-invalid={!!errors.date} placeholder="8 Juni 2026" />
              </Field>
              <Field data-invalid={!!errors.account}>
                <Label htmlFor="account">Akun Kas</Label>
                <Controller
                  name="account"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <SelectTrigger id="account">
                        <SelectValue placeholder="Pilih akun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {activePaymentMethods.length === 0 ? (
                            <SelectItem value="_none" disabled>Belum ada metode pembayaran</SelectItem>
                          ) : (
                            activePaymentMethods.map(opt => (
                              <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                            ))
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <Label htmlFor="type">Jenis</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cashTypeOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field data-invalid={!!errors.category}>
                <Label htmlFor="category">Kategori</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Controller
                      name="category"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {filteredCategories.length === 0 ? (
                                <SelectItem value="_none" disabled>Tidak ada kategori</SelectItem>
                              ) : (
                                filteredCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" asChild>
                    <Link to="/cash/categories" title="Kelola kategori">
                      <Settings2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Field>
              <Field data-invalid={!!errors.amount}>
                <Label htmlFor="amount">{type === 'Pemasukan' ? 'Nominal masuk' : 'Nominal keluar'}</Label>
                <Input id="amount" inputMode="numeric" {...form.register('amount')} aria-invalid={!!errors.amount} placeholder="0" />
              </Field>
              <Field>
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cashStatusOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
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
      {cash ? (
        <>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2Icon data-icon="inline-start" />Hapus</Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus transaksi</DialogTitle>
                <DialogDescription>Transaksi {cash.ref} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete}>Hapus transaksi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
