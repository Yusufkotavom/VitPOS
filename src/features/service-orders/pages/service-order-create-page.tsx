import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowLeft, CalendarIcon, Check, Plus, Sparkles, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldGroup } from '@/components/ui/field'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format-currency'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { customerRepository } from '@/services/local-db/repository'
import { createCustomerId } from '@/features/catalog/lib/entity-id'
import { customerFormSchema, customerInitialValues, customerStatusOptions, mapCustomerFormToRecord, type CustomerFormValues } from '@/features/customers/schemas/customer-form-schema'
import { useServiceOrderCreateStore } from '@/features/service-orders/stores/service-order-create-store'
import { useServiceVertical } from '@/features/service-orders/hooks/use-service-vertical'
import { JobLineEditor } from '@/features/service-orders/components/job-line-editor'
import { JobCatalogPicker } from '@/features/service-orders/components/job-catalog-picker'
import { SocPaymentSummary } from '@/features/service-orders/components/soc-payment-summary'
import { ServiceSuccessFlow, type ServiceSuccessMeta } from '@/features/service-orders/components/service-success-flow'
import { sumJobLines } from '@/features/service-orders/lib/job-lines'
import { saveJobLineAsCatalogService } from '@/features/service-orders/lib/save-line-as-service'
import { isJobOverdue } from '@/features/service-orders/lib/warranty'
import type { JobPriority } from '@/services/local-db/schema'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'

export function ServiceOrderCreatePage() {
  const { t } = useTranslation()
  const store = useServiceOrderCreateStore()
  const vertical = useServiceVertical()
  const tenantId = requireActiveTenantId()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [successOrder, setSuccessOrder] = useState<PosOrderSummary | null>(null)
  const [successMeta, setSuccessMeta] = useState<ServiceSuccessMeta | null>(null)

  const customers = useLiveQuery(() => localDb.customers.where('tenantId').equals(tenantId).toArray(), [tenantId], [])
  const activeCustomers = useMemo(() => (customers ?? []).filter((customer) => customer.status === 'Aktif'), [customers])

  const addCustomerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { ...customerInitialValues, receivable: '0', orders: '0' },
  })

  const subtotal = sumJobLines(store.lines)
  const total = Math.max(subtotal - store.discount, 0)

  function handleCustomerInputChange(name: string) {
    const match = activeCustomers.find((customer) => customer.name.toLowerCase() === name.toLowerCase())
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

  function handleQuickService(service: { label: string; complaint: string }) {
    store.setComplaint(service.complaint)
    if (!store.description.trim()) store.setDescription(service.complaint)
    store.addCustomLine({ name: service.label })
  }

  function handlePickProduct(product: Parameters<typeof store.addProduct>[0]) {
    store.addProduct(product)
    toast.success(t('service_orders.item_added', { name: product.name }))
  }

  function handleOpenPayment() {
    if (!store.complaint.trim() && !store.description.trim()) {
      toast.error(t('service_orders.description_required'))
      return
    }
    if (store.lines.length === 0) {
      toast.error(t('service_orders.lines_required'))
      return
    }
    if (store.lines.some((line) => !line.name.trim())) {
      toast.error(t('service_orders.line_name_required'))
      return
    }
    if (store.lines.some((line) => !Number.isFinite(line.qty) || line.qty <= 0)) {
      toast.error(t('service_orders.line_qty_required'))
      return
    }
    if (!store.customerName || store.customerName.trim() === '') {
      toast.error(t('service_orders.customer_required'))
      return
    }
    setIsPaymentOpen(true)
  }

  const addCustomerErrors = addCustomerForm.formState.errors
  const isOverdue = useMemo(
    () => isJobOverdue(store.estimatedCompletion),
    [store.estimatedCompletion],
  )

  const summaryPanel = (
    <div className="space-y-4">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('common.customer')}</span>
          <span className="font-medium">{store.customerName || 'Umum'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{vertical.jobCategoryLabel}</span>
          <span className="font-medium">{store.jobCategory || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('service_orders.device')}</span>
          <span className="max-w-[60%] truncate text-right font-medium">
            {[store.deviceBrand, store.deviceModel].filter(Boolean).join(' ') || '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('service_orders.estimated_completion')}</span>
          <span className={cn('font-medium', isOverdue && 'text-destructive')}>
            {store.estimatedCompletion ? format(new Date(store.estimatedCompletion), 'd MMM yyyy', { locale: localeId }) : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('common.status')}</span>
          <StatusBadge label={vertical.statusFlow[0] ?? 'Diterima'} tone="warning" />
        </div>
      </div>

      <div className="space-y-2 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('common.subtotal')}</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t('common.discount')}</span>
          <Input
            inputMode="numeric"
            value={store.discount || ''}
            onChange={(event) => store.setDiscount(Number(event.target.value.replace(/\D/g, '')) || 0)}
            className="h-8 w-28 text-right"
            placeholder="0"
            aria-label={t('common.discount')}
          />
        </div>
        <div className="flex items-end justify-between pt-1">
          <span className="font-medium">{t('common.total')}</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      <Button size="lg" className="h-12 w-full" onClick={handleOpenPayment}>
        <Check data-icon="inline-start" />
        {t('service_orders.create_order')}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">{t('service_orders.save_local_description')}</p>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-muted/20 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/service-orders" aria-label={t('common.back')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{t('service_orders.create_order')}</h1>
            <p className="truncate text-xs text-muted-foreground">{vertical.label}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* 1. Pelanggan & Perangkat */}
          <Card className="gap-4 p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
              <h2 className="text-sm font-semibold">{t('service_orders.section_customer_device')}</h2>
            </div>

            <div className="space-y-1">
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
                <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => setIsAddCustomerOpen(true)} aria-label={t('customers.add_new')}>
                  <UserPlus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="soc-job-category" className="text-xs text-muted-foreground">{vertical.jobCategoryLabel}</Label>
                <Input
                  id="soc-job-category"
                  value={store.jobCategory}
                  onChange={(event) => store.setJobCategory(event.target.value)}
                  placeholder={vertical.jobCategoryPlaceholder}
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="soc-priority" className="text-xs text-muted-foreground">{t('service_orders.priority')}</Label>
                <Select value={store.priority} onValueChange={(value) => store.setPriority(value as JobPriority)}>
                  <SelectTrigger id="soc-priority" className="h-10 w-full">
                    <SelectValue placeholder={t('common.select_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Normal', 'Tinggi', 'Mendesak'] as JobPriority[]).map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`service_orders.priority_${option.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {vertical.intakeFields.map((field) => {
                const deviceFieldKeys = ['deviceBrand', 'deviceModel', 'deviceSerial', 'accessories'] as const
                const isDeviceField = (deviceFieldKeys as readonly string[]).includes(field.key)
                const value = isDeviceField
                  ? (store[field.key as typeof deviceFieldKeys[number]] ?? '')
                  : (store.details[field.key] ?? '')

                return (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={`soc-${field.key}`} className="text-xs text-muted-foreground">{field.label}</Label>
                    <Input
                      id={`soc-${field.key}`}
                      value={value}
                      onChange={(event) => {
                        if (isDeviceField) {
                          store.setDeviceField(field.key as typeof deviceFieldKeys[number], event.target.value)
                        } else {
                          store.setDetail(field.key, event.target.value)
                        }
                      }}
                      placeholder={field.placeholder}
                      className="h-10"
                    />
                  </div>
                )
              })}
              <div className="space-y-1">
                <Label htmlFor="soc-technician" className="text-xs text-muted-foreground">{t('service_orders.technician')}</Label>
                <Input
                  id="soc-technician"
                  value={store.technicianName}
                  onChange={(event) => store.setTechnicianName(event.target.value)}
                  placeholder={t('service_orders.technician_placeholder')}
                  className="h-10"
                />
              </div>
            </div>
          </Card>

          {/* 2. Keluhan & Pekerjaan */}
          <Card className="gap-4 p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
              <h2 className="text-sm font-semibold">{t('service_orders.section_job')}</h2>
            </div>

            {vertical.quickServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vertical.quickServices.map((service) => (
                  <Button
                    key={service.label}
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={() => handleQuickService(service)}
                  >
                    <Sparkles className="size-3.5" />
                    {service.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="soc-complaint" className="text-xs text-muted-foreground">{vertical.complaintLabel}</Label>
              <Textarea
                id="soc-complaint"
                className="min-h-[76px] resize-none"
                placeholder={vertical.complaintPlaceholder}
                value={store.complaint}
                onChange={(event) => store.setComplaint(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="soc-diagnosis" className="text-xs text-muted-foreground">{vertical.diagnosisLabel}</Label>
              <Textarea
                id="soc-diagnosis"
                className="min-h-[64px] resize-none"
                placeholder={t('service_orders.diagnosis_placeholder')}
                value={store.diagnosis}
                onChange={(event) => store.setDiagnosis(event.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('service_orders.estimated_completion')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-10 w-full justify-start gap-2 font-normal', !store.estimatedCompletion && 'text-muted-foreground')}>
                      <CalendarIcon className="h-4 w-4" />
                      {store.estimatedCompletion
                        ? format(new Date(store.estimatedCompletion), 'd MMM yyyy', { locale: localeId })
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
                <Label className="text-xs text-muted-foreground">{t('service_orders.service_warranty')}</Label>
                <div className="flex h-10 items-center gap-2">
                  <input
                    type="checkbox"
                    id="soc-warranty"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={store.hasWarranty}
                    onChange={(event) => store.setHasWarranty(event.target.checked)}
                  />
                  {store.hasWarranty ? (
                    <>
                      <Input
                        inputMode="numeric"
                        className="h-10 w-16"
                        value={store.warrantyValue}
                        onChange={(event) => store.setWarrantyValue(event.target.value.replace(/\D/g, ''))}
                        placeholder="30"
                        aria-label={t('service_orders.warranty_value')}
                      />
                      <Select value={store.warrantyUnit} onValueChange={(value) => store.setWarrantyUnit(value as 'hari' | 'bulan' | 'tahun')}>
                        <SelectTrigger className="h-10 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hari">{t('common.days')}</SelectItem>
                          <SelectItem value="bulan">{t('common.months')}</SelectItem>
                          <SelectItem value="tahun">{t('common.years')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('common.none')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="soc-notes" className="text-xs text-muted-foreground">{t('service_orders.additional_notes')}</Label>
              <Textarea
                id="soc-notes"
                className="min-h-[56px] resize-none"
                placeholder={t('service_orders.internal_notes')}
                value={store.notes}
                onChange={(event) => store.setNotes(event.target.value)}
              />
            </div>
          </Card>

          {/* 3. Item & Biaya */}
          <Card className="gap-4 p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
              <h2 className="text-sm font-semibold">{t('service_orders.section_items')}</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setIsCatalogOpen(true)}>
                <Plus data-icon="inline-start" />
                {t('service_orders.from_catalog')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => store.addCustomLine()}>
                <Plus data-icon="inline-start" />
                {t('service_orders.custom_line')}
              </Button>
            </div>

            {store.lines.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">{t('service_orders.no_lines')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('service_orders.no_lines_desc')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {store.lines.map((line) => (
                  <JobLineEditor
                    key={line.id}
                    line={line}
                    onChange={(changes) => store.updateLine(line.id, changes)}
                    onRemove={() => store.removeLine(line.id)}
                    onSaveAsCatalog={() => {
                      saveJobLineAsCatalogService(line, store.jobCategory || 'Jasa Servis')
                        .then(() => toast.success(t('service_orders.saved_as_service')))
                        .catch((error) => toast.error(error instanceof Error ? error.message : t('common.error_generic')))
                    }}
                  />
                ))}
              </div>
            )}

            {store.lines.length > 0 && (
              <div className="space-y-2 rounded-xl bg-muted/30 p-3 text-sm lg:hidden">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.subtotal')}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{t('common.discount')}</span>
                  <Input
                    inputMode="numeric"
                    value={store.discount || ''}
                    onChange={(event) => store.setDiscount(Number(event.target.value.replace(/\D/g, '')) || 0)}
                    className="h-8 w-28 text-right"
                    placeholder="0"
                    aria-label={t('common.discount')}
                  />
                </div>
                <div className="flex items-end justify-between border-t pt-2">
                  <span className="font-medium">{t('common.total')}</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Ringkasan */}
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <Card className="gap-3 p-4">
              <h2 className="text-sm font-semibold">{t('service_orders.summary')}</h2>
              {summaryPanel}
            </Card>
          </div>
        </aside>
      </main>

      {/* Footer mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t('pos.item_count', { count: store.lines.length })}</p>
            <p className="truncate text-lg font-bold">{formatCurrency(total)}</p>
          </div>
          <Button size="lg" className="h-11 min-w-32" onClick={handleOpenPayment}>
            {t('service_orders.create_order')}
          </Button>
        </div>
      </div>

      {isDesktop ? (
        <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('service_orders.select_product_service')}</DialogTitle>
            </DialogHeader>
            <JobCatalogPicker onPick={handlePickProduct} />
            <DialogFooter>
              <span className="mr-auto text-xs text-muted-foreground">
                {t('pos.item_count', { count: store.lines.length })}
              </span>
              <Button type="button" onClick={() => setIsCatalogOpen(false)}>{t('common.finish')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="border-b text-left">
              <DrawerTitle>{t('service_orders.select_product_service')}</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <JobCatalogPicker onPick={handlePickProduct} />
            </div>
            <div className="border-t p-3">
              <Button className="w-full" onClick={() => setIsCatalogOpen(false)}>
                {t('common.finish')} ({store.lines.length})
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('service_orders.process_service_order')}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <SocPaymentSummary
              onComplete={() => setIsPaymentOpen(false)}
              onSuccess={(order, meta) => {
                setIsPaymentOpen(false)
                setSuccessOrder(order)
                setSuccessMeta(meta)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ServiceSuccessFlow
        order={successOrder}
        meta={successMeta}
        onClose={() => {
          setSuccessOrder(null)
          setSuccessMeta(null)
        }}
      />

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
                <Label htmlFor="soc-cust-city">{t('common.city')}</Label>
                <Input id="soc-cust-city" {...addCustomerForm.register('city')} aria-invalid={!!addCustomerErrors.city} />
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
                          {customerStatusOptions.map((opt) => (
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
