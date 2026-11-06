import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { dexieDb } from '@/services/local-db/dexie-instance'
import type { LocalCash } from '@/services/local-db/schema'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { cashAccountOptions } from '@/features/cash/schemas/cash-form-schema'
import { createJournalEntry } from '@/services/accounting/journal.service'
import { ensurePaymentMethodAccount } from '@/services/accounting/chart-of-accounts'

interface BankTransferDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function BankTransferDialog({ trigger, onSuccess }: BankTransferDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const tenantId = resolveTenantId()

  const dbMethods = usePaymentMethods()
  const activeAccounts =
    dbMethods && dbMethods.length > 0
      ? dbMethods.filter((m) => m.status === 'Aktif').map((m) => m.name)
      : [...cashAccountOptions]

  const [fromAccount, setFromAccount] = useState('Kas Toko')
  const [toAccount, setToAccount] = useState('Bank BCA')
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('Setor tunai ke rekening bank')

  async function handleTransfer() {
    const numAmount = Number(amount) || 0
    if (numAmount <= 0) return
    if (fromAccount === toAccount) {
      alert('Akun asal dan akun tujuan transfer harus berbeda.')
      return
    }

    setSaving(true)
    try {
      const transferId = crypto.randomUUID()
      const effectiveRef = ref.trim() || `TRF-${transferId.slice(0, 6).toUpperCase()}`
      const outRef = `${effectiveRef}-OUT`
      const inRef = `${effectiveRef}-IN`

      // 1. Catat Pengeluaran dari Akun Asal
      const outRecord: LocalCash = {
        id: `cash-trf-out-${transferId}`,
        tenantId,
        ref: outRef,
        date,
        account: fromAccount,
        category: 'Transfer Antar Kas/Bank',
        income: 0,
        expense: numAmount,
        status: 'Tercatat',
      }

      // 2. Catat Pemasukan ke Akun Tujuan
      const inRecord: LocalCash = {
        id: `cash-trf-in-${transferId}`,
        tenantId,
        ref: inRef,
        date,
        account: toAccount,
        category: 'Transfer Antar Kas/Bank',
        income: numAmount,
        expense: 0,
        status: 'Tercatat',
      }

      await dexieDb.cash.bulkPut([outRecord, inRecord])

      // 3. Jurnal Akuntansi Pemindahan Dana (Dr. Akun Tujuan, Cr. Akun Asal)
      try {
        const toAcc = await ensurePaymentMethodAccount(tenantId, {
          name: toAccount,
          provider: toAccount,
          type: toAccount.toLowerCase().includes('kas') ? 'tunai' : 'transfer',
        })
        const fromAcc = await ensurePaymentMethodAccount(tenantId, {
          name: fromAccount,
          provider: fromAccount,
          type: fromAccount.toLowerCase().includes('kas') ? 'tunai' : 'transfer',
        })

        await createJournalEntry(tenantId, {
          referenceType: 'bank_transfer',
          referenceId: transferId,
          description: notes || `Transfer dari ${fromAccount} ke ${toAccount}`,
          date,
          lines: [
            { accountCode: toAcc.code, debit: numAmount, credit: 0 },
            { accountCode: fromAcc.code, debit: 0, credit: numAmount },
          ],
        })
      } catch (jErr) {
        console.warn('Journal for bank transfer could not be written:', jErr)
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vitpos:db-mutate'))
      }

      setOpen(false)
      onSuccess?.()
    } catch (err) {
      console.error('Error executing bank transfer:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeftRight className="h-4 w-4" />
            <span>Transfer Antar Kas/Bank</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Transfer Dana Antar Kas & Bank
          </DialogTitle>
          <DialogDescription>
            Pindahkan saldo antar rekening, misalnya setor uang tunai toko ke rekening BCA atau pemindahan antar bank.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* Dari Akun */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Dari Akun (Sumber Dana)
            </label>
            <Select value={fromAccount} onValueChange={setFromAccount}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pilih akun asal" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((acc) => (
                  <SelectItem key={acc} value={acc}>
                    {acc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ke Akun */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Ke Akun (Tujuan Transfer)
            </label>
            <Select value={toAccount} onValueChange={setToAccount}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pilih akun tujuan" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((acc) => (
                  <SelectItem key={acc} value={acc}>
                    {acc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nominal Transfer */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Nominal Transfer
            </label>
            <CurrencyInput
              prefix="Rp"
              value={amount}
              onValueChange={(val) => setAmount(String(val))}
              placeholder="0"
              className="h-9"
            />
          </div>

          {/* Tanggal & Ref */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tanggal
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                No. Referensi
              </label>
              <Input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Catatan / Keterangan
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Setoran omzet POS ke Bank BCA"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleTransfer} disabled={saving || Number(amount) <= 0}>
            {saving ? 'Memproses...' : 'Kirim Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
