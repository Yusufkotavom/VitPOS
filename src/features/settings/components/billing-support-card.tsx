import { ExternalLink, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillingSettings } from '@/services/api/subscription.service'

export function makeWhatsappUrl(value?: string | null) {
  if (!value) return null
  if (value.startsWith('http')) return value
  const cleaned = value.replace(/[^0-9]/g, '')
  return cleaned ? `https://wa.me/${cleaned}` : null
}

export function BillingSupportCard({ settings }: { settings?: BillingSettings | null }) {
  const whatsappUrl = makeWhatsappUrl(settings?.supportWhatsapp)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bantuan & Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="whitespace-pre-line text-muted-foreground">
          {settings?.paymentInstructions ?? 'Hubungi admin untuk instruksi pembayaran.'}
        </p>
        {settings?.bankAccounts?.length ? (
          <div className="space-y-2">
            {settings.bankAccounts.map((account) => (
              <div key={`${account.bankName}-${account.accountNumber}`} className="rounded-lg border p-3">
                <p className="font-medium">{account.bankName}</p>
                <p>{account.accountNumber}</p>
                <p className="text-muted-foreground">a.n. {account.accountName}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {whatsappUrl ? (
            <Button asChild>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 size-4" /> Hubungi Support
              </a>
            </Button>
          ) : null}
          {settings?.supportUrl ? (
            <Button variant="outline" asChild>
              <a href={settings.supportUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" /> Buka Bantuan
              </a>
            </Button>
          ) : null}
          {!whatsappUrl && !settings?.supportUrl && settings?.supportText ? (
            <p className="text-muted-foreground">{settings.supportText}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
