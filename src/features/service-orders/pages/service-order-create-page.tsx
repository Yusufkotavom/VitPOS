import { useState } from 'react'
import { Plus, Minus, Trash2, Search, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { useServiceOrderCreateStore } from '@/features/service-orders/stores/service-order-create-store'
import { serviceOrderStatusOptions } from '@/features/service-orders/schemas/service-order-form-schema'
import { SocPaymentSummary } from '@/features/service-orders/components/soc-payment-summary'
import { customerFormSchema, customerInitialValues, customerStatusOptions, type CustomerFormValues, mapCustomerFormToRecord } from '@/features/customers/schemas/customer-form-schema'
import { createCustomerId } from '@/features/catalog/lib/entity-id'
import { customerRepository } from '@/services/local-db/repository'

export function ServiceOrderCreatePage() {
  const store = useServiceOrderCreateStore()
  const tenantId = requireActiveTenantId()

  const [search, setSearch] = useState('')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)

  const customers = useLiveQuery(() => localDb.customers.where('tenantId').equals(tenantId).toArray(), [tenantId], [])
  const products = useLiveQuery(() => localDb.products.where('tenantId').equals(tenantId).toArray(), [tenantId], [])

  const activeCustomers = (customers ?? []).filter(c => c.status === 'Aktif')

  const addCustomerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { ...customerInitialValues, receivable: '0', orders: '0' },
  })

  const filteredProducts = products.filter(p => {
    if (p.status !== 'Aktif') return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totals = {
    subtotal: store.items.reduce((sum, item) => sum + item.subtotal, 0),
  }

  function handleCustomerInputChange(name: string) {
    const match = activeCustomers.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (match) {
      store.setCustomer(match.name, match.id)
    } else if (name === '') {
      store.setCustomer('Umum', null)
    } else {
      store.setCustomer(name, `custom-${Date.now()}`)
    }
  }

  async function handleAddCustomer(values: CustomerFormValues) {
    const id = createCustomerId()
    await customerRepository.upsert(mapCustomerFormToRecord(values, id))
    store.setCustomer(values.name.trim(), id)
    toast.success('Pelanggan ditambahkan')
    setIsAddCustomerOpen(false)
    addCustomerForm.reset()
  }

  function handleOpenPayment() {
    if (!store.description.trim()) {
      toast.error('Deskripsi pekerjaan wajib diisi')
      return
    }
    setIsPaymentOpen(true)
  }

  const addCustomerErrors = addCustomerForm.formState.errors

  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/20 relative pb-20">
      <div className="px-4 pt-4">
        <Card className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-end gap-4 px-4 py-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-xs text-muted-foreground">Pelanggan</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Combobox items={activeCustomers} value={store.customerName || ''} onValueChange={handleCustomerInputChange}>
                    <ComboboxInput placeholder="Cari / Pilih (Umum)" />
                    <ComboboxContent>
                      {activeCustomers.length === 0 ? (
                        <ComboboxEmpty>Belum ada pelanggan.</ComboboxEmpty>
                      ) : (
                        <ComboboxList>
                          {(item: unknown) => {
                            const customer = item as (typeof activeCustomers)[number]
                            return (
                              <ComboboxItem key={customer.id} value={customer.name} className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">{customer.name}</span>
                                <span className="text-xs text-muted-foreground">{customer.phone}</span>
                              </ComboboxItem>
                            )
                          }}
                        </ComboboxList>
                      )}
                    </ComboboxContent>
                  </Combobox>
                </div>
                <Button variant="outline" className="h-9 w-9 shrink-0" onClick={() => setIsAddCustomerOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={store.status} onValueChange={store.setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {serviceOrderStatusOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estimasi Selesai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-1.5 font-normal w-[140px] justify-start",
                      !store.estimatedCompletion && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {store.estimatedCompletion
                      ? format(new Date(store.estimatedCompletion), "d MMM yyyy", { locale: localeId })
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={store.estimatedCompletion ? new Date(store.estimatedCompletion) : undefined}
                    onSelect={(date) => store.setEstimatedCompletion(date ? date.toISOString() : undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>
      </div>

      <main className="flex-1 mx-auto max-w-3xl w-full p-4 space-y-4">
        <div className="space-y-3">
          <Label htmlFor="soc-description">Pekerjaan / Kerusakan</Label>
          <Textarea
            id="soc-description"
            className="min-h-[80px] resize-none"
            placeholder="Deskripsikan pekerjaan atau kerusakan..."
            value={store.description}
            onChange={e => store.setDescription(e.target.value)}
          />

          <Label htmlFor="soc-notes">Catatan</Label>
          <Input
            id="soc-notes"
            placeholder="Catatan internal (opsional)"
            value={store.notes}
            onChange={e => store.setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Item / Biaya</span>
          <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Pilih Produk / Jasa</DialogTitle>
              </DialogHeader>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 mt-4">
                {filteredProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(p.price)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        store.addItem({ productId: p.id, name: p.name, price: p.price })
                        toast.success(`${p.name} ditambahkan`)
                      }}
                    >
                      Tambah
                    </Button>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Tidak ada produk ditemukan</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {store.items.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">Belum ada item</p>
            </div>
          ) : (
            store.items.map(item => (
              <div key={item.productId} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center rounded-lg border bg-background">
                  <button className="flex h-7 w-7 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted" onClick={() => item.qty > 1 ? store.updateItemQty(item.productId, item.qty - 1) : store.removeItem(item.productId)}>
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                  <button className="flex h-7 w-7 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted" onClick={() => store.updateItemQty(item.productId, item.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-semibold w-24 text-right">{formatCurrency(item.subtotal)}</span>
                <button onClick={() => store.removeItem(item.productId)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <div className="sticky bottom-0 left-0 right-0 border-t bg-background px-4 py-3 z-20">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{store.items.length} item</p>
            <p className="text-lg font-bold">{formatCurrency(totals.subtotal)}</p>
          </div>
          <Button size="lg" className="min-w-32" onClick={handleOpenPayment}>
            Buat Order
          </Button>
        </div>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proses Service Order</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <SocPaymentSummary onComplete={() => setIsPaymentOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={addCustomerForm.handleSubmit(handleAddCustomer)}>
            <DialogHeader>
              <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
              <DialogDescription>Simpan lokal lebih dulu. Outbox sinkron jalan otomatis.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!addCustomerErrors.name}>
                <Label htmlFor="soc-cust-name">Nama</Label>
                <Input id="soc-cust-name" {...addCustomerForm.register('name')} aria-invalid={!!addCustomerErrors.name} autoFocus />
              </Field>
              <Field data-invalid={!!addCustomerErrors.phone}>
                <Label htmlFor="soc-cust-phone">WhatsApp</Label>
                <Input id="soc-cust-phone" {...addCustomerForm.register('phone')} aria-invalid={!!addCustomerErrors.phone} />
              </Field>
              <Field data-invalid={!!addCustomerErrors.city}>
                <Label htmlFor="soc-cust-city">Alamat</Label>
                <Textarea id="soc-cust-city" {...addCustomerForm.register('city')} aria-invalid={!!addCustomerErrors.city} className="min-h-[3.5rem]" />
              </Field>
              <Field>
                <Label htmlFor="soc-cust-status">Status</Label>
                <Controller
                  name="status"
                  control={addCustomerForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="soc-cust-status">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {customerStatusOptions.map(opt => (
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
              <Button type="submit" disabled={addCustomerForm.formState.isSubmitting}>Tambah</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
