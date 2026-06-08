import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format-currency'
import { useSalesOrder } from '@/features/sales-orders/hooks/use-sales-order'
import { ContentCard } from '@/shared/components/display/content-card'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'

function tone(status: string) {
  if (status === 'Lunas') return 'success'
  if (status === 'Sebagian') return 'warning'
  if (status === 'Belum Bayar') return 'danger'
  return 'neutral'
}

export function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading } = useSalesOrder(id)

  if (isLoading) {
    return (
      <PageShell title="Loading..." description="">
        <ContentCard>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </ContentCard>
      </PageShell>
    )
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

        type OrderItem = { name: string; unitPrice: number; qty: number }
        type PaymentRow = { date: string; method: string; amount: number; status: string }

        return (
          <PageShell
            title={`Sales Order ${order.code}`}
            description={`Pelanggan: ${order.customerName} | Tanggal: ${order.date}`}
            actions={
              <>
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Nota
                </Button>
                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Kirim WA
                </Button>
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <ContentCard title="Daftar Item">
                  <DataTable
                    data={order.items?.map((i: OrderItem, idx: number) => ({ ...i, id: String(idx) })) || []}
                    columns={[
                      { key: 'name', header: 'Item' },
                      { key: 'unitPrice', header: 'Harga', render: (row: OrderItem) => formatCurrency(row.unitPrice) },
                      { key: 'qty', header: 'Qty' },
                      { key: 'subtotal', header: 'Subtotal', render: (row: OrderItem) => formatCurrency(row.unitPrice * row.qty) },
                    ]}
                    mobileRender={(row: OrderItem) => (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-sm text-muted-foreground">{row.qty} x {formatCurrency(row.unitPrice)}</p>
                        </div>
                        <div className="font-medium">{formatCurrency(row.unitPrice * row.qty)}</div>
                      </div>
                    )}
                  />
                </ContentCard>

                <ContentCard title="Histori Pembayaran">
                   <DataTable
                    data={order.payments?.map((p: PaymentRow, idx: number) => ({ ...p, id: String(idx) })) || []}
                    emptyTitle="Belum ada pembayaran"
                    columns={[
                      { key: 'date', header: 'Tanggal', render: (row: PaymentRow) => new Date(row.date).toLocaleDateString() },
                      { key: 'method', header: 'Metode', render: (row: PaymentRow) => <span className="capitalize">{row.method}</span> },
                      { key: 'amount', header: 'Nominal', render: (row: PaymentRow) => formatCurrency(row.amount) },
                      { key: 'status', header: 'Status', render: (row: PaymentRow) => <StatusBadge label={row.status} tone={row.status === 'success' ? 'success' : 'warning'} /> },
                    ]}
                    mobileRender={(row: PaymentRow) => (
                       <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium capitalize">{row.method}</p>
                          <p className="text-sm text-muted-foreground">{new Date(row.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(row.amount)}</p>
                          <StatusBadge label={row.status} tone={row.status === 'success' ? 'success' : 'warning'} />
                        </div>
                      </div>
                    )}
                  />
                </ContentCard>
              </div>

        <div className="space-y-4">
          <ContentCard title="Ringkasan">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge label={order.status} tone={tone(order.status)} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(order.grandTotal)}</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dibayar</span>
                <span className="font-semibold text-green-600">{formatCurrency(order.paidTotal)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Sisa Tagihan</span>
                <span className="font-bold text-red-600">{formatCurrency(Math.max(0, order.grandTotal - order.paidTotal))}</span>
              </div>

              {order.grandTotal > order.paidTotal && (
                <Button className="w-full mt-4">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Terima Pembayaran
                </Button>
              )}
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
