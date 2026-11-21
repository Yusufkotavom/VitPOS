import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Check,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { localDb } from '@/services/local-db/client'
import { serviceOrderRepository } from '@/services/local-db/repository'
import {
  messageTemplateService,
  type MessageTemplateType,
} from '@/services/message-template.service'
import { StatusBadge } from '@/shared/components/display/status-badge'
import {
  addWarrantyDuration,
  buildWarrantyTimelineNote,
  resolveServiceWarranty,
} from '@/features/service-orders/lib/warranty'
import { normalizeJobLines } from '@/features/service-orders/lib/job-lines'
import type {
  LocalServiceOrder,
  ServiceOrderStatus,
  WarrantyUnit,
} from '@/services/local-db/schema'

const ALL_STATUSES: ServiceOrderStatus[] = [
  'Diterima',
  'Menunggu Persetujuan',
  'Dikerjakan',
  'Selesai',
  'Garansi',
  'Batal',
]

function getStatusTone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success' as const
  if (status === 'Garansi') return 'info' as const
  if (status === 'Dikerjakan') return 'info' as const
  if (status === 'Menunggu Persetujuan') return 'warning' as const
  if (status === 'Batal') return 'danger' as const
  if (status === 'Diagnosa') return 'info' as const
  return 'warning' as const
}

async function renderOrderWaMessage(
  templateType: MessageTemplateType,
  order: LocalServiceOrder,
  targetStatus: ServiceOrderStatus,
  statusNote: string,
  totalPaid: number,
  remaining: number,
): Promise<string> {
  const lines = normalizeJobLines(order)
  return messageTemplateService.render(templateType, {
    code: order.code,
    customer_name: order.customerName,
    device:
      [order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') ||
      order.jobCategory ||
      order.description,
    problem: order.complaint || order.description,
    status: targetStatus,
    notes: statusNote.trim() || '-',
    cost: formatCurrency(order.cost),
    total: formatCurrency(order.cost),
    paid: formatCurrency(totalPaid),
    remaining: formatCurrency(remaining),
    estimated_completion: order.estimatedCompletion
      ? new Date(order.estimatedCompletion).toLocaleDateString('id-ID', {
          dateStyle: 'long',
        })
      : '-',
    date: formatDateTime(order.date),
    items:
      lines.length > 0
        ? lines
            .map((line) => `- ${line.name} (${line.qty} ${line.unit})`)
            .join('\n')
        : '-',
    change: '',
    payment_method: '',
    store_name: '',
  })
}

export type ServiceOrderStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: LocalServiceOrder
  initialTargetStatus?: ServiceOrderStatus
  customerPhone?: string
  totalPaid: number
  remaining: number
  onSuccess: () => void
}

export function ServiceOrderStatusDialog({
  open,
  onOpenChange,
  order,
  initialTargetStatus,
  customerPhone = '',
  totalPaid,
  remaining,
  onSuccess,
}: ServiceOrderStatusDialogProps) {
  const { t } = useTranslation()
  const [targetStatus, setTargetStatus] = useState<ServiceOrderStatus>(
    initialTargetStatus ?? order.status,
  )
  const [statusNote, setStatusNote] = useState('')
  const [technician, setTechnician] = useState(order.technicianName ?? '')

  // Warranty states (for when status is Selesai or Diambil)
  const initialWarranty = useMemo(() => resolveServiceWarranty(order), [order])
  const [hasWarranty, setHasWarranty] = useState(initialWarranty.hasWarranty)
  const [warrantyValue, setWarrantyValue] = useState(
    initialWarranty.warrantyValue ? String(initialWarranty.warrantyValue) : '30',
  )
  const [warrantyUnit, setWarrantyUnit] = useState<WarrantyUnit>(
    initialWarranty.warrantyUnit ?? 'hari',
  )

  // WhatsApp states
  const [sendWa, setSendWa] = useState(true)
  const [phone, setPhone] = useState(customerPhone)
  const [savePhoneToCustomer, setSavePhoneToCustomer] = useState(false)
  const [templateType, setTemplateType] = useState<MessageTemplateType>(
    initialTargetStatus === 'Selesai' || order.status === 'Selesai'
      ? 'service_order_selesai'
      : initialTargetStatus === 'Garansi' || order.status === 'Garansi'
        ? 'service_order_garansi'
        : initialTargetStatus === 'Menunggu Persetujuan' || order.status === 'Menunggu Persetujuan'
          ? 'service_order_persetujuan'
          : initialTargetStatus === 'Dikerjakan' || order.status === 'Dikerjakan'
            ? 'service_order_dikerjakan'
            : initialTargetStatus === 'Batal' || order.status === 'Batal'
              ? 'service_order_batal'
              : 'service_order_masuk',
  )
  const [waMessage, setWaMessage] = useState('')
  const [isRenderingTemplate, setIsRenderingTemplate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync targetStatus and phone when dialog opens
  useEffect(() => {
    if (open) {
      const next = initialTargetStatus ?? order.status
      const resolved = resolveServiceWarranty(order)
      setTargetStatus(next)
      setStatusNote('')
      setTechnician(order.technicianName ?? '')
      setHasWarranty(resolved.hasWarranty)
      setWarrantyValue(resolved.warrantyValue ? String(resolved.warrantyValue) : '30')
      setWarrantyUnit(resolved.warrantyUnit ?? 'hari')
      setPhone(customerPhone)
      setSendWa(Boolean(customerPhone.trim()))

      const defaultTpl: MessageTemplateType =
        next === 'Selesai' || next === 'Diambil'
          ? 'service_order_selesai'
          : next === 'Garansi'
            ? 'service_order_garansi'
            : next === 'Menunggu Persetujuan'
              ? 'service_order_persetujuan'
              : next === 'Dikerjakan'
                ? 'service_order_dikerjakan'
                : next === 'Batal'
                  ? 'service_order_batal'
                  : next === 'Diterima'
                    ? 'service_order_masuk'
                    : 'service_order_status'
      setTemplateType(defaultTpl)
    }
  }, [open, initialTargetStatus, order, customerPhone])

  // Automatically update template type when targetStatus changes
  const suggestedTemplateType = useMemo<MessageTemplateType>(() => {
    if (targetStatus === 'Selesai' || targetStatus === 'Diambil') {
      return 'service_order_selesai'
    }
    if (targetStatus === 'Garansi') {
      return 'service_order_garansi'
    }
    if (targetStatus === 'Menunggu Persetujuan') {
      return 'service_order_persetujuan'
    }
    if (targetStatus === 'Dikerjakan') {
      return 'service_order_dikerjakan'
    }
    if (targetStatus === 'Batal') {
      return 'service_order_batal'
    }
    if (targetStatus === 'Diterima') {
      return 'service_order_masuk'
    }
    return 'service_order_status'
  }, [targetStatus])

  useEffect(() => {
    setTemplateType(suggestedTemplateType)
  }, [suggestedTemplateType])

  // Render WhatsApp message when variables change
  useEffect(() => {
    if (!open) return
    let active = true

    async function generateMessage() {
      setIsRenderingTemplate(true)
      try {
        const rendered = await renderOrderWaMessage(
          templateType,
          order,
          targetStatus,
          statusNote,
          totalPaid,
          remaining,
        )
        if (active) {
          setWaMessage(rendered)
        }
      } catch {
        // Fallback message if template render fails
        if (active) {
          setWaMessage(
            `Halo ${order.customerName}, status servis ${order.code} saat ini: *${targetStatus}*. Catatan: ${statusNote || '-'}. Terima kasih.`,
          )
        }
      } finally {
        if (active) {
          setIsRenderingTemplate(false)
        }
      }
    }

    void generateMessage()
    return () => {
      active = false
    }
  }, [open, templateType, targetStatus, statusNote, order, totalPaid, remaining])

  async function handleSave() {
    setIsSubmitting(true)
    try {
      const nowIso = new Date().toISOString()
      let timeline = order.timeline ?? []
      const isStatusChanged = targetStatus !== order.status

      if (isStatusChanged || statusNote.trim()) {
        timeline = [
          ...timeline,
          {
            id: crypto.randomUUID(),
            status: targetStatus,
            date: nowIso,
            note:
              statusNote.trim() ||
              (isStatusChanged
                ? `Status diubah dari ${order.status} ke ${targetStatus}`
                : `Catatan ditambahkan pada status ${order.status}`),
            actor: technician.trim() || undefined,
          },
        ]
      }

      // Handle warranty if Selesai, Diambil, or Garansi
      let warrantyStartDate = order.warrantyStartDate
      let warrantyEndDate = order.warrantyEndDate
      const isFinishing =
        targetStatus === 'Selesai' ||
        targetStatus === 'Diambil' ||
        targetStatus === 'Garansi'

      if (isFinishing && hasWarranty) {
        if (!warrantyStartDate) warrantyStartDate = nowIso
        const val = Number(warrantyValue) || order.warrantyValue || 30
        warrantyEndDate = addWarrantyDuration(
          warrantyStartDate ?? nowIso,
          val,
          warrantyUnit,
        )
        timeline = [
          ...timeline,
          {
            id: crypto.randomUUID(),
            status: targetStatus,
            date: nowIso,
            note: buildWarrantyTimelineNote({
              value: val,
              unit: warrantyUnit,
              mode: order.hasWarranty ? 'updated' : 'created',
              endDate: warrantyEndDate,
            }),
            type: 'warranty',
            actor: technician.trim() || undefined,
            hasWarranty: true,
            warrantyValue: val,
            warrantyUnit,
            warrantyStartDate,
            warrantyEndDate,
          },
        ]
      } else if (!hasWarranty && order.hasWarranty) {
        warrantyStartDate = undefined
        warrantyEndDate = undefined
        timeline = [
          ...timeline,
          {
            id: crypto.randomUUID(),
            status: targetStatus,
            date: nowIso,
            note: buildWarrantyTimelineNote({
              value: 0,
              unit: 'hari',
              mode: 'removed',
            }),
            type: 'warranty',
            actor: technician.trim() || undefined,
            hasWarranty: false,
          },
        ]
      }

      const updatedOrder: LocalServiceOrder = {
        ...order,
        status: targetStatus,
        technicianName: technician.trim() || order.technicianName,
        hasWarranty: isFinishing ? hasWarranty : (hasWarranty || Boolean(order.hasWarranty)),
        warrantyValue:
          (isFinishing ? hasWarranty : (hasWarranty || Boolean(order.hasWarranty)))
            ? Number(warrantyValue) || order.warrantyValue || 30
            : undefined,
        warrantyUnit:
          (isFinishing ? hasWarranty : (hasWarranty || Boolean(order.hasWarranty)))
            ? warrantyUnit
            : order.warrantyUnit,
        warrantyStartDate:
          (isFinishing ? hasWarranty : (hasWarranty || Boolean(order.hasWarranty)))
            ? (warrantyStartDate || nowIso)
            : undefined,
        warrantyEndDate:
          (isFinishing ? hasWarranty : (hasWarranty || Boolean(order.hasWarranty)))
            ? warrantyEndDate
            : undefined,
        timeline,
        version: order.version + 1,
        updatedAt: nowIso,
      }

      await serviceOrderRepository.upsert(updatedOrder)

      // Optionally save phone number to customer profile
      if (phone.trim() && (savePhoneToCustomer || !customerPhone)) {
        if (order.customerId) {
          const cust = await localDb.customers.get(order.customerId)
          if (cust && (!cust.phone || cust.phone !== phone.trim())) {
            await localDb.customers.update(order.customerId, {
              phone: phone.trim(),
              updatedAt: nowIso,
            })
          }
        }
      }

      // Open WhatsApp if enabled
      if (sendWa) {
        const cleanPhone = phone.trim()
        if (!cleanPhone) {
          toast.warning(
            'Status diperbarui, namun WhatsApp belum dikirim karena nomor HP kosong.',
          )
        } else {
          let textToSend = waMessage.trim()
          if (!textToSend) {
            textToSend = await renderOrderWaMessage(
              templateType,
              order,
              targetStatus,
              statusNote,
              totalPaid,
              remaining,
            )
          }
          window.open(buildWhatsAppLink(cleanPhone, textToSend), '_blank')
          toast.success('Status diperbarui & membuka WhatsApp...')
        }
      } else {
        toast.success(t('service_orders.updated'))
      }

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        t('common.save_error', {
          message:
            error instanceof Error ? error.message : t('common.error_generic'),
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCurrent = targetStatus === order.status

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isCurrent ? 'Kirim WhatsApp Servis' : 'Ubah Status & Kirim WhatsApp'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {order.code} · {order.customerName} · Status saat ini:{' '}
                <span className="font-semibold">{order.status}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Pilih Status Baru */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status Servis
            </Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {ALL_STATUSES.map((status) => {
                const isSelected = targetStatus === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setTargetStatus(status)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-background hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span>{status}</span>
                    {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>

            {targetStatus !== order.status && (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                <StatusBadge label={order.status} tone={getStatusTone(order.status)} />
                <ArrowRight className="size-3 text-muted-foreground" />
                <StatusBadge label={targetStatus} tone={getStatusTone(targetStatus)} />
              </div>
            )}
          </div>

          {/* Garansi (jika status Selesai, Diambil, atau Garansi) */}
          {(targetStatus === 'Selesai' ||
            targetStatus === 'Diambil' ||
            targetStatus === 'Garansi') && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dialog-has-warranty"
                  checked={hasWarranty}
                  onChange={(e) => setHasWarranty(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <Label htmlFor="dialog-has-warranty" className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 cursor-pointer">
                  <ShieldCheck className="size-3.5" />
                  Berikan Garansi Servis
                </Label>
              </div>

              {hasWarranty && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    inputMode="numeric"
                    value={warrantyValue}
                    onChange={(e) => setWarrantyValue(e.target.value.replace(/\D/g, ''))}
                    className="h-8 w-24 text-xs"
                    placeholder="Nilai"
                  />
                  <Select
                    value={warrantyUnit}
                    onValueChange={(val) => setWarrantyUnit(val as WarrantyUnit)}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hari">Hari</SelectItem>
                      <SelectItem value="bulan">Bulan</SelectItem>
                      <SelectItem value="tahun">Tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Catatan / Keterangan Status */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="dialog-status-note" className="text-xs font-semibold">
                Catatan Perubahan Status (Opsional)
              </Label>
              <Textarea
                id="dialog-status-note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Contoh: Menunggu suku cadang LCD tiba / Pengerjaan selesai dites normal..."
                className="min-h-[58px] text-xs resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Catatan ini akan tersimpan di riwayat timeline dan disertakan ke pesan WhatsApp.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dialog-technician" className="text-xs font-medium">
                Teknisi Bertugas
              </Label>
              <Input
                id="dialog-technician"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="Nama teknisi..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Bagian WhatsApp */}
          <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <MessageSquare className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Notifikasi WhatsApp Pelanggan
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Kirim pesan update langsung ke WhatsApp pelanggan
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <input
                  type="checkbox"
                  checked={sendWa}
                  onChange={(e) => setSendWa(e.target.checked)}
                  className="h-4 w-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                />
                Kirim WA
              </label>
            </div>

            {sendWa && (
              <div className="space-y-2.5 pt-1">
                {/* Nomor Telepon */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dialog-wa-phone" className="text-xs font-medium">
                      Nomor WhatsApp Pelanggan
                    </Label>
                    {!customerPhone && phone.trim() && (
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={savePhoneToCustomer}
                          onChange={(e) => setSavePhoneToCustomer(e.target.checked)}
                          className="size-3 rounded"
                        />
                        Simpan nomor ke data pelanggan
                      </label>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="dialog-wa-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081234567890 / 62812..."
                      className="h-8 pl-8 text-xs font-mono"
                    />
                  </div>
                  {!phone.trim() && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      ⚠️ Nomor WhatsApp belum ada. Masukkan nomor HP di atas untuk mengirim pesan.
                    </p>
                  )}
                </div>

                {/* Pilihan Template */}
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="dialog-wa-template" className="text-xs font-medium shrink-0">
                    Pilihan Template:
                  </Label>
                  <Select
                    value={templateType}
                    onValueChange={(val) => setTemplateType(val as MessageTemplateType)}
                  >
                    <SelectTrigger id="dialog-wa-template" className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_order_persetujuan">
                        Menunggu Persetujuan (Konfirmasi Biaya)
                      </SelectItem>
                      <SelectItem value="service_order_dikerjakan">
                        Sedang Dikerjakan (Proses Servis)
                      </SelectItem>
                      <SelectItem value="service_order_selesai">
                        Service Selesai (Siap Diambil)
                      </SelectItem>
                      <SelectItem value="service_order_garansi">
                        Garansi Servis (Status & Klaim)
                      </SelectItem>
                      <SelectItem value="service_order_batal">
                        Pembatalan Servis
                      </SelectItem>
                      <SelectItem value="service_order_masuk">
                        Tanda Terima (Masuk)
                      </SelectItem>
                      <SelectItem value="service_order_status">
                        Update Status (Umum)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview Teks Pesan */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Pratinjau Pesan (Bisa Diedit):</span>
                    {isRenderingTemplate && <span>Memuat pratinjau...</span>}
                  </div>
                  <Textarea
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="min-h-[110px] text-xs font-mono bg-background/80"
                    placeholder="Ketik isi pesan WhatsApp..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className={
              sendWa && phone.trim()
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : ''
            }
          >
            {sendWa && phone.trim() ? (
              <>
                <MessageSquare className="mr-1.5 size-4" />
                Simpan & Buka WhatsApp
              </>
            ) : (
              'Simpan Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
