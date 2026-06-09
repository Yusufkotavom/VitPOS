import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, ArrowLeft, Search, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    <div className="flex min-h-[100dvh] flex-col bg-muted/20 relative pb-20">
      <header className="border-b bg-background px-4 py-3 sticky top-0 z-10">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/service-orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Select
              value={store.customerId || '__umum__'}
              onValueChange={(val) => {
                if (val === '__umum__') {
                  store.setCustomer('Umum', null)
                } else {
                  const c = customers.find(x => x.id === val)
                  if (c) store.setCustomer(c.name, c.id)
                }
              }}
            >
              <SelectTrigger className="w-full max-w-[200px]">
                <SelectValue placeholder="Pelanggan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__umum__">Umum</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={store.status} onValueChange={store.setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceOrderStatusOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5 font-normal",
                    !store.estimatedCompletion && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {store.estimatedCompletion
                    ? format(new Date(store.estimatedCompletion), "d MMM", { locale: localeId })
                    : "Estimasi"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={store.estimatedCompletion ? new Date(store.estimatedCompletion) : undefined}
                  onSelect={(date) => store.setEstimatedCompletion(date ? date.toISOString() : undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full p-4 space-y-4">
        <div className="space-y-3">
          <Label htmlFor="soc-description">Pekerjaan / Kerusakan</Label>
          <Textarea
            id="soc-description"
            className="min-h-[80px] resize-none"
            placeholder="Deskripsikan pekerjaan atau kerusakan..."
            value={store.description}
            onChange={e => store.setDescription(e.target.value)}
          />

          <Label htmlFor="soc-notes">Catatan</Label>
          <Input
            id="soc-notes"
            placeholder="Catatan internal (opsional)"
            value={store.notes}
            onChange={e => store.setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Item / Biaya</span>
          <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" />
                Tambah
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

        <div className="space-y-1">
          {store.items.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">Belum ada item</p>
            </div>
          ) : (
            store.items.map(item => (
              <div key={item.productId} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center rounded-lg border bg-background">
                  <button className="flex h-7 w-7 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted" onClick={() => item.qty > 1 ? store.updateItemQty(item.productId, item.qty - 1) : store.removeItem(item.productId)}>
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                  <button className="flex h-7 w-7 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted" onClick={() => store.updateItemQty(item.productId, item.qty + 1)}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-semibold w-24 text-right">{formatCurrency(item.subtotal)}</span>
                <button onClick={() => store.removeItem(item.productId)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <div className="sticky bottom-0 left-0 right-0 border-t bg-background px-4 py-3 z-20">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{store.items.length} item</p>
            <p className="text-lg font-bold">{formatCurrency(totals.subtotal)}</p>
          </div>
          <Button size="lg" className="min-w-32" onClick={handleOpenPayment}>
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
