import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format-currency'
import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { useServiceOrderCreateStore } from '@/features/service-orders/stores/service-order-create-store'
import { serviceOrderStatusOptions } from '@/features/service-orders/schemas/service-order-form-schema'

export function ServiceOrderCreatePage() {
  const navigate = useNavigate()
  const store = useServiceOrderCreateStore()
  const tenantId = requireActiveTenantId()
  const [search, setSearch] = useState('')

  const customers = useLiveQuery(() => localDb.customers.where('tenantId').equals(tenantId).toArray(), [tenantId], [])
  const products = useLiveQuery(() => localDb.products.where('tenantId').equals(tenantId).toArray(), [tenantId], [])

  const filteredProducts = products.filter(p => p.status === 'Aktif' && p.name.toLowerCase().includes(search.toLowerCase()))

  const totals = {
    subtotal: store.items.reduce((sum, item) => sum + item.subtotal, 0),
  }

  async function handleSubmit() {
    if (!store.description.trim() && store.items.length === 0) {
      toast.error('Isi deskripsi pekerjaan atau tambahkan minimal 1 produk')
      return
    }

    try {
      const id = crypto.randomUUID()
      const nowIso = new Date().toISOString()
      const code = `SRV-${Date.now().toString().slice(-6)}`
      
      const timeline = [
        {
          id: crypto.randomUUID(),
          status: store.status,
          date: nowIso,
          note: store.notes || 'Service order dibuat',
        }
      ]

      await localDb.serviceOrders.put({
        id,
        tenantId,
        code,
        customerId: store.customerId || undefined,
        customerName: store.customerName,
        description: store.description,
        date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date()),
        cost: totals.subtotal,
        status: store.status as any,
        items: store.items,
        notes: store.notes,
        timeline,
        syncStatus: 'pending',
        version: 1,
        updatedAt: nowIso,
      })

      // Also create outbox item for sync
      await localDb.outbox.put({
        id: crypto.randomUUID(),
        entityType: 'service_order',
        entityId: id,
        mutationType: 'create',
        payload: { id }, // In a real app we'd pass the full payload, but let's keep it simple
        status: 'queued',
        attempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso
      })

      toast.success('Service order berhasil dibuat')
      store.clear()
      navigate('/service-orders')
    } catch (error) {
      toast.error('Gagal membuat service order')
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-muted/20">
      <header className="border-b bg-background px-4 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Buat Service / Pesanan</h1>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Kiri: Form & Grid Produk */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Pelanggan</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={store.customerId || ''}
                  onChange={e => {
                    const id = e.target.value
                    const c = customers.find(x => x.id === id)
                    if (c) store.setCustomer(c.name, c.id)
                    else store.setCustomer('Umum', null)
                  }}
                >
                  <option value="">Umum</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Status Awal</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={store.status}
                  onChange={e => store.setStatus(e.target.value)}
                >
                  {serviceOrderStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Pekerjaan / Kerusakan</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[50px]"
                  placeholder="Deskripsi pekerjaan..."
                  value={store.description}
                  onChange={e => store.setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Catatan Internal / Timeline</label>
                <Input 
                  placeholder="Misal: DP lunas, desain sedang dibuat..."
                  value={store.notes}
                  onChange={e => store.setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold">Pilih Produk / Layanan</h2>
              <Input 
                placeholder="Cari..." 
                className="w-64 bg-background" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => store.addItem({ productId: p.id, name: p.name, price: p.price })}
                    className="text-left flex flex-col justify-between p-3 h-24 rounded-xl border bg-background hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <span className="font-medium text-sm line-clamp-2">{p.name}</span>
                    <span className="text-sm font-bold text-primary mt-2">{formatCurrency(p.price)}</span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                    Produk tidak ditemukan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kanan: Keranjang (Mirip POS) */}
        <aside className="hidden w-[400px] flex-col border-l bg-background xl:flex">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Daftar Biaya</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {store.items.length} item
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {store.items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                <p className="text-sm">Belum ada item ditambahkan</p>
              </div>
            ) : (
              store.items.map(item => (
                <div key={item.productId} className="flex flex-col gap-2 rounded-xl border p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <button onClick={() => store.removeItem(item.productId)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{formatCurrency(item.price)}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                        <button className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm disabled:opacity-50" onClick={() => item.qty > 1 ? store.updateItemQty(item.productId, item.qty - 1) : store.removeItem(item.productId)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <button className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm disabled:opacity-50" onClick={() => store.updateItemQty(item.productId, item.qty + 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold min-w-[80px] text-right">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Total Estimasi</span>
              <span className="text-2xl font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={handleSubmit}>
              Buat Service Order
            </Button>
          </div>
        </aside>
      </main>
    </div>
  )
}
