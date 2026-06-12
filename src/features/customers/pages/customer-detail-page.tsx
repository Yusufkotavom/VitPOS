import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, PencilIcon, XIcon, CheckIcon, Trash2Icon } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import { formatDate } from '@/lib/date'
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
  paidTotal: number
  status: string
}

export function CustomerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const activeTenantId = useAuthStore((state) => state.activeTenant?.id)

  const customer = useLiveQuery(() => id ? localDb.customers.get(id) : undefined, [id])
  const isLoading = customer === undefined

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
        paidTotal: so.paidTotal,
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
        paidTotal: so.paidTotal,
        status: so.status,
      }))
    return [...salesOrders, ...serviceOrders].sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da)
    })
  }, [customer, allSalesOrders, allServiceOrders, id])

  const calculatedReceivable = useMemo(() => {
    return orders.reduce((sum, order) => {
      if (order.status === 'Batal') return sum
      return sum + Math.max(0, order.total - order.paidTotal)
    }, 0)
  }, [orders])

  if (isLoading) {
    return (
      <PageShell title={t('common.loading')} description="">
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
      <PageShell title={t('common.not_found')} description={t('customers.not_found')}>
        <Button asChild variant="outline">
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back_to_list')}
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
    try {
      const updated = { ...customer }
      updated.name = editName.trim()
      updated.phone = editPhone.trim()
      updated.city = editCity.trim()
      updated.status = editStatus
      updated.receivable = Number(editReceivable) || 0
      updated.version = customer.version + 1
      updated.updatedAt = new Date().toISOString()
      await customerRepository.upsert(updated)
      toast.success(t('customers.updated'))
      setEditing(false)
    } catch (error) {
      toast.error(t('common.save_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  async function handleDelete() {
    if (!customer) return
    try {
      await customerRepository.remove(customer.id)
      toast.success(t('customers.deleted'))
      setDeleteOpen(false)
    } catch (error) {
      toast.error(t('common.delete_error', { message: error instanceof Error ? error.message : t('common.error_generic') }))
    }
  }

  return (
    <PageShell
      title={customer.name}
      description={`${customer.phone} · ${customer.city}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                <XIcon className="mr-2 h-4 w-4" />
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={saveEditing}>
                <CheckIcon className="mr-2 h-4 w-4" />
                {t('common.save')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <PencilIcon className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2 min-w-0">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('customers.info')}</h3>
            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('common.name')}</p>
                  {editing ? (
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="font-medium">{customer.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('common.whatsapp')}</p>
                  {editing ? (
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="font-medium">{customer.phone}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('common.address')}</p>
                  {editing ? (
                    <Textarea value={editCity} onChange={e => setEditCity(e.target.value)} className="min-h-[3.5rem]" />
                  ) : (
                    <p className="font-medium">{customer.city}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('common.status')}</p>
                  {editing ? (
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        {customerStatusOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge label={customer.status} tone={customer.status === 'Aktif' ? 'success' : customer.status === 'Piutang' ? 'warning' : 'neutral'} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('customers.order_history')}</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <DataTable
                  data={orders}
                  columns={[
                    { key: 'code', header: t('common.code'), sortable: true, render: (row: OrderRow) => (
                      <Link
                        to={row.type === 'Penjualan' ? `/sales-orders/${row.id}` : `/service-orders/${row.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.code}
                      </Link>
                    )},
                    { key: 'date', header: t('common.date'), sortable: true, render: (row: OrderRow) => formatDate(row.date) },
                    { key: 'type', header: t('common.type'), render: (row: OrderRow) => (
                      <StatusBadge label={row.type} tone={row.type === 'Penjualan' ? 'info' : 'warning'} />
                    )},
                    { key: 'total', header: t('common.total'), sortable: true, render: (row: OrderRow) => formatCurrency(row.total) },
                    { key: 'status', header: t('common.status'), render: (row: OrderRow) => (
                      <StatusBadge label={row.status} tone={tone(row.status)} />
                    )},
                  ]}
                  emptyTitle={t('customers.no_transactions')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('common.status')}</span>
              <StatusBadge label={customer.status} tone={customer.status === 'Aktif' ? 'success' : customer.status === 'Piutang' ? 'warning' : 'neutral'} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t('customers.total_orders')}</span>
              <span className="font-semibold">{orders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('customers.total_receivable')}</span>
              <span className="font-bold text-red-600">{formatCurrency(calculatedReceivable)}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customers.delete_title')}</DialogTitle>
            <DialogDescription>{t('customers.delete_warning', { name: customer.name })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('customers.delete_confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
