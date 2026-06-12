import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SubscriptionInvoice } from '@/services/api/subscription.service'

export function PaymentProofForm({
  invoice,
  isSubmitting,
  onSubmit,
}: {
  invoice: SubscriptionInvoice
  isSubmitting?: boolean
  onSubmit: (input: { amount: string; bankName?: string; accountName?: string; referenceNumber?: string; proofText?: string }) => void
}) {
  const [amount, setAmount] = useState(invoice.amount)
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [proofText, setProofText] = useState('')

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ amount, bankName, accountName, referenceNumber, proofText })
      }}
    >
      <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Nominal transfer" />
      <Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Bank pengirim" />
      <Input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Nama pemilik rekening" />
      <Input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} placeholder="Nomor referensi" />
      <Textarea value={proofText} onChange={(event) => setProofText(event.target.value)} placeholder="Catatan bukti transfer" />
      <Button type="submit" disabled={isSubmitting || !proofText.trim()}>
        {isSubmitting ? 'Mengirim...' : 'Kirim Bukti Bayar'}
      </Button>
    </form>
  )
}
