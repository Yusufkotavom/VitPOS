import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, Download, CreditCard, PlusIcon, Trash2Icon, PencilIcon, XIcon, CheckIcon, Search, FileText } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { formatDate, formatDateTime, toWibDateInput, wibDateToIso } from '@/lib/date'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { useSalesOrder } from '@/features/sales-orders/hooks/use-sales-order'
import { deleteSalesOrder, recordSalesOrderPayment, syncCustomerSalesMetrics } from '@/features/sales-orders/services/sales-order-finance.service'
import { salesOrderRepository } from '@/services/local-db/repository'
import { localDb } from '@/services/local-db/client'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import { messageTemplateService } from '@/services/message-template.service'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { ReceiptPrintLayout } from '@/features/pos/components/receipt-print-layout'
import type { PosOrderSummary } from '@/features/pos/types/pos-order.types'
import type { LocalPayment, LocalSalesOrder, PosPaymentMethodCode } from '@/services/local-db/schema'
import { printPage } from '@/lib/print'

function tone(status: string) {
  if (status === 'Lunas') return 'success'
  if (status === 'Sebagian') return 'warning'
  if (status === 'Belum Bayar') return 'danger'
  return 'neutral'
}

type EditableItem = { id: string; name: string; qty: string; unitPrice: string }

type EditablePayment = { id: string; date: string; amount: string; method: string; notes: string }

export function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tenantId = requireActiveTenantId()
  const { data: order, isLoading, refetch } = useSalesOrder(id)
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState<EditableItem[]>([])
  const [editPayments, setEditPayments] = useState<EditablePayment[]>([])
  const [editCode, setEditCode] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  
  // Product dialog states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const products = useLiveQuery(() => localDb.products.where('tenantId').equals(tenantId).toArray(), [tenantId], [])
  const filteredProducts = products.filter(p => {
    if (p.status !== 'Aktif') return false
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false
    return true
  })

  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { downloadPdf, printPdf } = usePdf()

  const dbMethods = usePaymentMethods()
  const activeMethods = dbMethods && dbMethods.length > 0 
    ? dbMethods.filter(m => m.status === 'Aktif') 
    : [
        { id: 'tunai', name: 'Tunai' },
        { id: 'qris', name: 'QRIS' },
        { id: 'transfer', name: 'Transfer' }
      ]

  const invoiceCustomer = useLiveQuery(
    () => order?.customerId ? localDb.customers.get(order.customerId) : undefined,
    [order?.customerId],
  )

  const invoiceData: PdfData | null = order ? {
    type: 'invoice',
    code: order.code,
    date: formatDateTime(order.date),
    customer: { name: order.customerName, phone: invoiceCustomer?.phone, address: invoiceCustomer?.address },
    items: order.items?.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice, subtotal: i.subtotal })) || [],
    summary: {
      subtotal: order.subtotal,
      discount: order.discountTotal,
      grandTotal: order.grandTotal,
      paidTotal: order.paidTotal,
      change: Math.max(0, order.paidTotal - order.grandTotal),
      status: order.status,
    },
    notes: order.notes || '',
    payments: order.payments?.map(p => ({ method: p.method, amount: p.amount, date: formatDateTime(p.date) })),
  } : null

  const salesOrderData: PdfData | null = order ? {
    type: 'sales-order',
    code: order.code,
    date: formatDateTime(order.date),
    customer: { name: order.customerName, phone: invoiceCustomer?.phone, address: invoiceCustomer?.address },
    items: order.items?.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice, subtotal: i.subtotal })) || [],
    summary: {
      subtotal: order.subtotal,
      discount: order.discountTotal,
      grandTotal: order.grandTotal,
    },
    notes: order.notes || '',
  } : null

  const deliveryNoteData: PdfData | null = order ? {
    type: 'delivery-note',
    code: `${order.code}-SJ`,
    date: formatDateTime(order.date),
    customer: { name: order.customerName, phone: invoiceCustomer?.phone, address: invoiceCustomer?.address },
    items: order.items?.map(i => ({ name: i.name, qty: i.qty })) || [],
    notes: order.notes || '',
  } : null

  if (isLoading) {
    return (
      <PageShell title="Loading..." description="">
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    )
  }

  function startEditing() {
    if (!order) return
    setEditItems(order.items.map(i => ({ id: i.id, name: i.name, qty: String(i.qty), unitPrice: String(i.unitPrice) })))
    setEditPayments((order.payments || []).map(p => ({ id: p.id, date: toWibDateInput(p.date), amount: String(p.amount), method: p.method, notes: p.notes ?? '' })))
    setEditCode(order.code)
    setEditDate(toWibDateInput(order.date))
    setEditNotes(order.notes ?? '')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEditing() {
    if (!order) return
    try {
      const code = editCode.trim()
      if (!code) {
        toast.error('Nomor invoice wajib diisi')
        return
      }

      const items = editItems.map(i => {
        const qty = Number(i.qty) || 0
        const unitPrice = Number(i.unitPrice) || 0
        return { ...i, qty, unitPrice, subtotal: qty * unitPrice }
      })
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
      const grandTotal = subtotal - order.discountTotal + order.taxTotal

      const payments = editPayments.map(p => ({
        id: p.id,
        date: wibDateToIso(p.date),
        amount: Number(p.amount) || 0,
        method: p.method || 'tunai',
        notes: p.notes.trim(),
      }))
      const paidTotal = payments.reduce((s, p) => s + p.amount, 0)

      let newStatus = order.status
      if (newStatus !== 'Batal' && newStatus !== 'Draft') {
        if (paidTotal >= grandTotal && grandTotal > 0) newStatus = 'Lunas'
        else if (paidTotal > 0) newStatus = 'Sebagian'
        else newStatus = 'Belum Bayar'
      }

      const tenantId = order.tenantId
      const updatedOrder: LocalSalesOrder = {
        ...order,
        code,
        date: wibDateToIso(editDate) || order.date,
        notes: editNotes.trim() || undefined,
        items: items.map(i => ({
          id: i.id,
          tenantId,
          salesOrderId: order.id,
          productId: order.items.find((item) => item.id === i.id)?.productId ?? '',
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        subtotal,
        grandTotal,
        paidTotal,
        status: newStatus,
        version: order.version + 1,
        updatedAt: new Date().toISOString(),
      }

      const existingPayments = await localDb.payments.where('tenantId').equals(tenantId).toArray()
      const linkedPayments = existingPayments.filter(p => p.salesOrderId === order.id)
      const keptIds = new Set(payments.map(p => p.id))
      const nowIso = new Date().toISOString()

      await localDb.transaction('rw', [localDb.salesOrders, localDb.salesOrderItems, localDb.payments, localDb.outbox], async () => {
        for (const removed of linkedPayments.filter(p => !keptIds.has(p.id))) {
          await enqueueOutboxItem({ entityType: 'payment', entityId: removed.id, mutationType: 'delete', payload: removed })
          await localDb.payments.delete(removed.id)
        }
        for (const p of payments) {
          const existing = linkedPayments.find(lp => lp.id === p.id)
          const payment: LocalPayment = {
            id: existing?.id ?? `pay-${crypto.randomUUID()}`,
            tenantId,
            ref: existing?.ref ?? `PAY-${Date.now().toString().slice(-6)}`,
            salesOrderId: order.id,
            source: existing?.source ?? 'Invoice',
            method: p.method as PosPaymentMethodCode,
            amount: p.amount,
            date: p.date,
            notes: p.notes || undefined,
            status: existing?.status ?? 'Berhasil',
            syncStatus: 'pending',
            version: (existing?.version ?? 0) + 1,
            updatedAt: nowIso,
          }
          await enqueueOutboxItem({ entityType: 'payment', entityId: payment.id, mutationType: existing ? 'update' : 'create', payload: payment })
          await localDb.payments.put(payment)
        }
        await salesOrderRepository.upsert(updatedOrder)
      })

      await syncCustomerSalesMetrics(updatedOrder.customerId, tenantId)
      toast.success('Invoice diperbarui')
      setEditing(false)
      refetch()
    } catch (error) {
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  function addItem() {
    setEditItems(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: '1', unitPrice: '0' }])
  }

  function removeItem(idx: number) {
    setEditItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof EditableItem, value: string) {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function addPaymentRow() {
    setEditPayments(prev => [...prev, { id: crypto.randomUUID(), date: toWibDateInput(new Date().toISOString()), amount: '0', method: activeMethods[0]?.name.toLowerCase() || 'tunai', notes: '' }])
  }

  function removePaymentRow(idx: number) {
    setEditPayments(prev => prev.filter((_, i) => i !== idx))
  }

  function updatePayment(idx: number, field: keyof EditablePayment, value: string) {
    setEditPayments(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleReceivePayment() {
    if (!order) return
    const amount = Number(payAmount) || 0
    if (amount <= 0) return toast.error('Nominal pembayaran harus lebih dari 0')
    const methodToUse = payMethod || (activeMethods[0]?.name.toLowerCase()) || 'tunai'
    try {
      await recordSalesOrderPayment(order.id, amount, methodToUse as 'tunai' | 'qris' | 'kartu' | 'transfer' | 'e-wallet' | 'piutang')
      toast.success(`Pembayaran Rp ${amount.toLocaleString('id-ID')} diterima`)
      setPayOpen(false)
      setPayAmount('')
      refetch()
    } catch (error) {
      toast.error(`Gagal memproses pembayaran: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleDelete() {
    if (!order) return
    try {
      await deleteSalesOrder(order.id)
      toast.success('Invoice dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleWhatsApp() {
    if (!order) return
    if (!order.customerId) {
      toast.error('Pelanggan tidak memiliki nomor WhatsApp')
      return
    }
    const customer = await localDb.customers.get(order.customerId)
    const phone = customer?.phone
    if (!phone) {
      toast.error('Nomor WhatsApp pelanggan tidak ditemukan')
      return
    }

    const total = formatCurrency(order.grandTotal)
    const paid = formatCurrency(order.paidTotal)
    const remaining = formatCurrency(Math.max(0, order.grandTotal - order.paidTotal))

    const items = order.items
      .map((item) => `${item.name} x${item.qty} = ${formatCurrency(item.subtotal)}`)
      .join('\n')

    const text = await messageTemplateService.render('invoice', {
      code: order.code,
      date: formatDateTime(order.date),
      customer_name: order.customerName,
      items,
      total,
      paid,
      remaining,
      status: order.status,
      change: 'Rp 0',
      payment_method: order.payments?.[0]?.method ?? '',
      store_name: '',
    })

    window.open(buildWhatsAppLink(phone, text), '_blank')
  }

  if (!order) {
    return (
      <PageShell title="Tidak Ditemukan" description="Sales Order tidak ditemukan">
        <Button asChild variant="outline">
          <Link to="/sales-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar
          </Link>
        </Button>
      </PageShell>
    )
  }

  const editSubtotal = editItems.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
  const editGrandTotal = editing ? editSubtotal - order.discountTotal + order.taxTotal : order.grandTotal
  const editPaid = editing ? editPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0) : order.paidTotal
  const shortage = Math.max(0, editGrandTotal - editPaid)
  const isPaid = shortage === 0

  const receiptOrder: PosOrderSummary | null = order ? {
    id: order.id,
    code: order.code,
    date: new Date(order.date),
    subtotal: order.subtotal,
    tax: order.taxTotal,
    discount: order.discountTotal,
    total: order.grandTotal,
    paymentMethod: order.payments?.[0]?.method || 'tunai',
    amountPaid: order.paidTotal,
    change: Math.max(0, order.paidTotal - order.grandTotal),
    items: order.items.map(i => ({
      productId: i.productId,
      name: i.name,
      qty: i.qty,
      price: i.unitPrice,
      subtotal: i.subtotal,
    })),
    customerId: order.customerId,
    customerName: order.customerName,
    cashierName: 'Kasir',
  } : null

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {receiptOrder && <ReceiptPrintLayout order={receiptOrder} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={printPage}>
            <Printer className="mr-2 h-4 w-4" />
            Struk (Thermal)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => invoiceData && printPdf(invoiceData)}>
            <FileText className="mr-2 h-4 w-4" />
            Invoice (A4)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => salesOrderData && printPdf(salesOrderData)}>
            <FileText className="mr-2 h-4 w-4" />
            Sales Order (A4)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deliveryNoteData && printPdf(deliveryNoteData)}>
            <FileText className="mr-2 h-4 w-4" />
            Surat Jalan (A4)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={() => invoiceData && downloadPdf(invoiceData, `Invoice-${order?.code || 'download'}`)}>
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
  )

  return (
    <PageShell
      title={order.code}
      description={`${order.customerName} · ${formatDate(order.date)}`}
      actions={actionButtons}
    >
      <div className="min-w-0 grid gap-6 md:grid-cols-3">
        <div className="min-w-0 space-y-6 md:col-span-2">
          {editing && (
            <div className="rounded-lg border bg-background p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Info Invoice</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Nomor Invoice</label>
                  <Input value={editCode} onChange={e => setEditCode(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Invoice</label>
                  <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <label className="text-xs font-medium text-muted-foreground">Catatan</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="min-h-[3.5rem] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Catatan yang tampil di invoice..."
                />
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Item Pesanan</h3>
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
                            <Input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Nama produk" className="h-8 text-sm" />
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <Input value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} inputMode="numeric" className="h-8 text-sm text-right" />
                          </TableCell>
                          <TableCell className="py-1.5 px-2">
                            <Input value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} inputMode="numeric" className="h-8 text-sm text-right" />
                          </TableCell>
                          <TableCell className="py-1.5 px-3 text-right font-medium">{(Number(item.qty) || 0) * (Number(item.unitPrice) || 0) > 0 ? formatCurrency((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)) : '-'}</TableCell>
                          <TableCell className="py-1.5 px-2">
                            {editItems.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
                                <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
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
                          {editItems.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                              <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <Input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Nama produk" className="h-8 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Qty</span>
                            <Input value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} inputMode="numeric" className="h-8 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Harga</span>
                            <Input value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} inputMode="numeric" className="h-8 text-sm" />
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
                      <PlusIcon className="mr-1 h-3.5 w-3.5" />Tambah Produk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Pilih Produk</DialogTitle>
                    </DialogHeader>
                    <div className="relative mt-2">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari produk..."
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
                        <p className="text-center text-sm text-muted-foreground py-8">Tidak ada produk ditemukan</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="secondary" className="w-full" onClick={() => {
                        addItem()
                        setIsProductModalOpen(false)
                      }}>
                        + Tambah Item Manual
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="min-w-0 rounded-lg border bg-background">
                <div className="border-b px-3 py-2 text-xs text-muted-foreground sm:hidden">
                  Geser ke kanan untuk lihat semua kolom
                </div>
                <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Item</TableHead>
                        <TableHead className="w-28 text-right">Harga</TableHead>
                        <TableHead className="w-20 text-right">Qty</TableHead>
                        <TableHead className="w-32 text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(order.items || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                            Belum ada item
                          </TableCell>
                        </TableRow>
                      ) : (
                        (order.items || []).map((item, idx) => (
                          <TableRow key={item.id ?? idx}>
                            <TableCell className="font-medium whitespace-normal">{item.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Pembayaran</h3>
            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="min-w-0 rounded-lg border bg-background">
                  <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="w-36">Tanggal</TableHead>
                          <TableHead className="w-32">Metode</TableHead>
                          <TableHead className="w-36 text-right">Nominal</TableHead>
                          <TableHead>Catatan</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                              Belum ada pembayaran
                            </TableCell>
                          </TableRow>
                        ) : (
                          editPayments.map((payment, idx) => (
                            <TableRow key={payment.id}>
                              <TableCell className="py-1.5 px-2">
                                <Input type="date" value={payment.date} onChange={e => updatePayment(idx, 'date', e.target.value)} className="h-8 text-sm" />
                              </TableCell>
                              <TableCell className="py-1.5 px-2">
                                <Select value={payment.method} onValueChange={value => updatePayment(idx, 'method', value)}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Metode" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[...activeMethods, ...(activeMethods.some((m: { id: string; name: string }) => m.name.toLowerCase() === payment.method) ? [] : [{ id: payment.method, name: payment.method }])].map((m: { id: string; name: string }) => (
                                      <SelectItem key={m.id} value={m.name.toLowerCase()}>{m.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="py-1.5 px-2">
                                <Input value={payment.amount} onChange={e => updatePayment(idx, 'amount', e.target.value)} inputMode="numeric" className="h-8 text-sm text-right" />
                              </TableCell>
                              <TableCell className="py-1.5 px-2">
                                <Input value={payment.notes} onChange={e => updatePayment(idx, 'notes', e.target.value)} placeholder="Catatan pembayaran" className="h-8 text-sm" />
                              </TableCell>
                              <TableCell className="py-1.5 px-2">
                                {editPayments.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePaymentRow(idx)}>
                                    <Trash2Icon className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={addPaymentRow}>
                  <PlusIcon className="mr-1 h-3.5 w-3.5" />Tambah Pembayaran
                </Button>
              </div>
            ) : (
              <div className="min-w-0 rounded-lg border bg-background">
                <div className="border-b px-3 py-2 text-xs text-muted-foreground sm:hidden">
                  Geser ke kanan untuk lihat semua kolom
                </div>
                <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
                  <Table className="min-w-[520px]">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead className="w-32 text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(order.payments || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                            Belum ada pembayaran
                          </TableCell>
                        </TableRow>
                      ) : (
                        (order.payments || []).map((payment, idx) => (
                          <TableRow key={`${payment.date}-${payment.method}-${idx}`}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell className="capitalize">{payment.method}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              {editing ? (
                <StatusBadge label={isPaid ? 'Lunas' : editPaid > 0 ? 'Sebagian' : 'Belum Bayar'} tone={isPaid ? 'success' : editPaid > 0 ? 'warning' : 'danger'} />
              ) : (
                <StatusBadge label={order.status} tone={tone(order.status)} />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(editing ? editSubtotal : order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Diskon</span>
                <span className="font-medium text-red-600">-{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
            {order.taxTotal > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pajak</span>
                <span className="font-medium">+{formatCurrency(order.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-semibold text-lg">{formatCurrency(editing ? editSubtotal - order.discountTotal + order.taxTotal : order.grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dibayar</span>
              <span className="font-semibold text-green-600">{formatCurrency(editPaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">{isPaid ? 'Status' : 'Sisa Tagihan'}</span>
              {isPaid ? (
                <StatusBadge label="Lunas" tone="success" />
              ) : (
                <span className="font-bold text-red-600 text-lg">{formatCurrency(shortage)}</span>
              )}
            </div>

            {shortage > 0 && !editing && (
              <Button className="w-full" onClick={() => setPayOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Terima Pembayaran
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Pembayaran</DialogTitle>
            <DialogDescription>Invoice {order.code} - Sisa tagihan {formatCurrency(shortage)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Metode</label>
              <Select value={payMethod || activeMethods[0]?.name.toLowerCase()} onValueChange={setPayMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  {activeMethods.map((m: { id: string; name: string }) => (
                    <SelectItem key={m.id} value={m.name.toLowerCase()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nominal</label>
              <Input
                inputMode="numeric"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={`Maksimal ${formatCurrency(shortage)}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Batal</Button>
            <Button onClick={handleReceivePayment}>Bayar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus invoice</DialogTitle>
            <DialogDescription>Invoice {order.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
