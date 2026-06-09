import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, Download, PencilIcon, XIcon, CheckIcon, Trash2Icon, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { useServiceOrder } from '@/features/service-orders/hooks/use-service-order'
import { serviceOrderRepository } from '@/services/local-db/repository'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { serviceOrderStatusOptions } from '@/features/service-orders/schemas/service-order-form-schema'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import type { PosPaymentMethodCode, OutboxItem } from '@/services/local-db/schema'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

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
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Pelunasan State
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('tunai')

  const { downloadPdf, printPdf } = usePdf()

  const serviceData: PdfData | null = order ? {
    type: 'service',
    code: order.code,
    date: order.date,
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
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEditing() {
    if (!order) return
    const customerName = editCustomer.trim()
    const customer = customerName
      ? await localDb.customers.where('[tenantId+name]').equals([tenantId, customerName]).first()
      : undefined

    let updatedTimeline = order.timeline || []
    if (editStatus !== order.status) {
      updatedTimeline = [
        ...updatedTimeline,
        {
          id: crypto.randomUUID(),
          status: editStatus,
          date: new Date().toISOString(),
          note: `Status diubah menjadi ${editStatus}`,
        }
      ]
    }

    await serviceOrderRepository.upsert({
      ...order,
      customerId: customer?.id,
      customerName: customerName,
      description: editDesc.trim(),
      cost: Number(editCost) || 0,
      status: editStatus as typeof order.status,
      timeline: updatedTimeline,
      version: order.version + 1,
      updatedAt: new Date().toISOString(),
    })
    toast.success('Service order diperbarui')
    setEditing(false)
    refetch()
  }

  async function handleDelete() {
    if (!order) return
    await serviceOrderRepository.remove(order.id)
    toast.success('Service order dihapus')
    setDeleteOpen(false)
  }

  async function handleAddPayment() {
    if (!order || payAmount <= 0) return
    
    const nowIso = new Date().toISOString()
    const paymentId = `pay-${crypto.randomUUID()}`
    
    const payment = {
      id: paymentId,
      tenantId,
      ref: `PAY-SRV-${Date.now().toString().slice(-6)}`,
      serviceOrderId: order.id,
      source: 'SERVICE',
      method: payMethod as PosPaymentMethodCode,
      amount: payAmount,
      date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
      status: 'Berhasil' as const,
      syncStatus: 'pending' as const,
      version: 1,
      updatedAt: nowIso,
    }

    const outboxItem: OutboxItem = {
      id: `outbox-${crypto.randomUUID()}`,
      entityType: 'payment',
      entityId: paymentId,
      mutationType: 'create',
      payload: payment,
      status: 'queued',
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    await localDb.transaction('rw', [localDb.payments, localDb.outbox], async () => {
      await localDb.payments.put(payment)
      await localDb.outbox.put(outboxItem)
    })
    
    toast.success('Pembayaran berhasil ditambahkan')
    setPaymentOpen(false)
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
      date: order.date,
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
        <div className="flex items-center gap-2">
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
        </div>
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
              {(!order.items || order.items.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada rincian item (Hanya biaya total)</p>
              ) : (
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.qty}</p>
                      </div>
                      <p className="font-semibold text-sm">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
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
                  {order.timeline.map((item: { id: string; status: string; date: string; note: string }) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary bg-background text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm" />
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] border bg-background p-3 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <StatusBadge label={item.status} tone={tone(item.status)} />
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
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                >
                  {serviceOrderStatusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <StatusBadge label={order.status} tone={tone(order.status)} />
              )}
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Biaya Service</span>
              <span className="font-bold">{formatCurrency(editing ? Number(editCost) || 0 : order.cost)}</span>
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
