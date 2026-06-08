import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, PenTool } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format-currency'
import { useServiceOrder } from '@/features/service-orders/hooks/use-service-order'
import { ContentCard } from '@/shared/components/display/content-card'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'

function tone(status: string) {
  if (status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Dikerjakan') return 'info'
  if (status === 'Batal') return 'danger'
  return 'warning'
}

export function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading } = useServiceOrder(id)

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
      title={`Service Order ${order.code}`}
      description={`Pelanggan: ${order.customerName} | Diterima: ${order.date}`}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print Tanda Terima
          </Button>
          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
            <MessageSquare className="mr-2 h-4 w-4" />
            Update via WA
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <ContentCard title="Detail Kerusakan & Pekerjaan">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <p className="text-sm text-muted-foreground">Perangkat</p>
                  <p className="font-medium mt-1">{order.description.split(' - ')[0] || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Keluhan / Kerusakan</p>
                  <p className="font-medium mt-1">{order.description.split(' - ')[1] || order.description}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold">Timeline Pekerjaan</h3>
                   <Button variant="outline" size="sm">
                     <PenTool className="h-4 w-4 mr-2" />
                     Update Status
                   </Button>
                </div>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {order.timeline?.map((item: { id: string; status: string; date: string; note: string }) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary bg-background text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm" />
                       <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] border bg-card p-3 rounded-lg shadow-sm">
                         <div className="flex items-center justify-between space-x-2 mb-1">
                           <StatusBadge label={item.status} tone={tone(item.status)} />
                           <time className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</time>
                         </div>
                         <p className="text-sm">{item.note}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ContentCard>
        </div>

        <div className="space-y-4">
          <ContentCard title="Ringkasan Biaya">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status Pengerjaan</span>
                <StatusBadge label={order.status} tone={tone(order.status)} />
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Estimasi/Biaya</span>
                <span className="font-bold">{formatCurrency(order.cost)}</span>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
