import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { SubscriptionPayment } from '@/services/api/subscription.service'

function formatRupiah(value: string) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

export function BillingPaymentQueue({
  payments,
  onApprove,
  onReject,
  isBusy,
}: {
  payments: SubscriptionPayment[]
  onApprove: (paymentId: string) => void
  onReject: (paymentId: string, reviewNote: string) => void
  isBusy?: boolean
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  return (
    <Card>
      <CardHeader><CardTitle>Pembayaran Masuk</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {payments.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pembayaran masuk.</p> : null}
        {payments.map((payment) => (
          <div key={payment.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="font-medium">Invoice {payment.invoiceId}</p>
                <p className="text-sm text-muted-foreground">Tenant {payment.tenantId}</p>
                <p className="text-sm">{formatRupiah(payment.amount)} • {payment.bankName ?? 'Bank belum diisi'} • {payment.accountName ?? 'Nama rekening belum diisi'}</p>
                {payment.referenceNumber ? <p className="text-sm text-muted-foreground">Ref: {payment.referenceNumber}</p> : null}
                {payment.proofText ? <p className="rounded-lg bg-muted p-3 text-sm">{payment.proofText}</p> : null}
                {payment.proofImageUrl ? <a className="text-sm text-primary underline" href={payment.proofImageUrl} target="_blank" rel="noreferrer">Lihat bukti gambar</a> : null}
              </div>
              <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'outline'}>{payment.status}</Badge>
            </div>
            {payment.status === 'submitted' ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Button size="sm" disabled={isBusy} onClick={() => onApprove(payment.id)}>Setujui</Button>
                <Button size="sm" variant="outline" disabled={isBusy} onClick={() => setRejectingId(payment.id)}>Tolak</Button>
              </div>
            ) : null}
            {rejectingId === payment.id ? (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <Textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Catatan Penolakan" />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={isBusy || reviewNote.trim().length < 3} onClick={() => { onReject(payment.id, reviewNote); setRejectingId(null); setReviewNote('') }}>Kirim Penolakan</Button>
                  <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setReviewNote('') }}>Batal</Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
