import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, Download, CreditCard, PlusIcon, Trash2Icon, PencilIcon, XIcon, CheckIcon } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { useSalesOrder } from '@/features/sales-orders/hooks/use-sales-order'
import { deleteSalesOrder, recordSalesOrderPayment } from '@/features/sales-orders/services/sales-order-finance.service'
import { salesOrderRepository } from '@/services/local-db/repository'
import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'

function tone(status: string) {
  if (status === 'Lunas') return 'success'
  if (status === 'Sebagian') return 'warning'
  if (status === 'Belum Bayar') return 'danger'
  return 'neutral'
}

type EditableItem = { id: string; name: string; qty: string; unitPrice: string }

export function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, refetch } = useSalesOrder(id)
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState<EditableItem[]>([])
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('tunai')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { downloadPdf, printPdf } = usePdf()

  const invoiceCustomer = useLiveQuery(
    () => order?.customerId ? localDb.customers.get(order.customerId) : undefined,
    [order?.customerId],
  )

  const invoiceData: PdfData | null = order ? {
    type: 'invoice',
    code: order.code,
    date: order.date,
    customer: { name: order.customerName, phone: invoiceCustomer?.phone },
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
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEditing() {
    if (!order) return
    try {
      const items = editItems.map(i => {
        const qty = Number(i.qty) || 0
        const unitPrice = Number(i.unitPrice) || 0
        return { ...i, qty, unitPrice, subtotal: qty * unitPrice }
      })
      const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
      const grandTotal = subtotal - order.discountTotal + order.taxTotal

      await salesOrderRepository.upsert({
        ...order,
        items: items.map(i => ({
          id: i.id,
          tenantId: order.tenantId,
          salesOrderId: order.id,
          productId: order.items.find((item) => item.id === i.id)?.productId ?? '',
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        subtotal,
        grandTotal,
        version: order.version + 1,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Item diperbarui')
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

  async function handleReceivePayment() {
    if (!order) return
    const amount = Number(payAmount) || 0
    if (amount <= 0) return toast.error('Nominal pembayaran harus lebih dari 0')
    try {
      await recordSalesOrderPayment(order.id, amount, payMethod as 'tunai' | 'qris' | 'kartu' | 'transfer' | 'e-wallet' | 'piutang')
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
      date: order.date,
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

  const shortage = Math.max(0, order.grandTotal - order.paidTotal)
  const isPaid = shortage === 0
  type OrderItem = { name: string; unitPrice: number; qty: number; subtotal: number }
  type PaymentRow = { date: string; method: string; amount: number; status: string }

  const editSubtotal = editItems.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => invoiceData && printPdf(invoiceData)}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
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
      description={`${order.customerName} · ${order.date}`}
      actions={actionButtons}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
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
                <Button type="button" variant="ghost" size="sm" onClick={addItem} className="self-start">
                  <PlusIcon className="mr-1 h-3.5 w-3.5" />Tambah Item
                </Button>
              </div>
            ) : (
              <DataTable
                data={order.items?.map((i: OrderItem, idx: number) => ({ ...i, id: String(idx) })) || []}
                columns={[
                  { key: 'name', header: 'Item' },
                  { key: 'unitPrice', header: 'Harga', render: (row: OrderItem) => formatCurrency(row.unitPrice) },
                  { key: 'qty', header: 'Qty' },
                  { key: 'subtotal', header: 'Subtotal', render: (row: OrderItem) => formatCurrency(row.subtotal) },
                ]}
                emptyTitle="Belum ada item"
              />
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Pembayaran</h3>
            <DataTable
              data={order.payments?.map((p: PaymentRow, idx: number) => ({ ...p, id: String(idx) })) || []}
              emptyTitle="Belum ada pembayaran"
              columns={[
                { key: 'date', header: 'Tanggal', render: (row: PaymentRow) => new Date(row.date).toLocaleDateString('id-ID') },
                { key: 'method', header: 'Metode', render: (row: PaymentRow) => <span className="capitalize">{row.method}</span> },
                { key: 'amount', header: 'Nominal', render: (row: PaymentRow) => formatCurrency(row.amount) },
              ]}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge label={order.status} tone={tone(order.status)} />
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
              <span className="font-semibold text-green-600">{formatCurrency(order.paidTotal)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">{isPaid ? 'Status' : 'Sisa Tagihan'}</span>
              {isPaid ? (
                <StatusBadge label="Lunas" tone="success" />
              ) : (
                <span className="font-bold text-red-600 text-lg">{formatCurrency(shortage)}</span>
              )}
            </div>

            {shortage > 0 && (
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
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="kartu">Kartu</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
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
