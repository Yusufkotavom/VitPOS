import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, Download, PencilIcon, XIcon, CheckIcon, Trash2Icon, CreditCard, ShieldCheck, ShieldX, PlusIcon, Search } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/format-currency'
import { formatDateTime } from '@/lib/date'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { useServiceOrder } from '@/features/service-orders/hooks/use-service-order'
import { serviceOrderRepository } from '@/services/local-db/repository'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { serviceOrderStatusOptions } from '@/features/service-orders/schemas/service-order-form-schema'
import { recordServiceOrderPayment } from '@/features/service-orders/services/service-order-finance.service'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { addWarrantyDuration, buildWarrantyTimelineNote, isWarrantyExpired } from '@/features/service-orders/lib/warranty'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

type EditableItem = { id: string; name: string; qty: string; unitPrice: string; productId?: string }

export function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, refetch } = useServiceOrder(id)
  const tenantId = requireActiveTenantId()
  
  // Data Pembayaran
  const payments = useLiveQuery(() => 
    id ? localDb.payments.where('serviceOrderId').equals(id).toArray() : []
  , [id])
  
  const paymentMethods = usePaymentMethods()
  const activeMethods = paymentMethods && paymentMethods.length > 0 ? paymentMethods.filter(m => m.status === 'Aktif') : [
    { id: 'tunai', name: 'Tunai' },
    { id: 'qris', name: 'QRIS' },
    { id: 'transfer', name: 'Transfer' },
  ]

  const totalPaid = payments?.reduce((acc, p) => acc + p.amount, 0) || 0
  const remaining = order ? Math.max(0, order.cost - totalPaid) : 0

  const [editing, setEditing] = useState(false)
  const [editCustomer, setEditCustomer] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCost, setEditCost] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editHasWarranty, setEditHasWarranty] = useState(false)
  const [editWarrantyValue, setEditWarrantyValue] = useState('')
  const [editWarrantyUnit, setEditWarrantyUnit] = useState<'hari' | 'bulan' | 'tahun'>('hari')
  const [editItems, setEditItems] = useState<EditableItem[]>([])

  // Product dialog states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const products = useLiveQuery(() => localDb.products.where('tenantId').equals(tenantId).toArray(), [tenantId], [])
  const filteredProducts = (products || []).filter(p => {
    if (p.status !== 'Aktif') return false
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    return true
  })

  const [deleteOpen, setDeleteOpen] = useState(false)

  // Pelunasan State
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('tunai')

  const { downloadPdf, printPdf } = usePdf()

  const serviceData: PdfData | null = order ? {
    type: 'service',
    code: order.code,
    date: formatDateTime(order.date),
    customer: { name: order.customerName },
    device: order.description.split('\n')[0] || order.description,
    problem: order.description,
    cost: order.cost,
    summary: {
      subtotal: order.cost,
      discount: 0,
      grandTotal: order.cost,
      paidTotal: totalPaid,
      status: remaining <= 0 ? 'Lunas' : 'Sebagian',
    },
    items: order.items?.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.subtotal })),
    warranty: order.hasWarranty && order.warrantyEndDate ? {
      value: order.warrantyValue ?? 0,
      unit: order.warrantyUnit ?? 'hari',
      isExpired: isWarrantyExpired(order.warrantyEndDate),
      endDate: order.warrantyEndDate,
    } : undefined,
    payments: payments?.map(p => ({ method: p.method, amount: p.amount, date: formatDateTime(p.date) })),
  } : null

  if (isLoading) {
    return (
      <PageShell title="Loading..." description="">
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
    setEditDesc(order.description)
    setEditCost(String(order.cost))
    setEditStatus(order.status)
    setEditHasWarranty(order.hasWarranty ?? false)
    setEditWarrantyValue(String(order.warrantyValue ?? ''))
    setEditWarrantyUnit(order.warrantyUnit ?? 'hari')
    setEditItems(
      order.items?.map((i: NonNullable<typeof order.items>[number]) => ({
        id: crypto.randomUUID(),
        productId: i.productId,
        name: i.name,
        qty: String(i.qty),
        unitPrice: String(i.price),
      })) || []
    )
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEditing() {
    if (!order) return
    try {
      const customerName = editCustomer.trim()
      const customer = customerName
        ? await localDb.customers.where('[tenantId+name]').equals([tenantId, customerName]).first()
        : undefined

      let updatedTimeline = order.timeline || []
      const nowIso = new Date().toISOString()

      if (editStatus !== order.status) {
        updatedTimeline = [
          ...updatedTimeline,
          {
            id: crypto.randomUUID(),
            status: editStatus,
            date: nowIso,
            note: `Status diubah menjadi ${editStatus}`,
          }
        ]
      }

      let warrantyStartDate = order.warrantyStartDate
      let warrantyEndDate = order.warrantyEndDate

      if (editStatus === 'Selesai' && editHasWarranty) {
        if (!order.warrantyStartDate) {
          warrantyStartDate = nowIso
        }
        const prevHasWarranty = order.hasWarranty
        const prevVal = order.warrantyValue
        const prevUnit = order.warrantyUnit
        
        const val = Number(editWarrantyValue) || 0
        if (!prevHasWarranty || val !== prevVal || editWarrantyUnit !== prevUnit || !order.warrantyEndDate) {
          warrantyEndDate = addWarrantyDuration(warrantyStartDate ?? nowIso, val, editWarrantyUnit)
          const mode = !prevHasWarranty ? 'created' : 'updated'
          updatedTimeline = [
            ...updatedTimeline,
            {
              id: crypto.randomUUID(),
              status: editStatus,
              date: nowIso,
              note: buildWarrantyTimelineNote({ value: val, unit: editWarrantyUnit, mode, endDate: warrantyEndDate }),
              type: 'warranty',
            }
          ]
        }
      } else if (!editHasWarranty && order.hasWarranty) {
        warrantyStartDate = undefined
        warrantyEndDate = undefined
        updatedTimeline = [
          ...updatedTimeline,
          {
            id: crypto.randomUUID(),
            status: editStatus,
            date: nowIso,
            note: buildWarrantyTimelineNote({ value: 0, unit: 'hari', mode: 'removed' }),
            type: 'warranty',
          }
        ]
      }

      const finalItems = editItems.map(i => ({
        productId: i.productId ?? '',
        name: i.name,
        qty: Number(i.qty) || 1,
        price: Number(i.unitPrice) || 0,
        subtotal: (Number(i.qty) || 1) * (Number(i.unitPrice) || 0)
      }))
      const itemsCost = finalItems.reduce((acc, i) => acc + i.subtotal, 0)
      const finalCost = finalItems.length > 0 ? itemsCost : (Number(editCost) || 0)

      await serviceOrderRepository.upsert({
        ...order,
        customerId: customer?.id,
        customerName: customerName,
        description: editDesc.trim(),
        cost: finalCost,
        items: finalItems.length > 0 ? finalItems : undefined,
        status: editStatus as typeof order.status,
        hasWarranty: editHasWarranty,
        warrantyValue: editHasWarranty ? Number(editWarrantyValue) || undefined : undefined,
        warrantyUnit: editHasWarranty ? editWarrantyUnit : undefined,
        warrantyStartDate,
        warrantyEndDate,
        timeline: updatedTimeline,
        version: order.version + 1,
        updatedAt: nowIso,
      })
      toast.success('Service order diperbarui')
      setEditing(false)
      refetch()
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!order) return
    try {
      await serviceOrderRepository.remove(order.id)
      toast.success('Service order dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleAddPayment() {
    if (!order || payAmount <= 0) return
    try {
      await recordServiceOrderPayment(order.id, payAmount, payMethod, 'Service Order', tenantId)
      toast.success('Pembayaran berhasil ditambahkan')
      setPaymentOpen(false)
    } catch (error) {
      toast.error(`Gagal menambah pembayaran: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleWhatsApp() {
    if (!order) return
    const customer = order.customerId
      ? await localDb.customers.get(order.customerId)
      : (await localDb.customers.where('[tenantId+name]').equals([tenantId, order.customerName]).toArray())[0]
    const phone = customer?.tenantId === tenantId ? customer.phone : ''
    if (!phone) {
      toast.error('Nomor WhatsApp pelanggan tidak ditemukan')
      return
    }

    const templateType = order.status === 'Selesai' || order.status === 'Diambil' 
      ? 'service_order_selesai' 
      : 'service_order_masuk'

    const text = await messageTemplateService.render(templateType, {
      code: order.code,
      customer_name: order.customerName,
      device: order.description.split('\n')[0] || order.description,
      problem: order.description,
      status: order.status,
      cost: formatCurrency(order.cost),
      estimated_completion: order.estimatedCompletion ? new Date(order.estimatedCompletion).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-',
      date: formatDateTime(order.date),
      total: formatCurrency(order.cost),
      paid: formatCurrency(totalPaid),
      remaining: formatCurrency(remaining),
      items: order.items?.map(i => `- ${i.name} (${i.qty})`).join('\n') || '',
      change: '',
      payment_method: '',
      store_name: '',
    })

    window.open(buildWhatsAppLink(phone, text), '_blank')
  }

  if (!order) {
    return (
      <PageShell title="Tidak Ditemukan" description="Service Order tidak ditemukan">
        <Button asChild variant="outline">
          <Link to="/service-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar
          </Link>
        </Button>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={order.code}
      description={`${order.customerName} · ${order.date}`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => serviceData && printPdf(serviceData)}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => serviceData && downloadPdf(serviceData, `Service-${order?.code || 'download'}`)}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={handleWhatsApp}>
            <MessageSquare className="mr-2 h-4 w-4" />
            WA
          </Button>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                <XIcon className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button size="sm" onClick={saveEditing}>
                <CheckIcon className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Ubah
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          
          {/* Detail Pekerjaan */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              Detail Pekerjaan
            </h3>
            <div className="rounded-2xl border p-5 shadow-sm bg-card space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pelanggan</p>
                  {editing ? (
                    <Input value={editCustomer} onChange={e => setEditCustomer(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="font-medium text-base">{order.customerName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                  <p className="font-medium text-base">{order.date}</p>
                </div>
                {order.estimatedCompletion && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estimasi Selesai</p>
                    <p className="font-medium text-base">{new Date(order.estimatedCompletion).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kerusakan / Pekerjaan</p>
                {editing ? (
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                  />
                ) : (
                  <p className="text-sm font-medium whitespace-pre-wrap">{order.description}</p>
                )}
              </div>
              {order.notes && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Catatan Tambahan</p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Daftar Produk / Item Biaya */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Item Produk / Jasa yang Dipakai</h3>
            <div className="rounded-2xl border p-5 shadow-sm bg-card">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <div className="hidden sm:block rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Nama</TableHead>
                          <TableHead className="text-right w-20">Qty</TableHead>
                          <TableHead className="text-right w-28">Harga</TableHead>
                          <TableHead className="text-right w-28">Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editItems.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="py-1.5 px-2">
                              <Input value={item.name} onChange={e => { const newItems = [...editItems]; newItems[idx].name = e.target.value; setEditItems(newItems) }} placeholder="Nama produk" className="h-8 text-sm" />
                            </TableCell>
                            <TableCell className="py-1.5 px-2">
                              <Input value={item.qty} onChange={e => { const newItems = [...editItems]; newItems[idx].qty = e.target.value; setEditItems(newItems) }} inputMode="numeric" className="h-8 text-sm text-right" />
                            </TableCell>
                            <TableCell className="py-1.5 px-2">
                              <Input value={item.unitPrice} onChange={e => { const newItems = [...editItems]; newItems[idx].unitPrice = e.target.value; setEditItems(newItems) }} inputMode="numeric" className="h-8 text-sm text-right" />
                            </TableCell>
                            <TableCell className="py-1.5 px-3 text-right font-medium">{(Number(item.qty) || 0) * (Number(item.unitPrice) || 0) > 0 ? formatCurrency((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)) : '-'}</TableCell>
                            <TableCell className="py-1.5 px-2">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}>
                                <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-col gap-3 sm:hidden">
                    {editItems.map((item, idx) => {
                      const itemSubtotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
                      return (
                        <div key={item.id} className="rounded-xl border bg-muted/20 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}>
                              <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                          <Input value={item.name} onChange={e => { const newItems = [...editItems]; newItems[idx].name = e.target.value; setEditItems(newItems) }} placeholder="Nama produk" className="h-8 text-sm" />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Qty</span>
                              <Input value={item.qty} onChange={e => { const newItems = [...editItems]; newItems[idx].qty = e.target.value; setEditItems(newItems) }} inputMode="numeric" className="h-8 text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Harga</span>
                              <Input value={item.unitPrice} onChange={e => { const newItems = [...editItems]; newItems[idx].unitPrice = e.target.value; setEditItems(newItems) }} inputMode="numeric" className="h-8 text-sm" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-muted-foreground">Subtotal</span>
                            <span className="text-sm font-medium">{itemSubtotal > 0 ? formatCurrency(itemSubtotal) : '-'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="self-start">
                        <PlusIcon className="mr-1 h-3.5 w-3.5" />Tambah Produk / Jasa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Pilih Produk / Jasa</DialogTitle>
                      </DialogHeader>
                      <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari produk / jasa..."
                          className="pl-8"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
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
                                setEditItems(prev => [...prev, { id: crypto.randomUUID(), name: p.name, qty: '1', unitPrice: String(p.price) }])
                                toast.success(`${p.name} ditambahkan`)
                                setIsProductModalOpen(false)
                              }}
                            >
                              Tambah
                            </Button>
                          </div>
                        ))}
                        {filteredProducts.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-8">Tidak ada item ditemukan</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="secondary" className="w-full" onClick={() => {
                          setEditItems(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: '1', unitPrice: '' }])
                          setIsProductModalOpen(false)
                        }}>
                          + Tambah Item Manual
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                (!order.items || order.items.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada rincian item (Hanya biaya total)</p>
                ) : (
                  <div className="space-y-3">
                    {order.items.map(item => (
                      <div key={item.productId || crypto.randomUUID()} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.qty}</p>
                        </div>
                        <p className="font-semibold text-sm">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Timeline Status */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Riwayat Status</h3>
            <div className="rounded-2xl border p-5 shadow-sm bg-card">
              {(!order.timeline || order.timeline.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat timeline</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {order.timeline.map((item: { id: string; status: string; date: string; note: string; type?: string }) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm ${item.type === 'warranty' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-primary bg-background text-primary'}`}>
                        {item.type === 'warranty' ? <ShieldCheck className="h-3 w-3" /> : null}
                      </div>
                      <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] border bg-background p-3 rounded-xl shadow-sm ${item.type === 'warranty' ? 'border-amber-200' : ''}`}>
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <StatusBadge label={item.type === 'warranty' ? 'Garansi' : item.status} tone={item.type === 'warranty' ? 'warning' : tone(item.status)} />
                          <time className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('id-ID')}</time>
                        </div>
                        <p className="text-sm mt-2 text-muted-foreground">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Status & Pembayaran */}
        <div className="space-y-4">
          <div className="rounded-2xl border p-5 shadow-sm bg-card space-y-4">
            <h3 className="font-semibold border-b pb-2">Status & Biaya</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status Pengerjaan</span>
              {editing ? (
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOrderStatusOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge label={order.status} tone={tone(order.status)} />
              )}
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Biaya Service</span>
              <span className="font-bold">
                {formatCurrency(
                  editing 
                    ? (editItems.length > 0 ? editItems.reduce((acc, i) => acc + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0) : Number(editCost) || 0) 
                    : order.cost
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-primary pt-2 border-t border-dashed">
              <span className="font-medium">Sudah Dibayar</span>
              <span className="font-bold">{formatCurrency(totalPaid)}</span>
            </div>
            
            {remaining > 0 ? (
              <div className="flex justify-between items-center text-destructive pt-2">
                <span className="font-medium">Kekurangan (Sisa)</span>
                <span className="font-bold text-lg">{formatCurrency(remaining)}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-success pt-2">
                <span className="font-medium">Status Bayar</span>
                <span className="font-bold text-lg">LUNAS</span>
              </div>
            )}
            
            {remaining > 0 && !editing && (
              <Button className="w-full mt-4" onClick={() => {
                setPayAmount(remaining)
                setPaymentOpen(true)
              }}>
                <CreditCard className="mr-2 h-4 w-4" />
                Terima Pembayaran
              </Button>
            )}

            {/* Garansi */}
            <div className="border-t border-dashed pt-3 mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Garansi Service</span>
                {editing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="edit-warranty"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={editHasWarranty}
                      onChange={(e) => setEditHasWarranty(e.target.checked)}
                    />
                    {editHasWarranty && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          className="h-7 w-14 text-sm"
                          value={editWarrantyValue}
                          onChange={(e) => setEditWarrantyValue(e.target.value)}
                        />
                        <Select value={editWarrantyUnit} onValueChange={(v) => setEditWarrantyUnit(v as 'hari' | 'bulan' | 'tahun')}>
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue placeholder="Pilih..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hari">Hari</SelectItem>
                            <SelectItem value="bulan">Bln</SelectItem>
                            <SelectItem value="tahun">Thn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ) : order.hasWarranty ? (
                  <div className="flex items-center gap-1.5">
                    {order.warrantyEndDate && isWarrantyExpired(order.warrantyEndDate) ? (
                      <>
                        <ShieldX className="h-4 w-4 text-destructive" />
                        <span className="text-xs text-destructive font-medium">Kadaluarsa</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">
                          {order.warrantyValue} {order.warrantyUnit}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Tidak ada</span>
                )}
              </div>
              {order.hasWarranty && order.warrantyEndDate && !editing && (
                <div className="text-xs text-muted-foreground">
                  Berlaku sampai {new Date(order.warrantyEndDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Pembayaran */}
          {payments && payments.length > 0 && (
            <div className="rounded-2xl border p-5 shadow-sm bg-card space-y-3">
              <h3 className="font-semibold border-b pb-2">Riwayat Pembayaran</h3>
              {payments.map(p => (
                <div key={p.id} className="flex justify-between text-sm py-2 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium capitalize">{p.method}</p>
                    <p className="text-xs text-muted-foreground">{p.date}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus service order</DialogTitle>
            <DialogDescription>Service order {order.code} akan dihapus secara permanen dari sistem.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terima Pembayaran</DialogTitle>
            <DialogDescription>Masukkan nominal yang dibayar oleh pelanggan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm">
              <span>Sisa Tagihan</span>
              <span className="font-bold text-destructive">{formatCurrency(remaining)}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Metode</label>
              <div className="grid grid-cols-3 gap-2">
                {activeMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={payMethod === method.name.toLowerCase() ? 'default' : 'outline'}
                    onClick={() => setPayMethod(method.name.toLowerCase())}
                    size="sm"
                  >
                    {method.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal Dibayar</label>
              <Input 
                type="number"
                value={payAmount || ''}
                onChange={e => setPayAmount(Number(e.target.value) || 0)}
                className="text-lg font-bold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Batal</Button>
            <Button onClick={handleAddPayment} disabled={payAmount <= 0}>Simpan Pembayaran</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageShell>
  )
}
