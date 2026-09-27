import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSuppliers } from '@/features/suppliers/hooks/use-suppliers'
import { supplierRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import type { LocalSupplier } from '@/services/local-db/schema'

export function SupplierSelect({
  id,
  value,
  onChange,
  invalid,
  placeholder,
  ariaLabel,
}: {
  id?: string
  value: string
  onChange: (name: string, supplierId?: string) => void
  invalid?: boolean
  placeholder?: string
  ariaLabel?: string
}) {
  const { t } = useTranslation()
  const suppliers = useSuppliers()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [newSupplierCity, setNewSupplierCity] = useState('')
  const [saving, setSaving] = useState(false)

  const activeSuppliers = suppliers.filter((s) => s.status === 'Aktif' || !s.status)

  async function handleQuickAddSupplier(e: React.FormEvent) {
    e.preventDefault()
    const name = newSupplierName.trim()
    if (!name) {
      toast.error('Nama supplier wajib diisi')
      return
    }

    setSaving(true)
    try {
      const tenantId = requireActiveTenantId()
      const supplierId = crypto.randomUUID()
      const newSupplier: LocalSupplier = {
        id: supplierId,
        tenantId,
        name,
        phone: newSupplierPhone.trim(),
        city: newSupplierCity.trim(),
        payable: 0,
        orders: 0,
        status: 'Aktif',
        syncStatus: 'pending',
        version: 1,
        updatedAt: new Date().toISOString(),
      }
      await supplierRepository.upsert(newSupplier)
      onChange(name, supplierId)
      toast.success(t('suppliers.added') || 'Supplier berhasil ditambahkan')
      setQuickAddOpen(false)
      setNewSupplierName('')
      setNewSupplierPhone('')
      setNewSupplierCity('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan supplier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 min-w-0">
          <Combobox
            items={activeSuppliers}
            value={value}
            onValueChange={(val) => {
              const matched = activeSuppliers.find((s) => s.name.toLowerCase() === val.toLowerCase())
              onChange(val, matched?.id)
            }}
          >
            <ComboboxInput
              id={id}
              placeholder={placeholder || 'Pilih atau ketik supplier...'}
              aria-label={ariaLabel}
              aria-invalid={invalid || undefined}
              value={value}
              onChange={(e) => {
                const val = e.target.value
                const matched = activeSuppliers.find((s) => s.name.toLowerCase() === val.toLowerCase())
                onChange(val, matched?.id)
              }}
            />
            <ComboboxContent>
              {activeSuppliers.length === 0 ? (
                <ComboboxEmpty>Belum ada supplier tersimpan</ComboboxEmpty>
              ) : (
                <ComboboxList>
                  {(item: unknown) => {
                    const s = item as LocalSupplier
                    return (
                      <ComboboxItem
                        key={s.id}
                        value={s.name}
                        onSelect={() => {
                          onChange(s.name, s.id)
                        }}
                      >
                        <div className="flex w-full items-center justify-between gap-2 text-left">
                          <span className="font-medium truncate">{s.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {s.phone ? s.phone : s.city ? s.city : ''}
                          </span>
                        </div>
                      </ComboboxItem>
                    )
                  }}
                </ComboboxList>
              )}
            </ComboboxContent>
          </Combobox>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => {
            setNewSupplierName(value || '')
            setQuickAddOpen(true)
          }}
          title="Tambah Supplier Cepat (+)"
          aria-label="Tambah Supplier Cepat"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>

      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleQuickAddSupplier} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Tambah Supplier Cepat</DialogTitle>
              <DialogDescription>
                Supplier baru akan disimpan dan langsung dipilih untuk purchase order ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="quick-supplier-name">
                  Nama Supplier <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quick-supplier-name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Contoh: PT Sumber Pangan"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-supplier-phone">Nomor Telepon / WhatsApp</Label>
                <Input
                  id="quick-supplier-phone"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quick-supplier-city">Kota / Alamat</Label>
                <Input
                  id="quick-supplier-city"
                  value={newSupplierCity}
                  onChange={(e) => setNewSupplierCity(e.target.value)}
                  placeholder="Contoh: Surabaya"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setQuickAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Supplier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
