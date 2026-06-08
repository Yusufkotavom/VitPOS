import { useState } from 'react'
import { CheckCircle2, ChevronRight, PackagePlus, Store, Building2, Package, CreditCard, Monitor, ShoppingCart, Coffee, Edit } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'

const steps = [
  { id: 1, title: 'Informasi Perusahaan', icon: Store },
  { id: 2, title: 'Pilih Template Bisnis', icon: Building2 },
  { id: 3, title: 'Setup Produk Awal', icon: Package },
  { id: 4, title: 'Metode Pembayaran', icon: CreditCard },
]

const ICONS = [
  { id: 'Store', component: Store },
  { id: 'ShoppingCart', component: ShoppingCart },
  { id: 'Coffee', component: Coffee },
  { id: 'Monitor', component: Monitor },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { currentUser, setAuth, setActiveTenant } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  
  const [step, setStep] = useState(1)
  
  // Form State
  const [ownerData, setOwnerData] = useState({ name: '', email: '', password: '' })
  const [tenantName, setTenantName] = useState('')
  const [tenantIcon, setTenantIcon] = useState('Store')
  const [template, setTemplate] = useState('retail')
  
  // Step 3 Mock Products
  const [products, setProducts] = useState([
    { id: '1', name: 'Produk A', price: 10000 },
    { id: '2', name: 'Produk B', price: 20000 },
  ])
  const [newProdName, setNewProdName] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)

  // Step 4 Payments
  const [payments, setPayments] = useState({ tunai: true, qris: false, transfer: false })

  // Validation
  const canGoNextStep1 = currentUser 
    ? tenantName.trim() !== '' 
    : ownerData.name && ownerData.email && ownerData.password && tenantName.trim() !== ''

  async function handleFinish() {
    setError(null)
    const now = new Date().toISOString()
    let userId = currentUser?.id

    try {
      if (!currentUser) {
        const existingUser = await localDb.users.where('email').equals(ownerData.email.toLowerCase()).first()
        if (existingUser) {
          setError('Email sudah terdaftar. Silakan login dulu.')
          setStep(1)
          return
        }

        userId = crypto.randomUUID()
        const newUser = {
          id: userId,
          name: ownerData.name,
          email: ownerData.email.toLowerCase(),
          passwordHash: ownerData.password,
          createdAt: now,
          updatedAt: now,
        }
        await localDb.users.add(newUser)
        setAuth(newUser)
      }

      const tenantId = crypto.randomUUID()

      const newTenant = {
        id: tenantId,
        name: tenantName,
        type: template,
        phone: '',
        planCode: 'trial',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
      // Note: In real app, we'd save the selected `tenantIcon` as well, assuming schema has it.
      // Since schema.ts doesn't have an icon on LocalTenant, we will ignore for now.

      const newMember = {
        id: crypto.randomUUID(),
        tenantId,
        userId: userId!,
        role: 'owner',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }

      await localDb.tenants.add(newTenant)
      await localDb.tenantMembers.add(newMember)

      // Persist Payment Methods Settings
      await localDb.settings.add({
        id: crypto.randomUUID(),
        area: 'pos',
        setting: 'payment_methods',
        value: JSON.stringify(payments),
        status: 'Aktif',
        updatedAt: now
      })

      // Setup initial products based on the list
      for (const p of products) {
        await localDb.products.add({
          id: crypto.randomUUID(),
          name: p.name,
          category: 'Umum',
          type: 'Produk Fisik',
          price: p.price,
          stock: 0,
          status: 'Aktif',
          syncStatus: 'synced',
          version: 1,
          updatedAt: now
        })
      }

      setActiveTenant(newTenant, 'owner')
      navigate('/billing')
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat menyimpan data.')
    }
  }

  function handleOpenAddProduct() {
    setEditingProductId(null)
    setNewProdName('')
    setNewProdPrice('')
    setIsProductDialogOpen(true)
  }

  function handleOpenEditProduct(p: {id: string, name: string, price: number}) {
    setEditingProductId(p.id)
    setNewProdName(p.name)
    setNewProdPrice(String(p.price))
    setIsProductDialogOpen(true)
  }

  function handleSaveProduct() {
    if (newProdName && newProdPrice) {
      if (editingProductId) {
        setProducts(products.map(p => p.id === editingProductId ? { ...p, name: newProdName, price: Number(newProdPrice) } : p))
      } else {
        setProducts([...products, { id: crypto.randomUUID(), name: newProdName, price: Number(newProdPrice) }])
      }
      setIsProductDialogOpen(false)
    }
  }

  function handleDeleteProduct(id: string) {
    setProducts(products.filter(p => p.id !== id))
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 flex items-center justify-center">
      <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar Steps */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Progress Setup</CardTitle>
            <CardDescription>Langkah {step} dari {steps.length}</CardDescription>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} />
            </div>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {steps.map((s) => {
                const isActive = step === s.id
                const isPast = step > s.id
                return (
                  <li key={s.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${isActive ? 'bg-primary/5 border-primary/20' : ''} ${isPast ? 'opacity-70' : ''}`}>
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {isPast ? <CheckCircle2 className="size-4" /> : s.id}
                    </div>
                    <span className={`font-medium text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{s.title}</span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex flex-col gap-6">
          <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  {step === 1 && <Store />}
                  {step === 2 && <Building2 />}
                  {step === 3 && <Package />}
                  {step === 4 && <CreditCard />}
                </div>
                <div>
                  <CardTitle>{steps[step - 1]?.title}</CardTitle>
                  <CardDescription>
                    {step === 1 && 'Data dasar untuk dashboard, struk, dan cabang pertama.'}
                    {step === 2 && 'Pilih template yang paling sesuai dengan jenis usaha Anda.'}
                    {step === 3 && 'Tambahkan beberapa produk awal sebagai contoh (bisa diedit nanti).'}
                    {step === 4 && 'Pilih metode pembayaran yang diterima di kasir Anda.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {error && <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm font-medium">{error}</div>}

              {/* Step 1 */}
              {step === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {!currentUser ? (
                    <>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="owner-name">Nama owner</Label>
                        <Input id="owner-name" value={ownerData.name} onChange={e => setOwnerData({...ownerData, name: e.target.value})} placeholder="Nama lengkap" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="owner-email">Email owner</Label>
                        <Input id="owner-email" type="email" value={ownerData.email} onChange={e => setOwnerData({...ownerData, email: e.target.value})} placeholder="owner@usaha.co.id" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="owner-password">Kata sandi owner</Label>
                        <Input id="owner-password" type="password" value={ownerData.password} onChange={e => setOwnerData({...ownerData, password: e.target.value})} placeholder="Minimal 8 karakter" />
                      </div>
                    </>
                  ) : null}
                  
                  <div className="flex flex-col gap-2 md:col-span-2 mt-2 pt-4 border-t">
                    <Label htmlFor="business-name">Nama Bisnis</Label>
                    <Input id="business-name" value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="Contoh: Toko Sumber Rejeki" />
                  </div>

                  <div className="flex flex-col gap-3 md:col-span-2 mt-2">
                    <Label>Pilih Ikon Bisnis</Label>
                    <div className="flex flex-wrap gap-3">
                      {ICONS.map(({ id, component: IconComponent }) => (
                        <div 
                          key={id}
                          onClick={() => setTenantIcon(id)}
                          className={`cursor-pointer rounded-xl border p-3 flex items-center justify-center transition-all ${tenantIcon === id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                        >
                          <IconComponent className="size-6" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['retail', 'fnb', 'jasa', 'grosir', 'klinik', 'lainnya'].map((t) => (
                    <div 
                      key={t} 
                      className={`border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-center h-24 ${template === t ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                      onClick={() => setTemplate(t)}
                    >
                      <div className="font-medium capitalize">{t}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Nama Produk</th>
                          <th className="text-right p-3 font-medium">Harga Dasar</th>
                          <th className="w-24 text-center p-3 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} className="border-t">
                            <td className="p-3">{p.name}</td>
                            <td className="p-3 text-right">Rp {p.price.toLocaleString('id-ID')}</td>
                            <td className="p-3 text-center flex items-center justify-center gap-2">
                              <button type="button" onClick={() => handleOpenEditProduct(p)} className="text-primary hover:underline text-xs"><Edit className="size-4" /></button>
                              <button type="button" onClick={() => handleDeleteProduct(p.id)} className="text-destructive hover:underline text-xs">Hapus</button>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Belum ada produk.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-dashed" onClick={handleOpenAddProduct}><PackagePlus className="mr-2 size-4" /> Tambah Produk Mockup</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingProductId ? 'Edit Produk' : 'Tambah Produk Awal'}</DialogTitle>
                        <DialogDescription>Masukkan nama dan harga produk sebagai contoh awal.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Nama Produk</Label>
                          <Input value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Contoh: Kopi Susu" />
                        </div>
                        <div className="space-y-2">
                          <Label>Harga</Label>
                          <Input type="number" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="15000" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveProduct} disabled={!newProdName || !newProdPrice}>Simpan</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-4 max-w-sm">
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50" onClick={() => setPayments({...payments, tunai: !payments.tunai})}>
                    <input id="pay-tunai" type="checkbox" checked={payments.tunai} onChange={(e) => setPayments({...payments, tunai: e.target.checked})} className="size-4" />
                    <Label htmlFor="pay-tunai" className="flex-1 cursor-pointer">Tunai / Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50" onClick={() => setPayments({...payments, qris: !payments.qris})}>
                    <input id="pay-qris" type="checkbox" checked={payments.qris} onChange={(e) => setPayments({...payments, qris: e.target.checked})} className="size-4" />
                    <Label htmlFor="pay-qris" className="flex-1 cursor-pointer">QRIS</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50" onClick={() => setPayments({...payments, transfer: !payments.transfer})}>
                    <input id="pay-transfer" type="checkbox" checked={payments.transfer} onChange={(e) => setPayments({...payments, transfer: e.target.checked})} className="size-4" />
                    <Label htmlFor="pay-transfer" className="flex-1 cursor-pointer">Transfer Bank</Label>
                  </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/20 p-6">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>Kembali</Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/login">Ke Login</Link>
                </Button>
              )}
              
              {step < steps.length ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !canGoNextStep1}>
                  Lanjut <ChevronRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish}>
                  Lanjut ke Tagihan <ChevronRight className="ml-2 size-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
