import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessIdentityForm, type BusinessIdentityFormValue } from '@/features/auth/components/onboarding/business-identity-form'
import { BusinessModeSelector } from '@/features/auth/components/onboarding/business-mode-selector'
import { PostSetupChecklist } from '@/features/auth/components/onboarding/post-setup-checklist'
import { SetupReviewPanel } from '@/features/auth/components/onboarding/setup-review-panel'
import { TemplatePreviewCard } from '@/features/auth/components/onboarding/template-preview-card'
import { VerticalSelector } from '@/features/auth/components/onboarding/vertical-selector'
import { BUSINESS_PLAYBOOKS, DEFAULT_BUSINESS_MODE, DEFAULT_VERTICAL, type BusinessModeId, type BusinessVerticalId } from '@/features/auth/data/business-playbooks'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { apiPost } from '@/services/api/client'
import { localDb } from '@/services/local-db/client'
import { settingRepository } from '@/services/local-db/repository'
import { buildAtkPrintingSeed } from '@/services/local-db/seed-playbooks'
import { enqueueOutboxItem } from '@/services/sync/outbox-service'

type Uuid = ReturnType<typeof crypto.randomUUID>

type RegisterResponse = {
  ok: boolean
  defaultBranchId?: Uuid
  defaultWarehouseId?: Uuid
  user: { id: string; email: string; name: string; role?: 'user' | 'platform_admin' }
  memberships: Array<{ tenantId: Uuid; role: string; tenantName: string; tenantPlan: string }>
}

const steps = [
  { id: 1, title: 'Pilih jenis usaha' },
  { id: 2, title: 'Pilih model usaha' },
  { id: 3, title: 'Data inti usaha' },
  { id: 4, title: 'Preview template' },
  { id: 5, title: 'Review setup' },
]

const initialIdentity: BusinessIdentityFormValue = {
  tenantName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  whatsapp: '',
  address: '',
}

function clonePreset(modeId: BusinessModeId) {
  const seed = buildAtkPrintingSeed({
    tenantId: crypto.randomUUID(),
    businessMode: modeId,
    tenantName: 'Preview Template',
    ownerName: 'Preview Owner',
    city: 'Surabaya',
    initialCash: 500000,
    seedIdPrefix: 'preview',
  })

  return {
    categories: seed.categories.map(({ id, name }) => ({ id, name })),
    products: seed.products.map(({ id, name, category, type, price, costPrice, stock }) => ({ id, name, category, type, price, cost: costPrice, stock })),
    paymentMethods: seed.paymentMethods.map(({ id, name, provider, type }) => ({ id, name, provider, type })),
    cashCategories: seed.cashCategories.map(({ id, name, type }) => ({ id, name, type })),
    customer: { ...seed.customers[0] },
    supplier: { ...seed.suppliers[0] },
  }
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { currentUser, setAuth, setActiveTenant } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [businessVertical, setBusinessVertical] = useState<BusinessVerticalId>(DEFAULT_VERTICAL)
  const [businessMode, setBusinessMode] = useState<BusinessModeId>(DEFAULT_BUSINESS_MODE)
  const [identityForm, setIdentityForm] = useState<BusinessIdentityFormValue>(initialIdentity)
  const [loading, setLoading] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<Record<string, boolean>>({})
  const [editable, setEditable] = useState(() => clonePreset(DEFAULT_BUSINESS_MODE))

  const activeVertical = BUSINESS_PLAYBOOKS[businessVertical]
  const activeMode = activeVertical.modes.find((mode) => mode.id === businessMode) ?? activeVertical.modes[0]
  const canGoNextStep3 = identityForm.tenantName.trim() !== '' && identityForm.whatsapp.trim() !== '' && (currentUser || (identityForm.ownerName && identityForm.ownerEmail && identityForm.ownerPassword))
  const canProceed = step === 3 ? Boolean(canGoNextStep3) : true

  const previewItems = useMemo(() => [
    { label: 'Kategori', value: String(editable.categories.length) },
    { label: 'Produk / jasa', value: String(editable.products.length) },
    { label: 'Pembayaran', value: String(editable.paymentMethods.length) },
    { label: 'Kas awal', value: 'Rp 500.000' },
  ], [editable])

  function handleModeChange(value: BusinessModeId) {
    const next = clonePreset(value)
    setBusinessMode(value)
    setEditable(next)
    setSelectedPayments(Object.fromEntries(next.paymentMethods.map((item) => [item.name, true])))
  }

  async function handleFinish() {
    if (loading) return

    setLoading(true)
    setError(null)
    const now = new Date().toISOString()

    try {
      const normalizedName = (currentUser?.name ?? identityForm.ownerName).trim()
      const normalizedEmail = (currentUser?.email ?? identityForm.ownerEmail).trim().toLowerCase()
      const normalizedPassword = currentUser?.passwordHash ?? identityForm.ownerPassword

      if (!currentUser) {
        const existingUser = await localDb.users.where('email').equals(normalizedEmail).first()
        if (existingUser) throw new Error('Email sudah terdaftar. Silakan login dulu.')
      }

      const membershipCount = currentUser ? await localDb.tenantMembers.where('userId').equals(currentUser.id).count() : 0
      const shouldProvisionCloudTenant = membershipCount === 0
      let tenantId = crypto.randomUUID()
      let cloudUser: RegisterResponse['user'] | undefined
      let defaultBranchId: string | undefined
      let defaultWarehouseId: string | undefined
      let tenantRole = 'owner'

      if (shouldProvisionCloudTenant) {
        let registerResponse: RegisterResponse | null = null
        try {
          registerResponse = await apiPost<RegisterResponse>('/auth/register', {
            name: normalizedName,
            email: normalizedEmail,
            password: normalizedPassword,
            tenantName: identityForm.tenantName.trim(),
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : ''
          if (!/409|already registered|email sudah terdaftar/i.test(message)) throw err
          registerResponse = await apiPost<RegisterResponse>('/auth/login', { email: normalizedEmail, password: normalizedPassword })
        }

        if (!registerResponse?.memberships?.[0]) throw new Error('Membership cloud tidak ditemukan setelah registrasi')
        cloudUser = registerResponse.user
        tenantId = registerResponse.memberships[0].tenantId
        tenantRole = registerResponse.memberships[0].role
        defaultBranchId = registerResponse.defaultBranchId
        defaultWarehouseId = registerResponse.defaultWarehouseId
      } else {
        const res = await apiPost<{ ok: boolean; tenantId: Uuid; defaultBranchId: Uuid; defaultWarehouseId: Uuid }>('/tenants', {
          id: tenantId,
          name: identityForm.tenantName.trim(),
        })
        if (!res?.ok) throw new Error('Gagal mendaftarkan unit usaha baru di server cloud.')
        tenantId = res.tenantId
        defaultBranchId = res.defaultBranchId
        defaultWarehouseId = res.defaultWarehouseId
      }

      const nextUser = {
        id: cloudUser?.id ?? currentUser?.id ?? crypto.randomUUID(),
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: normalizedPassword,
        role: currentUser?.role ?? cloudUser?.role,
        createdAt: currentUser?.createdAt ?? now,
        updatedAt: now,
      }
      await localDb.users.put(nextUser)
      if (currentUser && currentUser.id !== nextUser.id) await localDb.users.delete(currentUser.id)
      setAuth(nextUser)

      const tenant = {
        id: tenantId,
        name: identityForm.tenantName.trim(),
        type: businessMode,
        phone: identityForm.whatsapp,
        planCode: 'trial',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
      await localDb.tenants.put(tenant)
      await localDb.tenantMembers.put({ id: crypto.randomUUID(), tenantId, userId: nextUser.id, role: 'owner', isActive: true, createdAt: now, updatedAt: now })
      setActiveTenant(tenant, tenantRole)

      for (const category of editable.categories) {
        const id = crypto.randomUUID()
        await localDb.productCategories.put({ id, tenantId, name: category.name, description: '', status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: now })
        await enqueueOutboxItem({ entityType: 'product_category', entityId: id, mutationType: 'create', payload: { name: category.name } })
      }
      for (const product of editable.products) {
        const id = crypto.randomUUID()
        await localDb.products.put({ id, tenantId, name: product.name, category: product.category, type: product.type, price: product.price, costPrice: product.cost, stock: product.stock, manageStock: product.type === 'Produk Fisik', status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: now })
        await enqueueOutboxItem({ entityType: 'product', entityId: id, mutationType: 'create', payload: { name: product.name, category: product.category, type: product.type, price: product.price } })
      }
      for (const paymentMethod of editable.paymentMethods) {
        if (selectedPayments[paymentMethod.name] === false) continue
        const id = crypto.randomUUID()
        await localDb.paymentMethods.put({ id, tenantId, name: paymentMethod.name, provider: paymentMethod.provider, type: paymentMethod.type, status: 'Aktif', updatedAt: now })
        await enqueueOutboxItem({ entityType: 'setting', entityId: id, mutationType: 'create', payload: { key: `payment_method_${paymentMethod.name}`, value: paymentMethod.name, area: 'payment' } })
      }
      for (const cashCategory of editable.cashCategories) {
        const id = crypto.randomUUID()
        await localDb.cashCategories.put({ id, tenantId, name: cashCategory.name, type: cashCategory.type, status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: now })
        await enqueueOutboxItem({ entityType: 'cash_category', entityId: id, mutationType: 'create', payload: { name: cashCategory.name, type: cashCategory.type } })
      }

      await localDb.customers.put({ id: crypto.randomUUID(), tenantId, name: 'Pelanggan Umum', phone: identityForm.whatsapp, city: 'Surabaya', receivable: 0, orders: 0, status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: now })
      await localDb.suppliers.put({ id: crypto.randomUUID(), tenantId, name: 'Supplier ATK Utama', phone: '', city: 'Surabaya', payable: 0, orders: 0, status: 'Aktif', syncStatus: 'pending', version: 1, updatedAt: now })

      for (const setting of [
        { id: 'company-name', area: 'Profil Usaha', setting: 'Nama Usaha', value: identityForm.tenantName.trim() },
        { id: 'company-phone', area: 'Profil Usaha', setting: 'Nomor Telepon', value: identityForm.whatsapp },
        { id: 'company-address', area: 'Profil Usaha', setting: 'Alamat Usaha', value: identityForm.address },
        { id: 'company-tax-number', area: 'Profil Usaha', setting: 'NPWP / NIB', value: '' },
        { id: 'company-icon', area: 'Profil Usaha', setting: 'Ikon Usaha', value: 'Store' },
        { id: 'business-vertical', area: 'System', setting: 'business_vertical', value: businessVertical },
        { id: 'business-mode', area: 'System', setting: 'business_mode', value: businessMode },
        { id: 'initial-cash', area: 'Kas', setting: 'kas_awal', value: '500000' },
        { id: 'receipt-header', area: 'Struk', setting: 'Header Struk (POS)', value: '' },
        { id: 'receipt-footer', area: 'Struk', setting: 'Footer Struk (POS)', value: 'Terima kasih atas kunjungan Anda.' },
        { id: 'invoice-term', area: 'Invoice', setting: 'Catatan / Term Invoice', value: 'Syarat & Ketentuan berlaku.' },
      ]) {
        await settingRepository.upsert({ ...setting, status: 'Lengkap', updatedAt: now, tenantId })
      }

      if (defaultBranchId) await settingRepository.upsert({ id: `${tenantId}:default-branch-id`, area: 'System', setting: 'default_branch_id', value: defaultBranchId, status: 'Lengkap', updatedAt: now, tenantId })
      if (defaultWarehouseId) await settingRepository.upsert({ id: `${tenantId}:default-warehouse-id`, area: 'System', setting: 'default_warehouse_id', value: defaultWarehouseId, status: 'Lengkap', updatedAt: now, tenantId })
      navigate('/dashboard')
    } catch (err) {
      setError(`Terjadi kesalahan saat menyimpan data: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 flex items-center justify-center">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Progress Setup</CardTitle>
            <CardDescription>Langkah {step} dari {steps.length}</CardDescription>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(step / steps.length) * 100}%` }} />
            </div>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {steps.map((item) => (
                <li key={item.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${step === item.id ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <div className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${step === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > item.id ? <CheckCircle2 className="size-4" /> : item.id}
                  </div>
                  <span className="text-sm font-medium">{item.title}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="min-h-[460px] flex flex-col">
          <CardHeader>
            <CardTitle>{steps[step - 1].title}</CardTitle>
            <CardDescription>
              {step === 1 ? 'Pilih vertikal usaha yang paling sesuai, atau lewati untuk mengatur nanti.' : step === 2 ? 'Pilih mode usaha ATK & printing yang paling dekat dengan kebutuhan toko.' : step === 3 ? 'Lengkapi nama, nomor, dan alamat usaha.' : step === 4 ? 'Cek ringkasan template sebelum masuk review.' : 'Pastikan semua data sudah siap disimpan.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            {error ? <div className="rounded bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div> : null}
            {step === 1 ? <VerticalSelector verticals={Object.values(BUSINESS_PLAYBOOKS)} selectedVertical={businessVertical} onSelect={setBusinessVertical} onSkip={() => setStep(3)} /> : null}
            {step === 2 ? <BusinessModeSelector modes={activeVertical.modes} selectedMode={businessMode} onSelect={handleModeChange} /> : null}
            {step === 3 ? <BusinessIdentityForm value={identityForm} showOwnerFields={!currentUser} onChange={setIdentityForm} /> : null}
            {step === 4 ? <TemplatePreviewCard title={activeMode.label} description={activeMode.description} items={previewItems} /> : null}
            {step === 5 ? (
              <div className="space-y-4">
                <SetupReviewPanel title="Data usaha" items={[{ label: 'Nama usaha', value: identityForm.tenantName || '-' }, { label: 'WhatsApp', value: identityForm.whatsapp || '-' }, { label: 'Alamat', value: identityForm.address || '-' }]} onEdit={() => setStep(3)} />
                <SetupReviewPanel title="Template aktif" items={[{ label: 'Vertikal', value: activeVertical.label }, { label: 'Mode', value: activeMode.label }, { label: 'Produk / jasa', value: String(editable.products.length) }, { label: 'Pembayaran aktif', value: String(Object.values(selectedPayments).filter(Boolean).length || editable.paymentMethods.length) }]} onEdit={() => setStep(4)} />
                <PostSetupChecklist />
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t bg-muted/20 p-6">
            {step > 1 ? <Button variant="outline" onClick={() => setStep(step - 1)}>Kembali</Button> : <Button variant="outline" asChild><Link to="/login">Ke Login</Link></Button>}
            {step < steps.length ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>Lanjut <ChevronRight className="ml-2 size-4" /></Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading}>{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Masuk dan mulai transaksi <ChevronRight className="ml-2 size-4" /></Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
