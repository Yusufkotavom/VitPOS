import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { settingRepository } from '@/services/local-db/repository'

const fields = [
  { id: 'company-name', label: 'Nama Usaha', placeholder: 'Toko Sumber Rejeki', type: 'input' },
  { id: 'company-phone', label: 'Nomor Telepon', placeholder: '08xxxxxxxxxx', type: 'input' },
  { id: 'company-address', label: 'Alamat Usaha', placeholder: 'Alamat lengkap toko', type: 'textarea' },
  { id: 'company-tax-number', label: 'NPWP / NIB', placeholder: 'Nomor legal usaha', type: 'input' },
  { id: 'invoice-prefix', label: 'Prefix Invoice', placeholder: 'INV', type: 'input' },
  { id: 'invoice-term', label: 'Catatan / Term Invoice (A4)', placeholder: 'Syarat & Ketentuan. Barang yang sudah dibeli tidak dapat ditukar.', type: 'textarea' },
  { id: 'receipt-header', label: 'Header Struk (POS)', placeholder: 'Selamat Datang di Toko Kami', type: 'textarea' },
  { id: 'receipt-footer', label: 'Footer Struk (POS)', placeholder: 'Terima kasih sudah berbelanja', type: 'textarea' },
] as const

type FieldId = typeof fields[number]['id']
type FormValues = Record<FieldId, string>

function emptyValues(): FormValues {
  return fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {} as FormValues)
}

export function CompanySettingsForm() {
  const rawSettings = useSettings()
  const settings = useMemo(() => rawSettings ?? [], [rawSettings])
  const initialValues = useMemo(() => {
    const values = emptyValues()
    for (const field of fields) {
      values[field.id] = settings.find((setting) => setting.id === field.id)?.value ?? ''
    }
    return values
  }, [settings])
  const [values, setValues] = useState<FormValues>(initialValues)
  const [saving, setSaving] = useState(false)

  function setField(field: FieldId, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    try {
      for (const field of fields) {
        await settingRepository.upsert({
          id: field.id,
          area: 'Profil Usaha',
          setting: field.label,
          value: values[field.id],
          status: values[field.id].trim() ? 'Lengkap' : 'Belum Lengkap',
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
