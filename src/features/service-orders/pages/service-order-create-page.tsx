import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Plus, Minus, Trash2, Search, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
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
import { SocPaymentSummary } from '@/features/service-orders/components/soc-payment-summary'
import { customerFormSchema, customerInitialValues, customerStatusOptions, type CustomerFormValues, mapCustomerFormToRecord } from '@/features/customers/schemas/customer-form-schema'
import { createCustomerId } from '@/features/catalog/lib/entity-id'
import { customerRepository } from '@/services/local-db/repository'

export function ServiceOrderCreatePage() {
  const { t } = useTranslation()
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
    try {
      const id = createCustomerId()
      await customerRepository.upsert(mapCustomerFormToRecord(values, id))
      store.setCustomer(values.name.trim(), id)
      toast.success(t('customers.added'))
      setIsAddCustomerOpen(false)
      addCustomerForm.reset()
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  function handleOpenPayment() {
    if (!store.description.trim()) {
      toast.error(t('service_orders.description_required'))
      return
    }
    if (!store.customerName || store.customerName.trim() === '') {
      toast.error('Silakan pilih pelanggan terlebih dahulu')
      setTimeout(() => {
        const input = document.getElementById('soc-customer-select')
        if (input) {
          input.focus()
          input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }
    setIsPaymentOpen(true)
  }

  const addCustomerErrors = addCustomerForm.formState.errors

  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/20 relative pb-20">
      <div className="mx-auto max-w-3xl w-full px-4 pt-4">
          <div className="flex flex-wrap items-end gap-4 px-4 py-3">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-xs text-muted-foreground">{t('common.customer')}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Combobox items={activeCustomers} value={store.customerName || ''} onValueChange={handleCustomerInputChange}>
                    <ComboboxInput id="soc-customer-select" placeholder={t('service_orders.search_select')} />
                    <ComboboxContent>
                      {activeCustomers.length === 0 ? (
                        <ComboboxEmpty>{t('customers.none')}</ComboboxEmpty>
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
              <Label className="text-xs text-muted-foreground">{t('service_orders.estimated_completion')}</Label>
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
                      : t('common.select_date')}
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

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="soc-warranty"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={store.hasWarranty}
                  onChange={(e) => store.setHasWarranty(e.target.checked)}
                />
                <Label htmlFor="soc-warranty" className="text-xs text-muted-foreground cursor-pointer">{t('service_orders.service_warranty')}</Label>
              </div>
              {store.hasWarranty && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    placeholder={t('service_orders.duration')}
                    className="h-8 w-20 text-sm"
                    value={store.warrantyValue}
                    onChange={(e) => store.setWarrantyValue(e.target.value)}
                  />
                  <select
                    value={store.warrantyUnit}
                    onChange={(e) => store.setWarrantyUnit(e.target.value as 'hari' | 'bulan' | 'tahun')}
                    className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                  >
                    <option value="hari">{t('common.days')}</option>
                    <option value="bulan">{t('common.months')}</option>
                    <option value="tahun">{t('common.years')}</option>
                  </select>
                </div>
              )}
            </div>
            </div>
          </div>

      <main className="flex-1 mx-auto max-w-3xl w-full p-4 space-y-4">
        <div className="space-y-3">
          <Label htmlFor="soc-description">{t('service_orders.job_description')}</Label>
          <Textarea
            id="soc-description"
            className="min-h-[80px] resize-none"
            placeholder={t('service_orders.job_description_placeholder')}
            value={store.description}
            onChange={e => store.setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t('service_orders.items_and_cost')}</span>
          <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" />
                {t('common.add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{t('service_orders.select_product_service')}</DialogTitle>
              </DialogHeader>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('service_orders.search_product_service')}
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
                        store.addItem({ productId: p.id, name: p.name, price: p.price, wholesaleTiers: p.wholesaleTiers })
                        toast.success(t('service_orders.item_added', { name: p.name }))
                      }}
                    >
                      {t('common.add')}
                    </Button>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">{t('service_orders.no_products')}</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {store.items.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">{t('service_orders.no_items')}</p>
            </div>
          ) : (
            store.items.map(item => (
              <div key={item.productId} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center rounded-lg border bg-background">
                  <Button variant="secondary" className="flex h-7 w-7 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted" onClick={() => item.qty > 1 ? store.updateItemQty(item.productId, item.qty - 1) : store.removeItem(item.productId)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                  <Button variant="secondary" className="flex h-7 w-7 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted" onClick={() => store.updateItemQty(item.productId, item.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-semibold w-24 text-right">{formatCurrency(item.subtotal)}</span>
                <Button variant="ghost" onClick={() => store.removeItem(item.productId)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </main>

      <div className="sticky bottom-0 left-0 right-0 border-t bg-background px-4 py-3 z-20">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{t('pos.item_count', { count: store.items.length })}</p>
            <p className="text-lg font-bold">{formatCurrency(totals.subtotal)}</p>
          </div>
          <Button size="lg" className="min-w-32" onClick={handleOpenPayment}>
            {t('service_orders.create_order')}
          </Button>
        </div>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('service_orders.process_service_order')}</DialogTitle>
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
              <DialogTitle>{t('customers.add_new')}</DialogTitle>
              <DialogDescription>{t('customers.save_local_description')}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={!!addCustomerErrors.name}>
                <Label htmlFor="soc-cust-name">{t('common.name')}</Label>
                <Input id="soc-cust-name" {...addCustomerForm.register('name')} aria-invalid={!!addCustomerErrors.name} autoFocus />
              </Field>
              <Field data-invalid={!!addCustomerErrors.phone}>
                <Label htmlFor="soc-cust-phone">{t('common.whatsapp')}</Label>
                <Input id="soc-cust-phone" {...addCustomerForm.register('phone')} aria-invalid={!!addCustomerErrors.phone} />
              </Field>
              <Field data-invalid={!!addCustomerErrors.city}>
                <Label htmlFor="soc-cust-city">{t('common.address')}</Label>
                <Textarea id="soc-cust-city" {...addCustomerForm.register('city')} aria-invalid={!!addCustomerErrors.city} className="min-h-[3.5rem]" />
              </Field>
              <Field>
                <Label htmlFor="soc-cust-status">{t('common.status')}</Label>
                <Controller
                  name="status"
                  control={addCustomerForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="soc-cust-status">
                        <SelectValue placeholder={t('common.select_status')} />
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
                <Button variant="outline" type="button">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={addCustomerForm.formState.isSubmitting}>{t('common.add')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
