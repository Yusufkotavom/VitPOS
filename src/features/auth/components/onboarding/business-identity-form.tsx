import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/shared/components/forms/currency-input'

export type BusinessIdentityFormValue = {
  tenantName: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
  whatsapp: string
  city: string
  address: string
  openHours: string
  initialCash: string
}

export function BusinessIdentityForm({ value, showOwnerFields, onChange }: { value: BusinessIdentityFormValue; showOwnerFields: boolean; onChange: (next: BusinessIdentityFormValue) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {showOwnerFields ? (
        <>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="owner-name">Nama owner</Label>
            <Input id="owner-name" value={value.ownerName} onChange={(event) => onChange({ ...value, ownerName: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-email">Email owner</Label>
            <Input id="owner-email" type="email" value={value.ownerEmail} onChange={(event) => onChange({ ...value, ownerEmail: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-password">Kata sandi owner</Label>
            <Input id="owner-password" type="password" value={value.ownerPassword} onChange={(event) => onChange({ ...value, ownerPassword: event.target.value })} />
          </div>
        </>
      ) : null}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="business-name">Nama usaha</Label>
        <Input id="business-name" value={value.tenantName} onChange={(event) => onChange({ ...value, tenantName: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-whatsapp">WhatsApp usaha</Label>
        <Input id="business-whatsapp" value={value.whatsapp} onChange={(event) => onChange({ ...value, whatsapp: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-city">Kota</Label>
        <Input id="business-city" value={value.city} onChange={(event) => onChange({ ...value, city: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="business-address">Alamat usaha</Label>
        <Input id="business-address" value={value.address} onChange={(event) => onChange({ ...value, address: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-open-hours">Jam buka</Label>
        <Input id="business-open-hours" value={value.openHours} onChange={(event) => onChange({ ...value, openHours: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-cash">Kas awal</Label>
        <CurrencyInput prefix="Rp" value={value.initialCash} onValueChange={(amount) => onChange({ ...value, initialCash: String(amount) })} />
      </div>
    </div>
  )
}
