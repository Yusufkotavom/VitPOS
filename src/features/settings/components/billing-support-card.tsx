import { Check, Copy, ExternalLink, HelpCircle, MessageCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillingSettings } from '@/services/api/subscription.service'

export function makeWhatsappUrl(value?: string | null) {
  if (!value) return null
  if (value.startsWith('http')) return value
  const cleaned = value.replace(/[^0-9]/g, '')
  return cleaned ? `https://wa.me/${cleaned}` : null
}

export function BillingSupportCard({ settings }: { settings?: BillingSettings | null }) {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)
  const whatsappUrl = makeWhatsappUrl(settings?.supportWhatsapp)

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAccount(text)
      setTimeout(() => setCopiedAccount(null), 2500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Official Bank Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <CardTitle>Rekening Resmi Pembayaran</CardTitle>
              <CardDescription>
                Transfer pembayaran hanya ke nomor rekening resmi PT KOTACOM di bawah ini.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings?.bankAccounts && settings.bankAccounts.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {settings.bankAccounts.map((account) => {
                const isCopied = copiedAccount === account.accountNumber
                return (
                  <div
                    key={`${account.bankName}-${account.accountNumber}`}
                    className="flex items-center justify-between rounded-xl border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="space-y-0.5 overflow-hidden pr-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {account.bankName}
                      </p>
                      <p className="font-mono text-base font-bold text-foreground">
                        {account.accountNumber}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        a.n. <strong className="text-foreground">{account.accountName}</strong>
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => handleCopy(account.accountNumber)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3.5 text-emerald-600" />
                          <span className="text-xs text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span className="text-xs">Salin</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {settings?.paymentInstructions ?? 'Hubungi admin untuk rekening dan instruksi pembayaran.'}
            </p>
          )}

          {settings?.paymentInstructions && (
            <div className="mt-3 rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground whitespace-pre-line">
              <strong className="block text-foreground mb-1">Instruksi Pembayaran:</strong>
              {settings.paymentInstructions}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guide Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <CardTitle>Panduan Pembayaran & Aktivasi</CardTitle>
              <CardDescription>Langkah mudah menyelesaikan transaksi langganan.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="relative border-l border-muted-foreground/20 ml-3 space-y-4 text-sm">
            <li className="ml-5">
              <span className="absolute -left-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                1
              </span>
              <h4 className="font-semibold text-foreground">Pilih Paket Langganan</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Buka tab Paket & Langganan, pilih paket sesuai skala bisnis Anda, lalu konfirmasi di popup.
              </p>
            </li>
            <li className="ml-5">
              <span className="absolute -left-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                2
              </span>
              <h4 className="font-semibold text-foreground">Transfer Sesuai Nominal</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lakukan transfer via ATM/m-Banking ke rekening resmi di atas sesuai nominal tagihan yang tertera.
              </p>
            </li>
            <li className="ml-5">
              <span className="absolute -left-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
              <h4 className="font-semibold text-foreground">Unggah Bukti Transfer</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Masuk ke tab Riwayat Tagihan, klik tombol "Upload Bukti", dan lampirkan foto struk pembayaran.
              </p>
            </li>
            <li className="ml-5">
              <span className="absolute -left-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                4
              </span>
              <h4 className="font-semibold text-foreground">Verifikasi & Akses Aktif</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Admin akan memverifikasi dalam waktu maksimal 1x24 jam kerja dan masa aktif paket otomatis bertambah.
              </p>
            </li>
          </ol>

          {/* Support Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {whatsappUrl && (
              <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> Hubungi WhatsApp Support
                </a>
              </Button>
            )}
            {settings?.supportUrl && (
              <Button variant="outline" asChild className="gap-2">
                <a href={settings.supportUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Pusat Bantuan
                </a>
              </Button>
            )}
            {!whatsappUrl && !settings?.supportUrl && settings?.supportText && (
              <p className="text-xs text-muted-foreground">{settings.supportText}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
