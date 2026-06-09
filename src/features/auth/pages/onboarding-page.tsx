import { useState } from 'react'
import { CheckCircle2, ChevronRight, Store, Building2, Package, CreditCard, ShoppingCart, Coffee, Monitor, Stethoscope, Users, Truck, Banknote, Edit, Trash2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/features/auth/stores/auth-store'
import { apiPost } from '@/services/api/client'
import { localDb } from '@/services/local-db/client'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'
import { TEMPLATE_PRESETS, type TemplatePreset } from '@/features/auth/data/template-data'

type RegisterResponse = {
  ok: boolean
  defaultBranchId?: string
  defaultWarehouseId?: string
  user: {
    id: string
    email: string
    name: string
  }
  memberships: Array<{
    tenantId: string
    role: string
    tenantName: string
    tenantPlan: string
  }>
}

const steps = [
  { id: 1, title: 'Informasi Perusahaan', icon: Store },
  { id: 2, title: 'Pilih Template Bisnis', icon: Building2 },
  { id: 3, title: 'Sesuaikan Data Template', icon: Package },
  { id: 4, title: 'Metode Pembayaran', icon: CreditCard },
]

const ICONS = [
  { id: 'Store', component: Store },
  { id: 'ShoppingCart', component: ShoppingCart },
  { id: 'Coffee', component: Coffee },
  { id: 'Monitor', component: Monitor },
]

const TEMPLATE_META: Record<string, { icon: typeof Store; label: string; desc: string }> = {
  retail: { icon: ShoppingCart, label: 'Toko Retail', desc: 'Sembako, elektronik, kebutuhan sehari-hari' },
  fnb: { icon: Coffee, label: 'F&B / Makanan Minuman', desc: 'Restoran, kafe, kedai makanan' },
  jasa: { icon: Monitor, label: 'Jasa', desc: 'Servis, konsultasi, bengkel' },
  grosir: { icon: Package, label: 'Grosir', desc: 'Distributor, supplier, kulakan' },
  klinik: { icon: Stethoscope, label: 'Klinik', desc: 'Praktek dokter, klinik kesehatan' },
  lainnya: { icon: Building2, label: 'Lainnya', desc: 'Bisnis umum / custom' },
}

type EditableProduct = { id: string; name: string; category: string; price: number; type: 'Produk Fisik' | 'Jasa' }
type EditableCategory = { id: string; name: string }
type EditablePaymentMethod = { id: string; name: string; provider: string; type: string }
type EditableCashCategory = { id: string; name: string; type: 'Pemasukan' | 'Pengeluaran' }
type EditableCustomer = { name: string; phone: string; city: string }
type EditableSupplier = { name: string; phone: string; city: string }

function Rupiah({ amount }: { amount: number }) {
  return <>{'Rp ' + amount.toLocaleString('id-ID')}</>
}

function fromPreset(preset: TemplatePreset) {
  return {
    products: preset.products.map((p) => ({ ...p, id: crypto.randomUUID() })),
    categories: preset.categories.map((c) => ({ id: crypto.randomUUID(), name: c.name })),
    paymentMethods: preset.paymentMethods.map((pm) => ({ ...pm, id: crypto.randomUUID() })),
    cashCategories: preset.cashCategories.map((cc) => ({ ...cc, id: crypto.randomUUID() })),
    customer: { ...preset.customer },
    supplier: { ...preset.supplier },
  }
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { currentUser, setAuth, setActiveTenant } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState(1)

  const [ownerData, setOwnerData] = useState({ name: '', email: '', password: '' })
  const [tenantName, setTenantName] = useState('')
  const [tenantIcon, setTenantIcon] = useState('Store')
  const [template, setTemplate] = useState('retail')

  // Editable template data
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(() => fromPreset(TEMPLATE_PRESETS.retail).products)
  const [editableCategories, setEditableCategories] = useState<EditableCategory[]>(() => fromPreset(TEMPLATE_PRESETS.retail).categories)
  const [editablePaymentMethods, setEditablePaymentMethods] = useState<EditablePaymentMethod[]>(() => fromPreset(TEMPLATE_PRESETS.retail).paymentMethods)
  const [editableCashCategories, setEditableCashCategories] = useState<EditableCashCategory[]>(() => fromPreset(TEMPLATE_PRESETS.retail).cashCategories)
  const [editableCustomer, setEditableCustomer] = useState<EditableCustomer>(() => ({ ...TEMPLATE_PRESETS.retail.customer }))
  const [editableSupplier, setEditableSupplier] = useState<EditableSupplier>(() => ({ ...TEMPLATE_PRESETS.retail.supplier }))

  const [selectedPayments, setSelectedPayments] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TEMPLATE_PRESETS.retail.paymentMethods.map((pm) => [pm.name, true]))
  )

  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState({ name: '', category: '', price: '', type: 'Produk Fisik' as EditableProduct['type'] })

  // Payment method dialog state
  const [pmDialogOpen, setPmDialogOpen] = useState(false)
  const [editingPmId, setEditingPmId] = useState<string | null>(null)
  const [pmForm, setPmForm] = useState({ name: '', provider: '', type: '' })

  // Customer/Supplier edit dialog
  const [editPersonOpen, setEditPersonOpen] = useState<'customer' | 'supplier' | null>(null)
  const [personForm, setPersonForm] = useState({ name: '', phone: '', city: '' })

  function handleTemplateChange(t: string) {
    setTemplate(t)
    const p = fromPreset(TEMPLATE_PRESETS[t])
    setEditableProducts(p.products)
    setEditableCategories(p.categories)
    setEditablePaymentMethods(p.paymentMethods)
    setEditableCashCategories(p.cashCategories)
    setEditableCustomer(p.customer)
    setEditableSupplier(p.supplier)
    setSelectedPayments(Object.fromEntries(p.paymentMethods.map((pm) => [pm.name, true])))
  }

  const canGoNextStep1 = currentUser
    ? tenantName.trim() !== ''
    : ownerData.name && ownerData.email && ownerData.password && tenantName.trim() !== ''

  async function handleFinish() {
    setError(null)
    const now = new Date().toISOString()
    let userId = currentUser?.id
    let tenantRole = 'owner'
    let defaultBranchId: string | undefined
    let defaultWarehouseId: string | undefined

    try {
      const normalizedName = (currentUser?.name ?? ownerData.name).trim()
      const normalizedEmail = (currentUser?.email ?? ownerData.email).trim().toLowerCase()
      const normalizedPassword = currentUser?.passwordHash ?? ownerData.password

      if (!currentUser) {
        const existingUser = await localDb.users.where('email').equals(normalizedEmail).first()
        if (existingUser) {
          setError('Email sudah terdaftar. Silakan login dulu.')
          setStep(1)
          return
        }
      }

      const membershipCount = currentUser
        ? await localDb.tenantMembers.where('userId').equals(currentUser.id).count()
        : 0

      const shouldProvisionCloudTenant = membershipCount === 0

      let tenantId = crypto.randomUUID()
      if (shouldProvisionCloudTenant) {
        const registerResponse = await apiPost<RegisterResponse>('/auth/register', {
          name: normalizedName,
          email: normalizedEmail,
          password: normalizedPassword,
          tenantName: tenantName.trim(),
        })

        const primaryMembership = registerResponse.memberships[0]
        if (!primaryMembership) {
          throw new Error('Membership cloud tidak ditemukan setelah registrasi')
        }

        userId = registerResponse.user.id
        tenantId = primaryMembership.tenantId as `${string}-${string}-${string}-${string}-${string}`
        tenantRole = primaryMembership.role
        defaultBranchId = registerResponse.defaultBranchId
        defaultWarehouseId = registerResponse.defaultWarehouseId
      } else if (!userId) {
        userId = crypto.randomUUID()
      }

      const nextUser = {
        id: userId,
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: normalizedPassword,
        createdAt: currentUser?.createdAt ?? now,
        updatedAt: now,
      }

      await localDb.users.put(nextUser)
      if (currentUser && currentUser.id !== userId) {
        await localDb.users.delete(currentUser.id)
      }
      setAuth(nextUser)

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

      const newMember = {
        id: crypto.randomUUID(),
        tenantId,
        userId: userId!,
        role: 'owner',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }

      await localDb.tenants.put(newTenant)
      await localDb.tenantMembers.put(newMember)

      setActiveTenant(newTenant, tenantRole)

      for (const cat of editableCategories) {
        const catId = crypto.randomUUID()
        await localDb.productCategories.put({
          id: catId,
          tenantId,
          name: cat.name,
          description: '',
          status: 'Aktif',
          syncStatus: 'pending',
          version: 1,
          updatedAt: now,
        })
        await enqueueOutboxItem({ entityType: 'product_category', entityId: catId, mutationType: 'create', payload: { name: cat.name } })
      }

      for (const prod of editableProducts) {
        const prodId = crypto.randomUUID()
        await localDb.products.put({
          id: prodId,
          tenantId,
          name: prod.name,
          category: prod.category,
          type: prod.type,
          price: prod.price,
          stock: 0,
          status: 'Aktif',
          syncStatus: 'pending',
          version: 1,
          updatedAt: now,
        })
        await enqueueOutboxItem({ entityType: 'product', entityId: prodId, mutationType: 'create', payload: { name: prod.name, category: prod.category, type: prod.type, price: prod.price } })
      }

      for (const pm of editablePaymentMethods) {
        if (selectedPayments[pm.name]) {
          const pmId = crypto.randomUUID()
          await localDb.paymentMethods.put({
            id: pmId,
            tenantId,
            name: pm.name,
            provider: pm.provider,
            type: pm.type,
            status: 'Aktif',
            updatedAt: now,
          })
          await enqueueOutboxItem({ entityType: 'setting', entityId: pmId, mutationType: 'create', payload: { key: `payment_method_${pm.name}`, value: pm.name, area: 'payment' } })
        }
      }

      for (const cc of editableCashCategories) {
        const ccId = crypto.randomUUID()
        await localDb.cashCategories.put({
          id: ccId,
          tenantId,
          name: cc.name,
          type: cc.type,
          status: 'Aktif',
          syncStatus: 'pending',
          version: 1,
          updatedAt: now,
        })
        await enqueueOutboxItem({ entityType: 'cash_category', entityId: ccId, mutationType: 'create', payload: { name: cc.name, type: cc.type } })
      }

      const customerId = crypto.randomUUID()
      await localDb.customers.put({
        id: customerId,
        tenantId,
        name: editableCustomer.name,
        phone: editableCustomer.phone,
        city: editableCustomer.city,
        receivable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'pending',
        version: 1,
        updatedAt: now,
      })
      await enqueueOutboxItem({ entityType: 'customer', entityId: customerId, mutationType: 'create', payload: { name: editableCustomer.name, phone: editableCustomer.phone, city: editableCustomer.city } })

      const supplierId = crypto.randomUUID()
      await localDb.suppliers.put({
        id: supplierId,
        tenantId,
        name: editableSupplier.name,
        phone: editableSupplier.phone,
        city: editableSupplier.city,
        payable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'pending',
        version: 1,
        updatedAt: now,
      })
      await enqueueOutboxItem({ entityType: 'supplier', entityId: supplierId, mutationType: 'create', payload: { name: editableSupplier.name, phone: editableSupplier.phone, city: editableSupplier.city } })

      const printSettings = [
        { id: 'company-name', area: 'Profil Usaha', setting: 'Nama Usaha', value: tenantName },
        { id: 'company-phone', area: 'Profil Usaha', setting: 'Nomor Telepon', value: '' },
        { id: 'company-address', area: 'Profil Usaha', setting: 'Alamat Usaha', value: '' },
        { id: 'company-tax-number', area: 'Profil Usaha', setting: 'NPWP / NIB', value: '' },
        { id: 'company-icon', area: 'Profil Usaha', setting: 'Ikon Usaha', value: tenantIcon },
        { id: 'receipt-header', area: 'Struk', setting: 'Header Struk (POS)', value: '' },
        { id: 'receipt-footer', area: 'Struk', setting: 'Footer Struk (POS)', value: 'Terima kasih atas kunjungan Anda.' },
        { id: 'invoice-term', area: 'Invoice', setting: 'Catatan / Term Invoice', value: 'Syarat & Ketentuan berlaku.' },
      ]

      if (defaultBranchId) {
        printSettings.push({ id: `${tenantId}:default-branch-id`, area: 'System', setting: 'default_branch_id', value: defaultBranchId })
      }
      if (defaultWarehouseId) {
        printSettings.push({ id: `${tenantId}:default-warehouse-id`, area: 'System', setting: 'default_warehouse_id', value: defaultWarehouseId })
      }

      for (const s of printSettings) {
        await localDb.settings.put({ ...s, status: 'Lengkap', updatedAt: now, tenantId })
      }

      navigate('/billing')
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat menyimpan data.')
    }
  }

  function openAddProduct() {
    setEditingProductId(null)
    setProductForm({ name: '', category: editableCategories[0]?.name ?? '', price: '', type: 'Produk Fisik' })
    setProductDialogOpen(true)
  }

  function openEditProduct(p: EditableProduct) {
    setEditingProductId(p.id)
    setProductForm({ name: p.name, category: p.category, price: String(p.price), type: p.type })
    setProductDialogOpen(true)
  }

  function saveProduct() {
    if (!productForm.name || !productForm.price) return
    if (editingProductId) {
      setEditableProducts((prev) =>
        prev.map((p) => (p.id === editingProductId ? { ...p, name: productForm.name, category: productForm.category, price: Number(productForm.price), type: productForm.type } : p))
      )
    } else {
      setEditableProducts((prev) => [...prev, { id: crypto.randomUUID(), name: productForm.name, category: productForm.category, price: Number(productForm.price), type: productForm.type }])
    }
    setProductDialogOpen(false)
  }

  function deleteProduct(id: string) {
    setEditableProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function addCategory() {
    const name = prompt('Nama kategori baru:')
    if (name?.trim()) {
      setEditableCategories((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim() }])
    }
  }

  function removeCategory(id: string) {
    const cat = editableCategories.find((c) => c.id === id)
    if (cat && editableProducts.some((p) => p.category === cat.name)) {
      if (!confirm(`Hapus kategori "${cat.name}"? Produk dengan kategori ini tidak akan terhapus.`)) return
    }
    setEditableCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function openAddPm() {
    setEditingPmId(null)
    setPmForm({ name: '', provider: '', type: 'tunai' })
    setPmDialogOpen(true)
  }

  function openEditPm(pm: EditablePaymentMethod) {
    setEditingPmId(pm.id)
    setPmForm({ name: pm.name, provider: pm.provider, type: pm.type })
    setPmDialogOpen(true)
  }

  function savePm() {
    if (!pmForm.name || !pmForm.provider) return
    if (editingPmId) {
      setEditablePaymentMethods((prev) =>
        prev.map((pm) => (pm.id === editingPmId ? { ...pm, name: pmForm.name, provider: pmForm.provider, type: pmForm.type } : pm))
      )
    } else {
      setEditablePaymentMethods((prev) => [...prev, { id: crypto.randomUUID(), name: pmForm.name, provider: pmForm.provider, type: pmForm.type }])
    }
    setPmDialogOpen(false)
  }

  function deletePm(id: string) {
    setEditablePaymentMethods((prev) => prev.filter((pm) => pm.id !== id))
  }

  function addCashCategory() {
    const name = prompt('Nama kategori kas:')
    if (!name?.trim()) return
    const type = confirm('Jenis Pemasukan? (Cancel = Pengeluaran)') ? 'Pemasukan' as const : 'Pengeluaran' as const
    setEditableCashCategories((prev) => [...prev, { id: crypto.randomUUID(), name: name.trim(), type }])
  }

  function removeCashCategory(id: string) {
    setEditableCashCategories((prev) => prev.filter((cc) => cc.id !== id))
  }

  function openEditPerson(type: 'customer' | 'supplier') {
    const data = type === 'customer' ? editableCustomer : editableSupplier
    setEditPersonOpen(type)
    setPersonForm({ ...data })
  }

  function savePerson() {
    if (!personForm.name || !personForm.phone) return
    if (editPersonOpen === 'customer') {
      setEditableCustomer({ name: personForm.name, phone: personForm.phone, city: personForm.city })
    } else {
      setEditableSupplier({ name: personForm.name, phone: personForm.phone, city: personForm.city })
    }
    setEditPersonOpen(null)
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 flex items-center justify-center">
      <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[280px_1fr]">

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
                    {step === 3 && 'Sesuaikan produk, kategori, dan data lainnya sebelum simpan.'}
                    {step === 4 && 'Centang metode pembayaran yang aktif digunakan.'}
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

              {/* Step 2: Pick template */}
              {step === 2 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(TEMPLATE_META).map(([key, meta]) => {
                    const Icon = meta.icon
                    return (
                      <div
                        key={key}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 ${template === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                        onClick={() => handleTemplateChange(key)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{meta.label}</div>
                            <div className="text-xs text-muted-foreground">{meta.desc}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {TEMPLATE_PRESETS[key].products.length} produk &middot; {TEMPLATE_PRESETS[key].categories.length} kategori &middot; {TEMPLATE_PRESETS[key].paymentMethods.length} pembayaran
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Step 3: CRUD review */}
              {step === 3 && (
                <div className="space-y-5">

                  {/* Products */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-1.5"><Package className="size-4" /> Produk ({editableProducts.length})</h4>
                      <Button variant="outline" size="sm" onClick={openAddProduct}>+ Produk</Button>
                    </div>
                    {editableProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada produk.</p>
                    ) : (
                      <div className="border rounded-xl overflow-hidden text-sm">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2 font-medium">Nama</th>
                              <th className="text-left p-2 font-medium">Kategori</th>
                              <th className="text-right p-2 font-medium">Harga</th>
                              <th className="w-20 text-center p-2 font-medium">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editableProducts.map((p) => (
                              <tr key={p.id} className="border-t">
                                <td className="p-2">{p.name}</td>
                                <td className="p-2 text-muted-foreground">{p.category}</td>
                                <td className="p-2 text-right"><Rupiah amount={p.price} /></td>
                                <td className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button type="button" onClick={() => openEditProduct(p)} className="text-primary hover:underline"><Edit className="size-3.5" /></button>
                                    <button type="button" onClick={() => deleteProduct(p.id)} className="text-destructive hover:underline"><Trash2 className="size-3.5" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Categories */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-1.5"><Building2 className="size-4" /> Kategori Produk ({editableCategories.length})</h4>
                      <Button variant="outline" size="sm" onClick={addCategory}>+ Kategori</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {editableCategories.map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-xs gap-1 pr-1">
                          {c.name}
                          <button type="button" onClick={() => removeCategory(c.id)} className="text-muted-foreground hover:text-destructive ml-0.5">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  </section>

                  {/* Payment Methods */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-1.5"><CreditCard className="size-4" /> Metode Pembayaran ({editablePaymentMethods.length})</h4>
                      <Button variant="outline" size="sm" onClick={openAddPm}>+ Pembayaran</Button>
                    </div>
                    {editablePaymentMethods.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada metode pembayaran.</p>
                    ) : (
                      <div className="border rounded-xl overflow-hidden text-sm">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2 font-medium">Nama</th>
                              <th className="text-left p-2 font-medium">Provider</th>
                              <th className="text-left p-2 font-medium">Tipe</th>
                              <th className="w-20 text-center p-2 font-medium">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editablePaymentMethods.map((pm) => (
                              <tr key={pm.id} className="border-t">
                                <td className="p-2">{pm.name}</td>
                                <td className="p-2 text-muted-foreground">{pm.provider}</td>
                                <td className="p-2 text-muted-foreground">{pm.type}</td>
                                <td className="p-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button type="button" onClick={() => openEditPm(pm)} className="text-primary hover:underline"><Edit className="size-3.5" /></button>
                                    <button type="button" onClick={() => deletePm(pm.id)} className="text-destructive hover:underline"><Trash2 className="size-3.5" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Cash Categories */}
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-1.5"><Banknote className="size-4" /> Kategori Kas ({editableCashCategories.length})</h4>
                      <Button variant="outline" size="sm" onClick={addCashCategory}>+ Kategori</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {editableCashCategories.map((cc) => (
                        <Badge key={cc.id} variant="secondary" className={`text-xs gap-1 pr-1 ${cc.type === 'Pemasukan' ? 'border-green-300' : 'border-red-300'}`}>
                          {cc.name}
                          <span className={cc.type === 'Pemasukan' ? 'text-green-600' : 'text-red-500'}>({cc.type})</span>
                          <button type="button" onClick={() => removeCashCategory(cc.id)} className="text-muted-foreground hover:text-destructive ml-0.5">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  </section>

                  {/* Customer & Supplier */}
                  <div className="grid grid-cols-2 gap-4">
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-1.5"><Users className="size-4" /> Pelanggan</h4>
                        <Button variant="outline" size="sm" onClick={() => openEditPerson('customer')}>Ubah</Button>
                      </div>
                      <div className="text-sm text-muted-foreground border rounded-xl p-3">
                        <div className="font-medium text-foreground">{editableCustomer.name}</div>
                        <div>{editableCustomer.phone}</div>
                        <div>{editableCustomer.city}</div>
                      </div>
                    </section>
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-1.5"><Truck className="size-4" /> Supplier</h4>
                        <Button variant="outline" size="sm" onClick={() => openEditPerson('supplier')}>Ubah</Button>
                      </div>
                      <div className="text-sm text-muted-foreground border rounded-xl p-3">
                        <div className="font-medium text-foreground">{editableSupplier.name}</div>
                        <div>{editableSupplier.phone}</div>
                        <div>{editableSupplier.city}</div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* Step 4: Payment method checkboxes */}
              {step === 4 && (
                <div className="space-y-4 max-w-sm">
                  {editablePaymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada metode pembayaran. Tambah di langkah sebelumnya.</p>
                  ) : (
                    editablePaymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPayments({...selectedPayments, [pm.name]: !selectedPayments[pm.name]})}>
                        <input id={`pay-${pm.id}`} type="checkbox" checked={selectedPayments[pm.name] ?? true} onChange={(e) => setSelectedPayments({...selectedPayments, [pm.name]: e.target.checked})} className="size-4" />
                        <Label htmlFor={`pay-${pm.id}`} className="flex-1 cursor-pointer">{pm.name} <span className="text-xs text-muted-foreground">({pm.provider})</span></Label>
                      </div>
                    ))
                  )}
                </div>
              )}

            </CardContent>

            {/* Product Dialog */}
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProductId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
                  <DialogDescription>Sesuaikan produk untuk template ini.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nama Produk</Label>
                    <Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="Nama produk" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {editableCategories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select value={productForm.type} onValueChange={(v) => setProductForm({...productForm, type: v as EditableProduct['type'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Produk Fisik">Produk Fisik</SelectItem>
                        <SelectItem value="Jasa">Jasa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Harga</Label>
                    <Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="10000" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Batal</Button>
                  <Button onClick={saveProduct} disabled={!productForm.name || !productForm.price}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Payment Method Dialog */}
            <Dialog open={pmDialogOpen} onOpenChange={setPmDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPmId ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</DialogTitle>
                  <DialogDescription>Sesuaikan metode pembayaran untuk template ini.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input value={pmForm.name} onChange={e => setPmForm({...pmForm, name: e.target.value})} placeholder="QRIS" />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Input value={pmForm.provider} onChange={e => setPmForm({...pmForm, provider: e.target.value})} placeholder="GoPay / Bank / Tunai" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select value={pmForm.type} onValueChange={(v) => setPmForm({...pmForm, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tunai">Tunai</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                        <SelectItem value="kartu">Kartu</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="ewallet">E-Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPmDialogOpen(false)}>Batal</Button>
                  <Button onClick={savePm} disabled={!pmForm.name || !pmForm.provider}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Person Edit Dialog */}
            <Dialog open={editPersonOpen !== null} onOpenChange={(open) => { if (!open) setEditPersonOpen(null) }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ubah {editPersonOpen === 'customer' ? 'Pelanggan' : 'Supplier'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input value={personForm.name} onChange={e => setPersonForm({...personForm, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telepon</Label>
                    <Input value={personForm.phone} onChange={e => setPersonForm({...personForm, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kota</Label>
                    <Input value={personForm.city} onChange={e => setPersonForm({...personForm, city: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditPersonOpen(null)}>Batal</Button>
                  <Button onClick={savePerson} disabled={!personForm.name || !personForm.phone}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
