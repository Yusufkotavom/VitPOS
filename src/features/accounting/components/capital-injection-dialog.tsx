import { useState } from 'react'
import { Landmark, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { toast } from 'sonner'
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
import { ensurePaymentMethodAccount, ensureSystemAccounts } from '@/services/accounting/chart-of-accounts'

interface CapitalInjectionDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CapitalInjectionDialog({ trigger, onSuccess }: CapitalInjectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'injection' | 'withdrawal'>('injection')
  const tenantId = resolveTenantId()

  const dbMethods = usePaymentMethods()
  const activeAccounts =
    dbMethods && dbMethods.length > 0
      ? dbMethods.filter((m) => m.status === 'Aktif').map((m) => m.name)
      : [...cashAccountOptions]

  const [account, setAccount] = useState('Kas Toko')
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('Setoran modal tambahan pemilik usaha')

  function handleModeChange(newMode: 'injection' | 'withdrawal') {
    setMode(newMode)
    if (newMode === 'injection') {
      setNotes('Setoran modal tambahan pemilik usaha')
    } else {
      setNotes('Penarikan prive modal oleh pemilik')
    }
  }

  async function handleSave() {
    const numAmount = Number(amount) || 0
    if (numAmount <= 0) {
      toast.error('Nominal harus lebih dari Rp 0')
      return
    }

    setSaving(true)
    try {
      await ensureSystemAccounts(tenantId)
      const txId = crypto.randomUUID()
      const isInjection = mode === 'injection'
      const effectiveRef = ref.trim() || `${isInjection ? 'MODAL' : 'PRIVE'}-${Date.now().toString().slice(-6)}`

      // 1. Simpan ke Buku Kas & Bank
      const cashRecord: LocalCash = {
        id: `cash-equity-${txId}`,
        tenantId,
        ref: effectiveRef,
        date,
        account,
        category: isInjection ? 'Setor Modal' : 'Prive Pemilik',
        income: isInjection ? numAmount : 0,
        expense: isInjection ? 0 : numAmount,
        status: 'Tercatat',
      }
      await dexieDb.cash.put(cashRecord)

      // 2. Jurnal Akuntansi Ekuitas
      // Setor Modal: Dr. Kas/Bank, Cr. 3-1000 Modal
      // Prive: Dr. 3-1000 Modal, Cr. Kas/Bank
      try {
        const cashAcc = await ensurePaymentMethodAccount(tenantId, {
          name: account,
          provider: account,
          type: account.toLowerCase().includes('kas') ? 'tunai' : 'transfer',
        })

        await createJournalEntry(tenantId, {
          referenceType: isInjection ? 'capital_injection' : 'capital_withdrawal',
          referenceId: txId,
          description: notes || (isInjection ? 'Setoran Modal Pemilik' : 'Prive Pemilik'),
          date,
          lines: isInjection
            ? [
                { accountCode: cashAcc.code, debit: numAmount, credit: 0 },
                { accountCode: '3-1000', debit: 0, credit: numAmount },
              ]
            : [
                { accountCode: '3-1000', debit: numAmount, credit: 0 },
                { accountCode: cashAcc.code, debit: 0, credit: numAmount },
              ],
        })
      } catch (jErr) {
        console.warn('Journal for capital transaction could not be written:', jErr)
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vitpos:db-mutate'))
      }

      toast.success(isInjection ? 'Setor modal berhasil dicatat' : 'Penarikan prive berhasil dicatat')
      setOpen(false)
      setAmount('0')
      onSuccess?.()
    } catch (err) {
      console.error('Error saving capital transaction:', err)
      toast.error('Gagal menyimpan transaksi modal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Landmark className="h-3.5 w-3.5 text-primary" />
            <span>Setor Modal / Prive</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Landmark className="h-5 w-5 text-primary" />
            Transaksi Modal Pemilik (Ekuitas)
          </DialogTitle>
          <DialogDescription>
            Catat penambahan modal usaha atau penarikan uang pribadi (prive) yang langsung memperbarui ekuitas di neraca.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Pilihan Mode: Setor Modal vs Prive */}
        <div className="flex rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('injection')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'injection'
                ? 'bg-background text-emerald-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Setor Modal (+ Masuk)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('withdrawal')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'withdrawal'
                ? 'bg-background text-rose-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Prive / Tarik (- Keluar)
          </button>
        </div>

        <div className="flex flex-col gap-3 py-1">
          {/* Rekening Kas / Bank */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {mode === 'injection' ? 'Setor Masuk ke Rekening' : 'Tarik Keluar dari Rekening'}
            </label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pilih rekening" />
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

          {/* Nominal */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Nominal {mode === 'injection' ? 'Setoran Modal' : 'Penarikan Prive'}
            </label>
            <CurrencyInput
              prefix="Rp"
              value={amount}
              onValueChange={(val) => setAmount(String(val))}
              placeholder="0"
              className="h-9"
            />
          </div>

          {/* Tanggal & No. Bukti */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tanggal Transaksi
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
                No. Bukti / Referensi
              </label>
              <Input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Otomatis"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Keterangan
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tambahan modal kerja pemilik usaha"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || Number(amount) <= 0}
            className={mode === 'injection' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
          >
            {saving ? 'Menyimpan...' : mode === 'injection' ? 'Simpan Setor Modal' : 'Simpan Penarikan Prive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
