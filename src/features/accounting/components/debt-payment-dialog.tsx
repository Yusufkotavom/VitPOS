import { useState, useMemo } from 'react'
import { HandCoins } from 'lucide-react'
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
import type { LocalCash, LocalSupplier } from '@/services/local-db/schema'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { cashAccountOptions } from '@/features/cash/schemas/cash-form-schema'
import { createJournalEntry } from '@/services/accounting/journal.service'
import { ensurePaymentMethodAccount, ensureSystemAccounts } from '@/services/accounting/chart-of-accounts'
import { formatCurrency } from '@/lib/format-currency'

interface DebtPaymentDialogProps {
  trigger?: React.ReactNode
  defaultSupplierId?: string
  onSuccess?: () => void
}

export function DebtPaymentDialog({ trigger, defaultSupplierId, onSuccess }: DebtPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const tenantId = resolveTenantId()

  const dbMethods = usePaymentMethods()
  const activeAccounts =
    dbMethods && dbMethods.length > 0
      ? dbMethods.filter((m) => m.status === 'Aktif').map((m) => m.name)
      : [...cashAccountOptions]

  const suppliers = useLiveQuery<LocalSupplier[], LocalSupplier[]>(
    async () => {
      if (!tenantId) return []
      return dexieDb.suppliers.where('tenantId').equals(tenantId).toArray()
    },
    [tenantId],
    [],
  )

  const [supplierId, setSupplierId] = useState<string>(defaultSupplierId || 'other')
  const [account, setAccount] = useState('Kas Toko')
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('Pembayaran hutang pembelian barang')

  const selectedSupplier = useMemo(() => {
    return (suppliers ?? []).find((s) => s.id === supplierId)
  }, [suppliers, supplierId])

  function handleSelectSupplier(id: string) {
    setSupplierId(id)
    const sup = (suppliers ?? []).find((s) => s.id === id)
    if (sup) {
      setNotes(`Pembayaran hutang ke ${sup.name}`)
      if (sup.payable > 0) {
        setAmount(String(sup.payable))
      }
    } else {
      setNotes('Pembayaran hutang usaha')
    }
  }

  async function handleSave() {
    const numAmount = Number(amount) || 0
    if (numAmount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari Rp 0')
      return
    }

    setSaving(true)
    try {
      await ensureSystemAccounts(tenantId)
      const txId = crypto.randomUUID()
      const effectiveRef = ref.trim() || `BAYAR-HUTANG-${Date.now().toString().slice(-6)}`

      // 1. Update Supplier Hutang jika supplier dipilih
      if (selectedSupplier && selectedSupplier.id) {
        const nextPayable = Math.max(0, (Number(selectedSupplier.payable) || 0) - numAmount)
        await dexieDb.suppliers.update(selectedSupplier.id, {
          payable: nextPayable,
          updatedAt: new Date().toISOString(),
        })
      }

      // 2. Simpan ke Buku Kas & Bank sebagai Pengeluaran
      const cashRecord: LocalCash = {
        id: `cash-debt-${txId}`,
        tenantId,
        ref: effectiveRef,
        date,
        account,
        category: 'Pembayaran Hutang Usaha',
        income: 0,
        expense: numAmount,
        status: 'Tercatat',
      }
      await dexieDb.cash.put(cashRecord)

      // 3. Jurnal Akuntansi:
      // Dr. 2-1000 Hutang Usaha (mengurangi kewajiban)
      // Cr. Kas / Bank yang dipakai membayar (mengurangi aset kas/bank)
      try {
        const cashAcc = await ensurePaymentMethodAccount(tenantId, {
          name: account,
          provider: account,
          type: account.toLowerCase().includes('kas') ? 'tunai' : 'transfer',
        })

        await createJournalEntry(tenantId, {
          referenceType: 'debt_payment',
          referenceId: txId,
          description: notes || `Bayar hutang ${selectedSupplier ? selectedSupplier.name : 'usaha'}`,
          date,
          lines: [
            { accountCode: '2-1000', debit: numAmount, credit: 0 },
            { accountCode: cashAcc.code, debit: 0, credit: numAmount },
          ],
        })
      } catch (jErr) {
        console.warn('Journal for debt payment could not be written:', jErr)
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vitpos:db-mutate'))
      }

      toast.success('Pembayaran hutang berhasil dicatat')
      setOpen(false)
      setAmount('0')
      onSuccess?.()
    } catch (err) {
      console.error('Error recording debt payment:', err)
      toast.error('Gagal mencatat pembayaran hutang')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-rose-600 hover:text-rose-700">
            <HandCoins className="h-3.5 w-3.5" />
            <span>Bayar Hutang</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <HandCoins className="h-5 w-5 text-rose-600" />
            Pembayaran Hutang Usaha
          </DialogTitle>
          <DialogDescription>
            Catat pelunasan kewajiban hutang ke supplier/pemasok yang otomatis mengurangi pos liabilitas di neraca.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {/* Pilih Pemasok / Supplier */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Pilih Pemasok / Supplier
            </label>
            <Select value={supplierId} onValueChange={handleSelectSupplier}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pilih pemasok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="other">Hutang Usaha Umum / Lainnya</SelectItem>
                {(suppliers ?? []).map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    {sup.name} {sup.payable > 0 ? `(Sisa: ${formatCurrency(sup.payable)})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSupplier && selectedSupplier.payable > 0 && (
              <div className="mt-1.5 flex items-center justify-between rounded-lg bg-rose-50 p-2 dark:bg-rose-950/40 text-xs">
                <span className="text-rose-700 dark:text-rose-300">
                  Total Hutang ke {selectedSupplier.name}: <strong>{formatCurrency(selectedSupplier.payable)}</strong>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAmount(String(selectedSupplier.payable))}
                  className="h-6 text-[11px] text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900 px-2"
                >
                  Lunasi Semua
                </Button>
              </div>
            )}
          </div>

          {/* Sumber Dana (Kas / Bank) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Bayar Menggunakan Rekening
            </label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pilih rekening kas/bank" />
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

          {/* Nominal Pembayaran */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Nominal Pembayaran
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
                Tanggal Pembayaran
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
                No. Referensi / Bukti
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
              placeholder="Contoh: Pelunasan faktur pembelian bahan baku"
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
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {saving ? 'Menyimpan...' : 'Bayar Hutang Sekarang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
