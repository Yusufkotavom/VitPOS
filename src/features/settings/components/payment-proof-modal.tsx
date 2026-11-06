import {
  AlertCircle,
  Check,
  Copy,
  FileText,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadImage } from '@/services/upload.service'
import type { BillingSettings, SubscriptionInvoice } from '@/services/api/subscription.service'

function formatRupiah(value: number | string) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

interface PaymentProofModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: SubscriptionInvoice | null
  billingSettings?: BillingSettings | null
  onSubmitPayment: (input: {
    invoiceId: string
    amount: string
    bankName?: string
    accountName?: string
    referenceNumber?: string
    proofImageUrl?: string
    proofText?: string
  }) => Promise<void>
}

export function PaymentProofModal({
  isOpen,
  onClose,
  invoice,
  billingSettings,
  onSubmitPayment,
}: PaymentProofModalProps) {
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [proofText, setProofText] = useState('')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.amount)
      setBankName('')
      setAccountName('')
      setReferenceNumber('')
      setProofText('')
      setSelectedFile(null)
      setPreviewUrl(null)
      setErrorMsg(null)
    }
  }, [invoice])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreviewUrl(null)
    }
  }, [selectedFile])

  if (!invoice) return null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 5 MB.')
      return
    }

    setErrorMsg(null)
    setSelectedFile(file)
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAccount(text)
      setTimeout(() => setCopiedAccount(null), 2500)
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return
    setErrorMsg(null)

    if (!selectedFile && !proofText.trim()) {
      setErrorMsg('Harap unggah bukti transfer atau isi catatan pembayaran.')
      return
    }

    try {
      setIsUploading(true)
      let uploadedUrl: string | undefined

      if (selectedFile) {
        uploadedUrl = await uploadImage(selectedFile, 'invoices')
      }

      await onSubmitPayment({
        invoiceId: invoice.id,
        amount,
        bankName: bankName.trim() || undefined,
        accountName: accountName.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        proofImageUrl: uploadedUrl,
        proofText: proofText.trim() || undefined,
      })

      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim bukti pembayaran.'
      setErrorMsg(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isUploading) onClose() }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Upload className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Upload Bukti Pembayaran</DialogTitle>
              <DialogDescription>
                Tagihan {invoice.invoiceNumber} • Paket {invoice.planCode}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3.5">
            <div>
              <span className="text-xs text-muted-foreground">Total yang Harus Ditransfer</span>
              <p className="text-xl font-bold text-foreground">{formatRupiah(invoice.amount)}</p>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              Menunggu Pembayaran
            </Badge>
          </div>

          {/* Official Bank Accounts */}
          {billingSettings?.bankAccounts && billingSettings.bankAccounts.length > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Rekening Resmi Tujuan Pembayaran
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {billingSettings.bankAccounts.map((account) => {
                  const isCopied = copiedAccount === account.accountNumber
                  return (
                    <div
                      key={`${account.bankName}-${account.accountNumber}`}
                      className="flex items-center justify-between rounded-lg border bg-card p-2.5 shadow-xs"
                    >
                      <div className="overflow-hidden pr-2">
                        <span className="text-xs font-bold text-foreground">{account.bankName}</span>
                        <p className="font-mono text-sm font-semibold text-primary">{account.accountNumber}</p>
                        <p className="truncate text-[11px] text-muted-foreground">a.n. {account.accountName}</p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-8 shrink-0"
                        onClick={() => handleCopy(account.accountNumber)}
                        title="Salin nomor rekening"
                      >
                        {isCopied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Bukti Transfer / Screenshot Pembayaran <span className="text-destructive">*</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/10 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/20"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="size-6 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  Klik untuk pilih foto struk / bukti transfer
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Format didukung: JPG, PNG, WEBP, atau PDF (maks. 5 MB)
                </p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="size-5 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={handleRemoveFile}
                  >
                    <X className="size-4 text-muted-foreground" />
                  </Button>
                </div>

                {previewUrl && (
                  <div className="mt-2.5 overflow-hidden rounded-lg border bg-black/5">
                    <img
                      src={previewUrl}
                      alt="Pratinjau Bukti Transfer"
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Bank Pengirim</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: BCA, Mandiri, BRI"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nama Pemilik Rekening</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Nama sesuai rekening pengirim"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Nomor Referensi / ID Transaksi (Opsional)</Label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Contoh: 20261106-981726"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Catatan Pembayaran (Opsional)</Label>
            <Textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Tuliskan catatan tambahan jika ada..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isUploading || (!selectedFile && !proofText.trim())}
              className="gap-2"
            >
              {isUploading && <Loader2 className="size-4 animate-spin" />}
              {isUploading ? 'Mengunggah & Mengirim...' : 'Kirim Bukti Pembayaran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
