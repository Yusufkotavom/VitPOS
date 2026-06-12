import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, Download, CreditCard, PlusIcon, Trash2Icon, PencilIcon, XIcon, CheckIcon, Search } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { usePdf } from '@/shared/components/pdf/use-pdf'
import type { PdfData } from '@/shared/components/pdf/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import { formatDate, formatDateTime } from '@/lib/date'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { usePurchase } from '@/features/purchases/hooks/use-purchase'
import { recordPurchasePayment } from '@/features/purchases/services/purchase-payment.service'
import { receivePurchaseOrder, syncSupplierPurchaseMetrics } from '@/features/purchases/services/purchase-receiving.service'
import { purchaseRepository } from '@/services/local-db/repository'

import { localDb } from '@/services/local-db/client'
import { messageTemplateService } from '@/services/message-template.service'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'

function tone(status: string) {
  if (status === 'Diterima') return 'success'
  if (status === 'Dikirim') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

type EditableItem = { id: string; name: string; qty: string; unitPrice: string }

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tenantId = requireActiveTenantId()
  const { data: order, isLoading, refetch } = usePurchase(id)
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState<EditableItem[]>([])
  
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
  const [payMethod, setPayMethod] = useState('tunai')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { downloadPdf, printPdf } = usePdf()

  const invoiceSupplier = useLiveQuery(
    () => order?.supplierId ? localDb.suppliers.get(order.supplierId) : undefined,
    [order?.supplierId],
  )

  const invoiceData: PdfData | null = order ? {
    type: 'invoice',
    code: order.code,
    date: formatDateTime(order.date),
    customer: { name: order.supplierName, phone: invoiceSupplier?.phone },
    items: order.items?.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice, subtotal: i.subtotal })) || [],
    summary: {
      subtotal: order.subtotal,
      discount: 0,
      grandTotal: order.grandTotal,
      paidTotal: order.paidTotal,
      change: Math.max(0, order.paidTotal - order.grandTotal),
      status: order.status,
    },
    notes: '',
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
      const grandTotal = subtotal

      await purchaseRepository.upsert({
        ...order,
        items: items.map(i => ({
          id: i.id,
          tenantId: order.tenantId,
          purchaseId: order.id,
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
      await recordPurchasePayment(order.id, amount, payMethod, 'Pembelian')
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
      const supplierId = order.supplierId
      await purchaseRepository.remove(order.id)
      if (supplierId) {
        await syncSupplierPurchaseMetrics(supplierId)
      }
      toast.success('PO dihapus')
      setDeleteOpen(false)
    } catch (error) {
      toast.error(`Gagal menghapus: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`)
    }
  }

  async function handleWhatsApp() {
    if (!order) return
    if (!order.supplierId) {
      toast.error('Supplier tidak memiliki nomor WhatsApp')
      return
    }
    const customer = await localDb.suppliers.get(order.supplierId)
    const phone = customer?.phone
    if (!phone) {
      toast.error('Nomor WhatsApp supplier tidak ditemukan')
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
      customer_name: order.supplierName,
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
      <PageShell title="Tidak Ditemukan" description="Purchase Order tidak ditemukan">
        <Button asChild variant="outline">
          <Link to="/purchases">
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
      {order.status !== 'Diterima' && order.status !== 'Batal' && (
        <Button variant="outline" size="sm" onClick={async () => {
          try {
            await receivePurchaseOrder(order)
            toast.success('Barang diterima')
            refetch()
          } catch(error) {
            toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
          }
        }}>
          Terima Barang
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => invoiceData && printPdf(invoiceData)}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={() => invoiceData && downloadPdf(invoiceData, `PO-${order?.code || 'download'}`)}>
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
      description={`${order.supplierName} · ${formatDate(order.date)}`}
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
                { key: 'date', header: 'Tanggal', render: (row: PaymentRow) => formatDate(row.date) },
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
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-semibold text-lg">{formatCurrency(editing ? editSubtotal : order.grandTotal)}</span>
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
                Bayar ke Supplier
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bayar ke Supplier</DialogTitle>
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
            <DialogTitle>Hapus PO</DialogTitle>
            <DialogDescription>Invoice {order.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
