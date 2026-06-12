import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { settingRepository } from '@/services/local-db/repository'
import { fileToDataUrl, uploadImageToR2 } from '@/services/upload.service'
import { invoiceThemeOptions, type InvoiceThemeName } from '@/shared/components/pdf/types'
import { invoiceThemes } from '@/shared/components/pdf/invoice-themes'

const fields = [
  { id: 'invoice-prefix', label: 'Prefix Invoice', placeholder: 'INV', type: 'input' as const },
  { id: 'invoice-term', label: 'Catatan / Term Invoice (A4)', placeholder: 'Syarat & Ketentuan. Barang yang sudah dibeli tidak dapat ditukar.', type: 'textarea' as const },
  { id: 'receipt-header', label: 'Header Struk (POS)', placeholder: 'Selamat Datang di Toko Kami', type: 'textarea' as const },
  { id: 'receipt-footer', label: 'Footer Struk (POS)', placeholder: 'Terima kasih sudah berbelanja', type: 'textarea' as const },
] as const

type FieldId = typeof fields[number]['id']
type FormValues = Record<FieldId, string>

function emptyValues(): FormValues {
  return fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {} as FormValues)
}

function isHttpUrl(str: string) {
  return str.startsWith('http://') || str.startsWith('https://')
}

export function InvoiceSettingsForm() {
  const rawSettings = useSettings()
  const settings = useMemo(() => rawSettings ?? [], [rawSettings])
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)

  const [theme, setTheme] = useState<InvoiceThemeName>('klasik')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hydrated.current || settings.length === 0) return
    const vals = emptyValues()
    for (const field of fields) {
      vals[field.id] = settings.find((s) => s.id === field.id)?.value ?? ''
    }
    setValues(vals)

    const themeRaw = settings.find((s) => s.id === 'invoice-theme')?.value
    if (themeRaw && ['klasik', 'korporat', 'modern', 'eksekutif'].includes(themeRaw)) {
      setTheme(themeRaw as InvoiceThemeName)
    }
    const savedLogo = settings.find((s) => s.id === 'invoice-logo')?.value
    if (savedLogo) setLogoUrl(savedLogo)

    hydrated.current = true
  }, [settings])

  function setField(field: FieldId, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2MB')
      return
    }
    setPendingLogoFile(file)
    void fileToDataUrl(file).then(setLogoUrl)
  }

  function handleRemoveLogo() {
    setLogoUrl(null)
    setPendingLogoFile(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    try {
      for (const field of fields) {
        await settingRepository.upsert({
          id: field.id,
          tenantId: resolveTenantId(settings.find((setting) => setting.id === field.id)?.tenantId),
          area: 'Invoice & Struk',
          setting: field.label,
          value: values[field.id],
          status: values[field.id].trim() ? 'Lengkap' : 'Belum Lengkap',
          updatedAt: now,
        })
      }

      await settingRepository.upsert({
        id: 'invoice-theme',
        tenantId: resolveTenantId(settings.find((s) => s.id === 'invoice-theme')?.tenantId),
        area: 'Invoice & Struk',
        setting: 'Tema Invoice',
        value: theme,
        status: 'Lengkap',
        updatedAt: now,
      })

      let finalLogoUrl = logoUrl

      if (pendingLogoFile) {
        try {
          finalLogoUrl = await uploadImageToR2(pendingLogoFile, 'invoices')
          setPendingLogoFile(null)
          setLogoUrl(finalLogoUrl)
        } catch {
          finalLogoUrl = await fileToDataUrl(pendingLogoFile)
          toast.warning('Gagal upload ke cloud, logo disimpan lokal. Konfigurasi R2 untuk cloud storage.')
        }
      }

      if (finalLogoUrl) {
        await settingRepository.upsert({
          id: 'invoice-logo',
          tenantId: resolveTenantId(settings.find((s) => s.id === 'invoice-logo')?.tenantId),
          area: 'Invoice & Struk',
          setting: 'Logo Invoice',
          value: finalLogoUrl,
          status: 'Lengkap',
          updatedAt: now,
        })
      } else if (settings.find((s) => s.id === 'invoice-logo')?.value) {
        await settingRepository.remove('invoice-logo')
      }

      toast.success('Pengaturan invoice & struk disimpan')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan invoice & struk')
    } finally {
      setSaving(false)
    }
  }

  const logoPreviewUrl = logoUrl && isHttpUrl(logoUrl) ? logoUrl : logoUrl

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invoice & Struk</h2>
          <p className="text-sm text-muted-foreground">Atur prefix invoice, term, tema, logo, serta header/footer struk POS.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border p-4">
        <div>
          <Label className="text-sm font-medium">Tema Invoice</Label>
          <p className="text-xs text-muted-foreground mb-3">Pilih tampilan premium untuk PDF invoice.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {invoiceThemeOptions.map((opt) => {
              const t = invoiceThemes[opt.value]
              const isActive = theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all hover:shadow-md ${
                    isActive ? 'border-primary ring-2 ring-primary/20' : 'border-transparent bg-muted/30'
                  }`}
                >
                  <div className="flex h-10 w-full items-center justify-center rounded-lg px-2 text-[10px] font-bold" style={{ backgroundColor: t.headerBg, color: t.headerTextColor === '#ffffff' || t.headerTextColor === '#f8fafc' || t.headerTextColor === '#fef2f2' ? '#fff' : '#111' }}>
                    {opt.label}
                  </div>
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{opt.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-3 rounded-xl border p-4">
        <Label className="text-sm font-medium">Logo Perusahaan</Label>
        <p className="text-xs text-muted-foreground mb-1">Upload logo untuk ditampilkan di invoice A4. Maks 2MB, format JPG/PNG/WebP.</p>
        <p className="text-xs text-muted-foreground mb-3">Otomatis tersimpan di Cloudflare R2 jika dikonfigurasi, atau lokal jika offline.</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-40 items-center justify-center rounded-lg border bg-muted/20 overflow-hidden">
            {logoUrl ? (
              <img src={logoPreviewUrl ?? undefined} alt="Logo preview" className="max-h-full max-w-full object-contain p-1" />
            ) : (
              <span className="text-[10px] text-muted-foreground">Belum ada logo</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload"
            />
            <Button variant="outline" size="sm" type="button" onClick={() => logoInputRef.current?.click()}>
              {logoUrl ? 'Ganti Logo' : 'Pilih Logo'}
            </Button>
            {logoUrl && (
              <Button variant="ghost" size="sm" type="button" onClick={handleRemoveLogo} className="text-destructive">
                Hapus Logo
              </Button>
            )}
          </div>
        </div>
        {pendingLogoFile && (
          <p className="text-xs text-amber-600 font-medium">Logo baru akan diupload ke cloud saat disimpan.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.id} className={field.type === 'textarea' ? 'flex flex-col gap-1.5 text-sm font-medium md:col-span-2' : 'flex flex-col gap-1.5 text-sm font-medium'}>
            {field.label}
            {field.type === 'textarea' ? (
              <Textarea value={values[field.id]} placeholder={field.placeholder} rows={2} onChange={(event) => setField(field.id, event.target.value)} />
            ) : (
              <Input value={values[field.id]} placeholder={field.placeholder} onChange={(event) => setField(field.id, event.target.value)} />
            )}
          </label>
        ))}
      </div>
    </div>
  )
}
