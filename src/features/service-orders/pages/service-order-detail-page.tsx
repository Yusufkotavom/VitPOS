import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Download,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  ShieldCheck,
  ShieldX,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import { localDb } from '@/services/local-db/client'
import { serviceOrderRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { useServiceOrder } from '@/features/service-orders/hooks/use-service-order'
import { useServiceVertical } from '@/features/service-orders/hooks/use-service-vertical'
import { recordServiceOrderPayment } from '@/features/service-orders/services/service-order-finance.service'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { getPaymentMethodDisplay, buildQuickCashOptions } from '@/features/pos/lib/payment-method-display'
import { JobLineEditor } from '@/features/service-orders/components/job-line-editor'
import { JobCatalogPicker } from '@/features/service-orders/components/job-catalog-picker'
import { ServiceOrderStatusDialog } from '@/features/service-orders/components/service-order-status-dialog'
import { addWarrantyDuration, buildWarrantyTimelineNote, isJobOverdue, isWarrantyExpired } from '@/features/service-orders/lib/warranty'
import { normalizeJobLines, sumJobLines, validateJobLines } from '@/features/service-orders/lib/job-lines'
import { saveJobLineAsCatalogService } from '@/features/service-orders/lib/save-line-as-service'
import type { LocalJobLine, ServiceOrderStatus } from '@/services/local-db/schema'
import type { PdfData } from '@/shared/components/pdf/types'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success' as const
  if (status === 'Dikerjakan') return 'info' as const
  if (status === 'Batal') return 'danger' as const
  if (status === 'Diagnosa' || status === 'Menunggu Persetujuan') return 'info' as const
  return 'warning' as const
}

export function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, refetch } = useServiceOrder(id)
  const { t } = useTranslation()
  const vertical = useServiceVertical()
  const tenantId = requireActiveTenantId()
  const { printPdf, downloadPdf } = usePdf()

  const payments = useLiveQuery(
    () => (id ? localDb.payments.where('serviceOrderId').equals(id).toArray() : []),
    [id],
  )

  const customer = useLiveQuery(
    () => (order?.customerId ? localDb.customers.get(order.customerId) : undefined),
    [order?.customerId],
  )

  const paymentMethods = usePaymentMethods()
  const activeMethods = paymentMethods && paymentMethods.length > 0
    ? paymentMethods.filter((method) => method.status === 'Aktif')
    : [
        { id: 'tunai', name: t('payment.method_cash') },
        { id: 'qris', name: t('payment.method_qris') },
        { id: 'transfer', name: t('payment.method_transfer') },
      ]

  const lines = order ? normalizeJobLines(order) : []
  const totalPaid = payments?.reduce((acc, payment) => acc + payment.amount, 0) || 0
  const cost = order ? order.cost : 0
  const remaining = Math.max(0, cost - totalPaid)

  const [editing, setEditing] = useState(false)
  const [editCustomer, setEditCustomer] = useState('')
  const [editComplaint, setEditComplaint] = useState('')
  const [editDiagnosis, setEditDiagnosis] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editJobCategory, setEditJobCategory] = useState('')
  const [editStatus, setEditStatus] = useState<ServiceOrderStatus>('Diterima')
  const [editTechnician, setEditTechnician] = useState('')
  const [editEstimated, setEditEstimated] = useState('')
  const [editDetails, setEditDetails] = useState<Record<string, string>>({})
  const [editDiscount, setEditDiscount] = useState(0)
  const [editLines, setEditLines] = useState<LocalJobLine[]>([])
  const [editHasWarranty, setEditHasWarranty] = useState(false)
  const [editWarrantyValue, setEditWarrantyValue] = useState('')
  const [editWarrantyUnit, setEditWarrantyUnit] = useState<'hari' | 'bulan' | 'tahun'>('hari')

  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('tunai')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusDialogTarget, setStatusDialogTarget] = useState<ServiceOrderStatus | undefined>(undefined)

  function openStatusDialog(target?: ServiceOrderStatus) {
    setStatusDialogTarget(target)
    setStatusDialogOpen(true)
  }

  const serviceData: PdfData | null = order ? {
    type: 'service',
    code: order.code,
    date: formatDateTime(order.date),
    customer: {
      name: order.customerName,
      phone: customer?.phone,
      address: customer?.address || customer?.city,
    },
    device: [order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') || order.jobCategory || order.description,
    problem: order.complaint || order.description,
    cost: order.cost,
    summary: {
      subtotal: order.cost,
      discount: order.discountTotal ?? 0,
      grandTotal: order.cost,
      paidTotal: totalPaid,
      status: remaining <= 0 ? 'Lunas' : 'Sebagian',
    },
    items: lines.map((line) => ({ name: line.name, qty: line.qty, price: line.unitPrice, subtotal: line.subtotal })),
    warranty: order.hasWarranty && order.warrantyEndDate ? {
      value: order.warrantyValue ?? 0,
      unit: order.warrantyUnit ?? 'hari',
      isExpired: isWarrantyExpired(order.warrantyEndDate),
      endDate: order.warrantyEndDate,
    } : undefined,
    payments: payments?.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      date: formatDateTime(payment.date),
    })),
  } : null

  if (isLoading) {
    return (
      <PageShell title={t('common.loading')} description="">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    )
  }

  function startEditing() {
    if (!order) return
    setEditCustomer(order.customerName)
    setEditComplaint(order.complaint ?? order.description)
    setEditDiagnosis(order.diagnosis ?? '')
    setEditNotes(order.notes ?? '')
    setEditJobCategory(order.jobCategory ?? '')
    setEditStatus(order.status)
    setEditTechnician(order.technicianName ?? '')
    setEditEstimated(order.estimatedCompletion ? order.estimatedCompletion.slice(0, 10) : '')
    setEditDetails(order.details ?? {})
    setEditDiscount(order.discountTotal ?? 0)
    setEditLines(normalizeJobLines(order))
    setEditHasWarranty(order.hasWarranty ?? false)
    setEditWarrantyValue(String(order.warrantyValue ?? ''))
    setEditWarrantyUnit(order.warrantyUnit ?? 'hari')
    setEditing(true)
  }

  async function saveEditing() {
    if (!order) return

    const validationError = validateJobLines(editLines)
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const customerName = editCustomer.trim()
      const matchedCustomer = customerName
        ? await localDb.customers.where('tenantId').equals(tenantId).filter((row) => row.name === customerName).first()
        : undefined

      let timeline = order.timeline ?? []
      const nowIso = new Date().toISOString()

      if (editStatus !== order.status) {
        timeline = [
          ...timeline,
          {
            id: crypto.randomUUID(),
            status: editStatus,
            date: nowIso,
            note: `Status diubah menjadi ${editStatus}`,
            actor: editTechnician || undefined,
          },
        ]
      }

      let warrantyStartDate = order.warrantyStartDate
      let warrantyEndDate = order.warrantyEndDate

      if (editStatus === 'Selesai' && editHasWarranty) {
        if (!warrantyStartDate) warrantyStartDate = nowIso
        const value = Number(editWarrantyValue) || 0
        if (!order.hasWarranty || value !== order.warrantyValue || editWarrantyUnit !== order.warrantyUnit || !warrantyEndDate) {
          warrantyEndDate = addWarrantyDuration(warrantyStartDate ?? nowIso, value, editWarrantyUnit)
          timeline = [
            ...timeline,
            {
              id: crypto.randomUUID(),
              status: editStatus,
              date: nowIso,
              note: buildWarrantyTimelineNote({
                value,
                unit: editWarrantyUnit,
                mode: order.hasWarranty ? 'updated' : 'created',
                endDate: warrantyEndDate,
              }),
              type: 'warranty',
              actor: editTechnician || undefined,
            },
          ]
        }
      } else if (!editHasWarranty && order.hasWarranty) {
        warrantyStartDate = undefined
        warrantyEndDate = undefined
        timeline = [
          ...timeline,
          {
            id: crypto.randomUUID(),
            status: editStatus,
            date: nowIso,
            note: buildWarrantyTimelineNote({ value: 0, unit: 'hari', mode: 'removed' }),
            type: 'warranty',
            actor: editTechnician || undefined,
          },
        ]
      }

      const subtotal = sumJobLines(editLines)
      const finalCost = Math.max(subtotal - editDiscount, 0)

      await serviceOrderRepository.upsert({
        ...order,
        customerId: matchedCustomer?.id,
        customerName,
        description: editComplaint.trim(),
        complaint: editComplaint.trim(),
        diagnosis: editDiagnosis.trim() || undefined,
        notes: editNotes.trim() || undefined,
        jobCategory: editJobCategory.trim() || undefined,
        cost: finalCost,
        discountTotal: editDiscount > 0 ? editDiscount : undefined,
        costPrice: editLines.reduce((sum, line) => sum + (line.costPrice ?? 0) * line.qty, 0),
        lines: editLines,
        items: editLines.map((line) => ({
          productId: line.productId ?? line.id,
          name: line.name,
          qty: line.qty,
          price: line.unitPrice,
          costPrice: line.costPrice,
          subtotal: line.subtotal,
        })),
        status: editStatus,
        technicianName: editTechnician.trim() || undefined,
        details: editDetails,
        estimatedCompletion: editEstimated ? new Date(editEstimated).toISOString() : undefined,
        hasWarranty: editHasWarranty,
        warrantyValue: editHasWarranty ? Number(editWarrantyValue) || undefined : undefined,
        warrantyUnit: editHasWarranty ? editWarrantyUnit : undefined,
        warrantyStartDate,
        warrantyEndDate,
        timeline,
        version: order.version + 1,
        updatedAt: nowIso,
      })

      toast.success(t('service_orders.updated'))
      setEditing(false)
      refetch()
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!order) return
    try {
      await serviceOrderRepository.remove(order.id)
      toast.success(t('service_orders.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleAddPayment() {
    if (!order || payAmount <= 0) return
    try {
      await recordServiceOrderPayment(order.id, payAmount, payMethod, 'Service Order', tenantId)
      toast.success(t('service_orders.payment_added'))
      setPaymentOpen(false)
      refetch()
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  if (!order) {
    return (
      <PageShell title={t('common.not_found')} description={t('service_orders.not_found')}>
        <Button asChild variant="outline">
          <Link to="/service-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back_to_list')}
          </Link>
        </Button>
      </PageShell>
    )
  }

  const statusFlow = vertical.statusFlow
  const currentIndex = statusFlow.indexOf(order.status)
  const isFinal = order.status === 'Diambil' || order.status === 'Batal'
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null
  const isOverdue = isJobOverdue(order.estimatedCompletion, order.status)

  const editSubtotal = sumJobLines(editLines)
  const editTotal = Math.max(editSubtotal - editDiscount, 0)
  const quickCashOptions = buildQuickCashOptions(remaining)

  return (
    <PageShell
      title={order.code}
      description={`${order.customerName} · ${order.date}`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => serviceData && printPdf(serviceData)}>
            <Printer className="mr-2 h-4 w-4" />
            {t('common.print')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => serviceData && downloadPdf(serviceData, `Service-${order.code}`)}>
            <Download className="mr-2 h-4 w-4" />
            {t('common.pdf')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            onClick={() => openStatusDialog(order.status)}
          >
            <MessageSquare className="mr-1.5 size-4" />
            Kirim WA
          </Button>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={saveEditing}>
                <Check className="mr-2 h-4 w-4" />
                {t('common.save')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Stepper + aksi status */}
          <Card className="gap-4 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {statusFlow.map((status, index) => {
                const reached = currentIndex >= index && currentIndex !== -1
                return (
                  <div key={status} className="flex items-center gap-1.5">
                    {index > 0 && <span className="h-px w-4 bg-border" />}
                    <button
                      type="button"
                      onClick={() => !editing && openStatusDialog(status as ServiceOrderStatus)}
                      disabled={editing}
                      className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent"
                      title={editing ? undefined : `Ubah status ke ${status}`}
                    >
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold',
                          reached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className={cn('text-xs', reached ? 'font-medium' : 'text-muted-foreground')}>{status}</span>
                    </button>
                  </div>
                )
              })}
            </div>

            {isOverdue && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {t('service_orders.overdue_hint')}
              </p>
            )}

            {!editing && (
              <div className="flex flex-wrap gap-2">
                {!isFinal && nextStatus && (
                  <Button size="sm" onClick={() => openStatusDialog(nextStatus)}>
                    <ArrowRight data-icon="inline-start" />
                    {t('service_orders.advance_to', { status: nextStatus })}
                  </Button>
                )}
                {!isFinal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStatusDialog('Selesai')}
                    disabled={order.status === 'Selesai'}
                  >
                    {t('service_orders.mark_complete')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openStatusDialog()}>
                  <Pencil className="mr-1.5 size-3.5" />
                  Ubah Status
                </Button>
                {remaining > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => { setPayAmount(remaining); setPaymentOpen(true) }}>
                    <CreditCard data-icon="inline-start" />
                    {t('service_orders.accept_payment')}
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Info pekerjaan */}
          <Card className="gap-4 p-4">
            <h3 className="text-sm font-semibold">{t('service_orders.job_detail')}</h3>

            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium">
                  {t('common.customer')}
                  <Input value={editCustomer} onChange={(event) => setEditCustomer(event.target.value)} className="h-10" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                  {vertical.jobCategoryLabel}
                  <Input value={editJobCategory} onChange={(event) => setEditJobCategory(event.target.value)} className="h-10" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
                  {vertical.complaintLabel}
                  <Textarea value={editComplaint} onChange={(event) => setEditComplaint(event.target.value)} className="min-h-[72px]" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
                  {vertical.diagnosisLabel}
                  <Textarea value={editDiagnosis} onChange={(event) => setEditDiagnosis(event.target.value)} className="min-h-[64px]" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                  {t('service_orders.technician')}
                  <Input value={editTechnician} onChange={(event) => setEditTechnician(event.target.value)} className="h-10" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                  {t('service_orders.estimated_completion')}
                  <Input type="date" value={editEstimated} onChange={(event) => setEditEstimated(event.target.value)} className="h-10" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
                  {t('service_orders.additional_notes')}
                  <Textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} className="min-h-[56px]" />
                </label>
                {vertical.intakeFields
                  .filter((field) => !['deviceBrand', 'deviceModel', 'deviceSerial', 'accessories'].includes(field.key))
                  .map((field) => (
                    <label key={field.key} className="flex flex-col gap-1 text-xs font-medium">
                      {field.label}
                      <Input
                        value={editDetails[field.key] ?? ''}
                        onChange={(event) => setEditDetails((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        placeholder={field.placeholder}
                        className="h-10"
                      />
                    </label>
                  ))}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('common.customer')}</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{vertical.jobCategoryLabel}</p>
                    <p className="font-medium">{order.jobCategory || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('service_orders.device')}</p>
                    <p className="font-medium">
                      {[order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('service_orders.technician')}</p>
                    <p className="font-medium">{order.technicianName || '-'}</p>
                  </div>
                  {order.deviceSerial && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('service_orders.device_serial')}</p>
                      <p className="font-medium">{order.deviceSerial}</p>
                    </div>
                  )}
                  {order.accessories && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('service_orders.accessories')}</p>
                      <p className="font-medium">{order.accessories}</p>
                    </div>
                  )}
                  {vertical.intakeFields
                    .filter((field) => !['deviceBrand', 'deviceModel', 'deviceSerial', 'accessories'].includes(field.key))
                    .map((field) => {
                      const value = order.details?.[field.key]
                      if (!value) return null
                      return (
                        <div key={field.key}>
                          <p className="text-xs text-muted-foreground">{field.label}</p>
                          <p className="font-medium">{value}</p>
                        </div>
                      )
                    })}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">{vertical.complaintLabel}</p>
                  <p className="whitespace-pre-wrap font-medium">{order.complaint || order.description}</p>
                </div>

                {order.diagnosis && (
                  <div>
                    <p className="text-xs text-muted-foreground">{vertical.diagnosisLabel}</p>
                    <p className="whitespace-pre-wrap">{order.diagnosis}</p>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('service_orders.additional_notes')}</p>
                    <p className="text-muted-foreground">{order.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Item pekerjaan */}
          <Card className="gap-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('service_orders.items_used')}</h3>
              {editing && (
                <Button type="button" size="sm" variant="outline" onClick={() => setIsCatalogOpen(true)}>
                  <Plus data-icon="inline-start" />
                  {t('service_orders.from_catalog')}
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                {editLines.map((line) => (
                  <JobLineEditor
                    key={line.id}
                    line={line}
                    onChange={(changes) =>
                      setEditLines((prev) => prev.map((item) => {
                        if (item.id !== line.id) return item
                        const next = { ...item, ...changes }
                        const subtotal = next.priceMode === 'area'
                          ? Math.round(next.qty * (next.width ?? 0) * (next.height ?? 0) * next.unitPrice)
                          : Math.round(next.qty * next.unitPrice)
                        return { ...next, subtotal }
                      }))
                    }
                    onRemove={() => setEditLines((prev) => prev.filter((item) => item.id !== line.id))}
                    onSaveAsCatalog={() => {
                      saveJobLineAsCatalogService(line, order.jobCategory || 'Jasa Servis')
                        .then(() => toast.success(t('service_orders.saved_as_service')))
                        .catch((error) => toast.error(error instanceof Error ? error.message : t('common.error_generic')))
                    }}
                  />
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditLines((prev) => [...prev, {
                  id: `line-${crypto.randomUUID()}`,
                  source: 'custom',
                  kind: 'service',
                  name: '',
                  unit: 'pcs',
                  qty: 1,
                  priceMode: 'unit',
                  unitPrice: 0,
                  costPrice: 0,
                  trackStock: false,
                  subtotal: 0,
                }])}>
                  <Plus data-icon="inline-start" />
                  {t('service_orders.custom_line')}
                </Button>
              </div>
            ) : lines.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('service_orders.no_item_details')}</p>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => (
                  <div key={line.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.qty} {line.unit} × {formatCurrency(line.unitPrice)}
                        {line.priceMode === 'area' && line.width && line.height ? ` · ${line.width}x${line.height}` : ''}
                        {line.note ? ` · ${line.note}` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">{formatCurrency(line.subtotal)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card className="gap-4 p-4">
            <h3 className="text-sm font-semibold">{t('service_orders.status_history')}</h3>
            {(!order.timeline || order.timeline.length === 0) ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('service_orders.no_timeline_history')}</p>
            ) : (
              <ol className="space-y-3">
                {order.timeline.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className={cn(
                      'mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                      item.type === 'warranty' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-primary bg-background text-primary',
                    )}>
                      {item.type === 'warranty' ? <ShieldCheck className="size-3" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={item.type === 'warranty' ? t('service_orders.warranty') : item.status}
                          tone={item.type === 'warranty' ? 'warning' : tone(item.status)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {item.actor && <span className="text-xs text-muted-foreground">· {item.actor}</span>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-4">
          <Card className="gap-4 p-4">
            <h3 className="text-sm font-semibold">{t('service_orders.status_and_cost')}</h3>

            {editing ? (
              <div className="space-y-3">
                <label className="flex flex-col gap-1 text-xs font-medium">
                  {t('service_orders.job_status')}
                  <Select value={editStatus} onValueChange={(value) => setEditStatus(value as ServiceOrderStatus)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('common.select_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {vertical.statusFlow.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                      <SelectItem value="Batal">Batal</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium">
                  {t('common.discount')}
                  <CurrencyInput prefix="Rp" value={editDiscount} onValueChange={setEditDiscount} className="h-10" />
                </label>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.subtotal')}</span>
                  <span>{formatCurrency(editSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-medium">{t('common.total')}</span>
                  <span className="text-lg font-bold">{formatCurrency(editTotal)}</span>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-warranty"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={editHasWarranty}
                      onChange={(event) => setEditHasWarranty(event.target.checked)}
                    />
                    <label htmlFor="edit-warranty" className="text-xs font-medium">{t('service_orders.service_warranty')}</label>
                  </div>
                  {editHasWarranty && (
                    <div className="flex gap-2">
                      <Input
                        inputMode="numeric"
                        className="h-9 w-20"
                        value={editWarrantyValue}
                        onChange={(event) => setEditWarrantyValue(event.target.value.replace(/\D/g, ''))}
                        aria-label={t('service_orders.warranty_value')}
                      />
                      <Select value={editWarrantyUnit} onValueChange={(value) => setEditWarrantyUnit(value as 'hari' | 'bulan' | 'tahun')}>
                        <SelectTrigger className="h-9 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hari">{t('common.days')}</SelectItem>
                          <SelectItem value="bulan">{t('common.months')}</SelectItem>
                          <SelectItem value="tahun">{t('common.years')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('service_orders.job_status')}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge label={order.status} tone={tone(order.status)} />
                    {!editing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => openStatusDialog()}
                        className="h-6 px-1.5 text-xs text-primary hover:underline"
                      >
                        Ubah
                      </Button>
                    )}
                  </div>
                </div>
                {order.discountTotal ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('common.discount')}</span>
                    <span className="text-destructive">-{formatCurrency(order.discountTotal)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('service_orders.service_cost')}</span>
                  <span className="font-bold">{formatCurrency(order.cost)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed pt-2 text-primary">
                  <span className="font-medium">{t('service_orders.paid_amount')}</span>
                  <span className="font-bold">{formatCurrency(totalPaid)}</span>
                </div>
                {remaining > 0 ? (
                  <div className="flex items-center justify-between text-destructive">
                    <span className="font-medium">{t('service_orders.remaining_balance')}</span>
                    <span className="text-lg font-bold">{formatCurrency(remaining)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-success">
                    <span className="font-medium">{t('service_orders.payment_status')}</span>
                    <span className="text-lg font-bold">{t('common.paid')}</span>
                  </div>
                )}

                {remaining > 0 && (
                  <Button className="w-full" onClick={() => { setPayAmount(remaining); setPaymentOpen(true) }}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('service_orders.accept_payment')}
                  </Button>
                )}

                <div className="space-y-1 border-t border-dashed pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('service_orders.service_warranty')}</span>
                    {order.hasWarranty ? (
                      order.warrantyEndDate && isWarrantyExpired(order.warrantyEndDate) ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                          <ShieldX className="h-4 w-4" />
                          {t('service_orders.warranty_expired')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <ShieldCheck className="h-4 w-4" />
                          {order.warrantyValue} {order.warrantyUnit}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('common.none')}</span>
                    )}
                  </div>
                  {order.hasWarranty && order.warrantyEndDate && (
                    <p className="text-xs text-muted-foreground">
                      {t('service_orders.valid_until', {
                        date: new Date(order.warrantyEndDate).toLocaleDateString('id-ID', { dateStyle: 'long' }),
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {payments && payments.length > 0 && (
            <Card className="gap-3 p-4">
              <h3 className="text-sm font-semibold">{t('service_orders.payment_history')}</h3>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium capitalize">{payment.method}</p>
                      <p className="text-xs text-muted-foreground">{payment.date}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('service_orders.select_product_service')}</DialogTitle>
          </DialogHeader>
          <JobCatalogPicker
            onPick={(product) => {
              const isService = product.type === 'Jasa'
              setEditLines((prev) => {
                const existing = !isService
                  ? prev.find((line) => line.source === 'catalog' && line.productId === product.id)
                  : undefined

                if (existing) {
                  return prev.map((line) =>
                    line.id === existing.id
                      ? { ...line, qty: line.qty + 1, subtotal: (line.qty + 1) * line.unitPrice }
                      : line,
                  )
                }

                return [
                  ...prev,
                  {
                    id: `line-${crypto.randomUUID()}`,
                    source: 'catalog',
                    kind: isService ? 'service' : 'product',
                    productId: product.id,
                    name: product.name,
                    unit: product.unit ?? (isService ? 'unit' : 'pcs'),
                    qty: 1,
                    priceMode: 'unit',
                    unitPrice: product.price,
                    costPrice: product.costPrice,
                    trackStock: !isService && product.manageStock !== false,
                    subtotal: product.price,
                  },
                ]
              })
              toast.success(t('service_orders.item_added', { name: product.name }))
            }}
          />
          <DialogFooter>
            <Button type="button" onClick={() => setIsCatalogOpen(false)}>{t('common.finish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('service_orders.delete_title')}</DialogTitle>
            <DialogDescription>{t('service_orders.delete_description', { code: order.code })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('service_orders.accept_payment')}</DialogTitle>
            <DialogDescription>{t('service_orders.payment_dialog_description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm">
              <span>{t('service_orders.remaining_bill')}</span>
              <span className="font-bold text-destructive">{formatCurrency(remaining)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.method')}</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {activeMethods.map((method: { id: string; name: string }) => {
                  const display = getPaymentMethodDisplay(method.id, method.name)
                  const MethodIcon = display.icon
                  const isActive = payMethod === method.name.toLowerCase()
                  return (
                    <Button
                      key={method.id}
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => setPayMethod(method.name.toLowerCase())}
                      size="sm"
                      className="justify-start gap-2"
                      aria-pressed={isActive}
                    >
                      <MethodIcon className={`size-4 ${isActive ? '' : display.tone}`} aria-hidden="true" />
                      {method.name}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="soc-detail-pay">{t('common.amount')}</label>
              <CurrencyInput
                id="soc-detail-pay"
                prefix="Rp"
                value={payAmount}
                onValueChange={setPayAmount}
                className="h-11 text-lg font-bold"
              />
              {quickCashOptions.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {quickCashOptions.slice(0, 4).map((amount, index) => (
                    <Button key={amount} type="button" variant="secondary" size="sm" onClick={() => setPayAmount(amount)}>
                      {index === 0 ? t('pos.quick_cash_exact') : formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddPayment} disabled={payAmount <= 0}>{t('service_orders.save_payment')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServiceOrderStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        order={order}
        initialTargetStatus={statusDialogTarget}
        customerPhone={customer?.phone}
        totalPaid={totalPaid}
        remaining={remaining}
        onSuccess={() => refetch()}
      />
    </PageShell>
  )
}
