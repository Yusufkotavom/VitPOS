import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, ArrowLeft, Search, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { localDb } from '@/services/local-db/client'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { useServiceOrderCreateStore } from '@/features/service-orders/stores/service-order-create-store'
import { serviceOrderStatusOptions } from '@/features/service-orders/schemas/service-order-form-schema'
import { SocPaymentSummary } from '@/features/service-orders/components/soc-payment-summary'

export function ServiceOrderCreatePage() {
  const navigate = useNavigate()
  const store = useServiceOrderCreateStore()
  const tenantId = requireActiveTenantId()
  
  const [search, setSearch] = useState('')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  const customers = useLiveQuery(() => localDb.customers.where('tenantId').equals(tenantId).toArray(), [tenantId], [])
  const products = useLiveQuery(() => localDb.products.where('tenantId').equals(tenantId).toArray(), [tenantId], [])

  const filteredProducts = products.filter(p => {
    if (p.status !== 'Aktif') return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totals = {
    subtotal: store.items.reduce((sum, item) => sum + item.subtotal, 0),
  }

  function handleOpenPayment() {
    if (!store.description.trim()) {
      toast.error('Deskripsi pekerjaan wajib diisi')
      return
    }
    setIsPaymentOpen(true)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/20 relative pb-24">
      <header className="border-b bg-background px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Buat Service Order</h1>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full p-4 space-y-6">
        <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Informasi Umum</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
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
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Estimasi Selesai (Opsional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !store.estimatedCompletion && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {store.estimatedCompletion ? format(new Date(store.estimatedCompletion), "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={store.estimatedCompletion ? new Date(store.estimatedCompletion) : undefined}
                    onSelect={(date) => store.setEstimatedCompletion(date ? date.toISOString() : undefined)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Pekerjaan / Kerusakan *</label>
            <Textarea 
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
              placeholder="Deskripsikan secara detail pekerjaan atau kerusakan..."
              value={store.description}
              onChange={e => store.setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Catatan Internal / Tambahan</label>
            <Input 
              placeholder="Misal: Janji selesai besok sore, DP lunas..."
              value={store.notes}
              onChange={e => store.setNotes(e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-semibold text-lg">Item Biaya / Produk</h2>
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Tambah Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Pilih Produk / Jasa</DialogTitle>
                </DialogHeader>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 mt-4">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.price)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          store.addItem({ productId: p.id, name: p.name, price: p.price })
                          toast.success(`${p.name} ditambahkan`)
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
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {store.items.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed rounded-xl opacity-50">
                <p className="text-sm">Belum ada item ditambahkan</p>
              </div>
            ) : (
              store.items.map(item => (
                <div key={item.productId} className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                    <button onClick={() => store.removeItem(item.productId)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{formatCurrency(item.price)}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-sm">
                        <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => item.qty > 1 ? store.updateItemQty(item.productId, item.qty - 1) : store.removeItem(item.productId)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => store.updateItemQty(item.productId, item.qty + 1)}>
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
        </section>
      </main>

      {/* Sticky Bottom Card */}
      <div className="sticky bottom-16 md:bottom-0 left-0 right-0 border-t bg-background p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-20 mt-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Estimasi ({store.items.length} item)</p>
            <p className="text-2xl font-bold text-primary leading-none mt-1">{formatCurrency(totals.subtotal)}</p>
          </div>
          <Button size="lg" className="min-w-32 h-12 text-md shadow-md" onClick={handleOpenPayment}>
            Buat Order
          </Button>
        </div>
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proses Service Order</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <SocPaymentSummary onComplete={() => setIsPaymentOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
