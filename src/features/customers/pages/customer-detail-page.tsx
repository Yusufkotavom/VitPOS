import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, PencilIcon, XIcon, CheckIcon, Trash2Icon } from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from '@/services/local-db/reactivity'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import { customerRepository } from '@/services/local-db/repository'
import { localDb } from '@/services/local-db/client'
import { customerStatusOptions } from '@/features/customers/schemas/customer-form-schema'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { PageShell } from '@/shared/components/layout/page-shell'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { DataTable } from '@/shared/components/data-table/data-table'

function tone(status: string) {
  if (status === 'Lunas' || status === 'Selesai' || status === 'Diambil') return 'success'
  if (status === 'Sebagian' || status === 'Dikerjakan') return 'warning'
  if (status === 'Belum Bayar' || status === 'Diterima') return 'danger'
  return 'neutral'
}

type OrderRow = {
  id: string
  code: string
  date: string
  type: 'Penjualan' | 'Servis'
  total: number
  status: string
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const activeTenantId = useAuthStore((state) => state.activeTenant?.id)

  const { data: customer, isLoading, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerRepository.get(id!),
    enabled: !!id,
  })

  const rawSales = useLiveQuery(
    () => activeTenantId ? localDb.salesOrders.where('tenantId').equals(activeTenantId).toArray() : [],
    [activeTenantId],
  )
  const rawService = useLiveQuery(
    () => activeTenantId ? localDb.serviceOrders.where('tenantId').equals(activeTenantId).toArray() : [],
    [activeTenantId],
  )

  const allSalesOrders = useMemo(() => rawSales ?? [], [rawSales])
  const allServiceOrders = useMemo(() => rawService ?? [], [rawService])

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editReceivable, setEditReceivable] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const orders = useMemo(() => {
    if (!customer) return []
    const salesOrders: OrderRow[] = allSalesOrders
      .filter(so => so.customerId === id || so.customerName === customer.name)
      .map(so => ({
        id: so.id,
        code: so.code,
        date: so.date,
        type: 'Penjualan' as const,
        total: so.grandTotal,
        status: so.status,
      }))
    const serviceOrders: OrderRow[] = allServiceOrders
      .filter(so => so.customerId === id || so.customerName === customer.name)
      .map(so => ({
        id: so.id,
        code: so.code,
        date: so.date,
        type: 'Servis' as const,
        total: so.cost,
        status: so.status,
      }))
    return [...salesOrders, ...serviceOrders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [customer, allSalesOrders, allServiceOrders, id])

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

  if (!customer) {
    return (
      <PageShell title="Tidak Ditemukan" description="Pelanggan tidak ditemukan">
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar
          </Link>
        </Button>
      </PageShell>
    )
  }

  function startEditing() {
    if (!customer) return
    setEditName(customer.name)
    setEditPhone(customer.phone)
    setEditCity(customer.city)
    setEditStatus(customer.status)
    setEditReceivable(String(customer.receivable))
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEditing() {
    if (!customer) return
    const updated = { ...customer }
    updated.name = editName.trim()
    updated.phone = editPhone.trim()
    updated.city = editCity.trim()
    updated.status = editStatus
    updated.receivable = Number(editReceivable) || 0
    updated.version = customer.version + 1
    updated.updatedAt = new Date().toISOString()
    await customerRepository.upsert(updated)
    toast.success('Pelanggan diperbarui')
    setEditing(false)
    refetch()
  }

  async function handleDelete() {
    if (!customer) return
    await customerRepository.remove(customer.id)
    toast.success('Pelanggan dihapus')
    setDeleteOpen(false)
  }

  return (
    <PageShell
      title={customer.name}
      description={`${customer.phone} · ${customer.city}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
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
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Info Pelanggan</h3>
            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nama</p>
                  {editing ? (
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="font-medium">{customer.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">WhatsApp</p>
                  {editing ? (
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="font-medium">{customer.phone}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Alamat</p>
                  {editing ? (
                    <Textarea value={editCity} onChange={e => setEditCity(e.target.value)} className="min-h-[3.5rem]" />
                  ) : (
                    <p className="font-medium">{customer.city}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {editing ? (
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                    >
                      {customerStatusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge label={customer.status} tone={customer.status === 'Aktif' ? 'success' : customer.status === 'Piutang' ? 'warning' : 'neutral'} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Riwayat Order</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <DataTable
                  data={orders}
                  columns={[
                    { key: 'code', header: 'Kode', sortable: true, render: (row: OrderRow) => (
                      <Link
                        to={row.type === 'Penjualan' ? `/sales-orders/${row.id}` : `/service-orders/${row.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.code}
                      </Link>
                    )},
                    { key: 'date', header: 'Tanggal', sortable: true, render: (row: OrderRow) => new Date(row.date).toLocaleDateString('id-ID') },
                    { key: 'type', header: 'Tipe', render: (row: OrderRow) => (
                      <StatusBadge label={row.type} tone={row.type === 'Penjualan' ? 'info' : 'warning'} />
                    )},
                    { key: 'total', header: 'Total', sortable: true, render: (row: OrderRow) => formatCurrency(row.total) },
                    { key: 'status', header: 'Status', render: (row: OrderRow) => (
                      <StatusBadge label={row.status} tone={tone(row.status)} />
                    )},
                  ]}
                  emptyTitle="Belum ada transaksi"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge label={customer.status} tone={customer.status === 'Aktif' ? 'success' : customer.status === 'Piutang' ? 'warning' : 'neutral'} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total Order</span>
              <span className="font-semibold">{orders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Piutang</span>
              <span className="font-bold text-red-600">{formatCurrency(customer.receivable)}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus pelanggan</DialogTitle>
            <DialogDescription>Pelanggan {customer.name} akan dihapus dari data lokal dan masuk antrean sinkron.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus pelanggan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
