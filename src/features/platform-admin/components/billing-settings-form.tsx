import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { BillingSettings } from '@/services/api/subscription.service'

type BankAccount = { bankName: string; accountName: string; accountNumber: string }

export function BillingSettingsForm({ settings, isSubmitting, onSubmit }: { settings?: BillingSettings | null; isSubmitting?: boolean; onSubmit: (settings: BillingSettings) => void }) {
  const [supportWhatsapp, setSupportWhatsapp] = useState(settings?.supportWhatsapp ?? '')
  const [supportUrl, setSupportUrl] = useState(settings?.supportUrl ?? '')
  const [supportText, setSupportText] = useState(settings?.supportText ?? '')
  const [paymentInstructions, setPaymentInstructions] = useState(settings?.paymentInstructions ?? '')
  const [bankAccountsText, setBankAccountsText] = useState(() => JSON.stringify(settings?.bankAccounts ?? [], null, 2))

  const bankAccounts = useMemo<BankAccount[]>(() => {
    try {
      const parsed = JSON.parse(bankAccountsText)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [bankAccountsText])

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ supportWhatsapp, supportUrl, supportText, paymentInstructions, bankAccounts })
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          WhatsApp Support
          <Input value={supportWhatsapp} onChange={(event) => setSupportWhatsapp(event.target.value)} placeholder="6281234567890" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          URL Support
          <Input value={supportUrl} onChange={(event) => setSupportUrl(event.target.value)} placeholder="https://..." />
        </label>
      </div>
      <label className="space-y-1 text-sm font-medium">
        Teks Support
        <Textarea value={supportText} onChange={(event) => setSupportText(event.target.value)} placeholder="Hubungi tim billing untuk bantuan pembayaran." />
      </label>
      <label className="space-y-1 text-sm font-medium">
        Instruksi Pembayaran
        <Textarea value={paymentInstructions} onChange={(event) => setPaymentInstructions(event.target.value)} placeholder="Transfer ke rekening berikut lalu upload bukti bayar." />
      </label>
      <label className="space-y-1 text-sm font-medium">
        Rekening Bank (JSON)
        <Textarea className="font-mono" rows={6} value={bankAccountsText} onChange={(event) => setBankAccountsText(event.target.value)} />
      </label>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan Billing'}</Button>
    </form>
  )
}
