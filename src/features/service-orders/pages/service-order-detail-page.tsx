import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, MessageSquare, PencilIcon, XIcon, CheckIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import { useServiceOrder } from '@/features/service-orders/hooks/use-service-order'
import { serviceOrderRepository } from '@/services/local-db/repository'
import { serviceOrderStatusOptions } from '@/features/service-orders/schemas/service-order-form-schema'
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
  const { data: order, isLoading, refetch } = useServiceOrder(id)
  const [editing, setEditing] = useState(false)
  const [editCustomer, setEditCustomer] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCost, setEditCost] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  function startEditing() {
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
    await serviceOrderRepository.upsert({
      ...order,
      customerName: editCustomer.trim(),
      description: editDesc.trim(),
      cost: Number(editCost) || 0,
      status: editStatus as typeof order.status,
      version: order.version + 1,
      updatedAt: new Date().toISOString(),
    })
    toast.success('Service order diperbarui')
    setEditing(false)
    refetch()
  }

  async function handleDelete() {
    await serviceOrderRepository.remove(order.id)
    toast.success('Service order dihapus')
    setDeleteOpen(false)
  }

  return (
    <PageShell
      title={order.code}
      description={`${order.customerName} · ${order.date}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" disabled>
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
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Detail Pekerjaan</h3>
            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pelanggan</p>
                  {editing ? (
                    <Input value={editCustomer} onChange={e => setEditCustomer(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="font-medium">{order.customerName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tanggal</p>
                  <p className="font-medium">{order.date}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deskripsi</p>
                {editing ? (
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{order.description}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Timeline</h3>
            <div className="rounded-lg border p-4">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {order.timeline?.map((item: { id: string; status: string; date: string; note: string }) => (
                  <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary bg-background text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] border bg-card p-3 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <StatusBadge label={item.status} tone={tone(item.status)} />
                        <time className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('id-ID')}</time>
                      </div>
                      <p className="text-sm">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
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
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Biaya</span>
              <span className="font-bold text-lg">{formatCurrency(editing ? Number(editCost) || 0 : order.cost)}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus service order</DialogTitle>
            <DialogDescription>Service order {order.code} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
