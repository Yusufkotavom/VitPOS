import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Store, ShoppingCart, Coffee, Monitor, Image as ImageIcon, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { settingRepository } from '@/services/local-db/repository'
import { fileToDataUrl, uploadImageToR2 } from '@/services/upload.service'

const ICONS = [
  { id: 'Store', component: Store },
  { id: 'ShoppingCart', component: ShoppingCart },
  { id: 'Coffee', component: Coffee },
  { id: 'Monitor', component: Monitor },
]

const fields = [
  { id: 'company-icon', label: 'Ikon Usaha', type: 'icon' },
  { id: 'company-logo', label: 'Logo Perusahaan', type: 'image' },
  { id: 'company-name', label: 'Nama Usaha', placeholder: 'Toko Sumber Rejeki', type: 'input' },
  { id: 'company-phone', label: 'Nomor Telepon', placeholder: '08xxxxxxxxxx', type: 'input' },
  { id: 'company-address', label: 'Alamat Usaha', placeholder: 'Alamat lengkap toko', type: 'textarea' },
  { id: 'company-tax-number', label: 'NPWP / NIB', placeholder: 'Nomor legal usaha', type: 'input' },
] as const

type FieldId = typeof fields[number]['id']
type FormValues = Record<FieldId, string>

function emptyValues(): FormValues {
  return fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {} as FormValues)
}

export function CompanySettingsForm() {
  const rawSettings = useSettings()
  const settings = useMemo(() => rawSettings ?? [], [rawSettings])
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (hydrated.current || settings.length === 0) return
    const vals = emptyValues()
    for (const field of fields) {
      vals[field.id] = settings.find((s) => s.id === field.id)?.value ?? (field.id === 'company-icon' ? 'Store' : '')
    }
    setValues(vals)
    hydrated.current = true
  }, [settings])

  function setField(field: FieldId, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WebP')
      return
    }
    setPendingLogoFile(file)
    void fileToDataUrl(file).then((dataUrl) => setField('company-logo', dataUrl))
  }

  function clearImage() {
    setField('company-logo', '')
    setPendingLogoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    try {
      let companyLogo = values['company-logo']
      if (pendingLogoFile) {
        try {
          companyLogo = await uploadImageToR2(pendingLogoFile, 'company')
          setField('company-logo', companyLogo)
          setPendingLogoFile(null)
        } catch {
          companyLogo = await fileToDataUrl(pendingLogoFile)
          toast.warning('Gagal upload ke cloud, logo disimpan lokal. Konfigurasi R2 untuk cloud storage.')
        }
      }
      for (const field of fields) {
        const value = field.id === 'company-logo' ? companyLogo : values[field.id]
        await settingRepository.upsert({
          id: field.id,
          tenantId: resolveTenantId(settings.find((setting) => setting.id === field.id)?.tenantId),
          area: 'Profil Usaha',
          setting: field.label,
          value,
          status: value.trim() ? 'Lengkap' : 'Belum Lengkap',
          updatedAt: now,
        })
      }
      toast.success('Pengaturan usaha disimpan')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan usaha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Profil Usaha</h2>
          <p className="text-sm text-muted-foreground">Data ini dipakai untuk struk, invoice, cabang, dan dokumen transaksi.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => {
          if (field.type === 'icon') {
            return (
              <div key={field.id} className="flex flex-col gap-1.5 text-sm font-medium">
                <label>{field.label}</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(({ id, component: IconComponent }) => (
                    <Button
                      key={id}
                      type="button"
                      onClick={() => setField('company-icon', id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md border transition-all ${values['company-icon'] === id ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'text-muted-foreground hover:border-primary/50'}`}
                    >
                      <IconComponent className="size-5" />
                    </Button>
                  ))}
                </div>
              </div>
            )
          }

          if (field.type === 'image') {
            return (
              <div key={field.id} className="flex flex-col gap-1.5 text-sm font-medium">
                <label>{field.label}</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                    {values['company-logo'] ? (
                      <img src={values['company-logo']} alt="Logo Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="size-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 size-4" />
                      Pilih Foto
                    </Button>
                    {values['company-logo'] && (
                      <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-xs text-destructive hover:text-destructive" onClick={clearImage}>
                        Hapus Gambar
                      </Button>
                    )}
                  </div>
                </div>
                {pendingLogoFile && (
                  <p className="text-xs text-amber-600 font-medium">Logo baru akan diupload ke cloud saat disimpan.</p>
                )}
              </div>
            )
          }

          return (
            <label key={field.id} className={field.type === 'textarea' ? 'flex flex-col gap-1.5 text-sm font-medium md:col-span-2' : 'flex flex-col gap-1.5 text-sm font-medium'}>
              {field.label}
              {field.type === 'textarea' ? (
                <Textarea value={values[field.id]} placeholder={field.placeholder} rows={2} onChange={(event) => setField(field.id, event.target.value)} />
              ) : (
                <Input value={values[field.id]} placeholder={field.placeholder} onChange={(event) => setField(field.id, event.target.value)} />
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
