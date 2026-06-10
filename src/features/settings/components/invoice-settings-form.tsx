import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { useSettings } from '@/features/settings/hooks/use-settings'
import { settingRepository } from '@/services/local-db/repository'

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

export function InvoiceSettingsForm() {
  const rawSettings = useSettings()
  const settings = useMemo(() => rawSettings ?? [], [rawSettings])
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current || settings.length === 0) return
    const vals = emptyValues()
    for (const field of fields) {
      vals[field.id] = settings.find((s) => s.id === field.id)?.value ?? ''
    }
    setValues(vals)
    hydrated.current = true
  }, [settings])

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
          tenantId: resolveTenantId(settings.find((setting) => setting.id === field.id)?.tenantId),
          area: 'Invoice & Struk',
          setting: field.label,
          value: values[field.id],
          status: values[field.id].trim() ? 'Lengkap' : 'Belum Lengkap',
          updatedAt: now,
        })
      }
      toast.success('Pengaturan invoice & struk disimpan')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan invoice & struk')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invoice & Struk</h2>
          <p className="text-sm text-muted-foreground">Atur prefix invoice, term, serta header/footer struk POS.</p>
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
