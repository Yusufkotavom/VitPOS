import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { formatCurrency } from '@/lib/format-currency'
import {
  getOpeningBalance,
  saveOpeningBalance,
  type OpeningBalanceInput,
} from '@/features/accounting/services/opening-balance.service'

interface OpeningBalanceDialogProps {
  trigger?: React.ReactNode
  onSaved?: () => void
}

export function OpeningBalanceDialog({ trigger, onSaved }: OpeningBalanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const tenantId = resolveTenantId()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [cashOnHand, setCashOnHand] = useState('0')
  const [bankAccounts, setBankAccounts] = useState<Array<{ name: string; balance: string; provider: string }>>([
    { name: 'Bank BCA', balance: '0', provider: 'BCA' },
  ])
  const [accountsReceivable, setAccountsReceivable] = useState('0')
  const [inventoryValue, setInventoryValue] = useState('0')
  const [fixedAssets, setFixedAssets] = useState('0')
  const [accountsPayable, setAccountsPayable] = useState('0')
  const [otherLiabilities, setOtherLiabilities] = useState('0')
  const [notes, setNotes] = useState('Saldo Awal Usaha')

  useEffect(() => {
    if (open && tenantId) {
      setLoading(true)
      getOpeningBalance(tenantId)
        .then((existing) => {
          if (existing) {
            setDate(existing.date || new Date().toISOString().slice(0, 10))
            setCashOnHand(String(existing.cashOnHand || 0))
            if (existing.bankAccounts && existing.bankAccounts.length > 0) {
              setBankAccounts(
                existing.bankAccounts.map((b) => ({
                  name: b.name,
                  balance: String(b.balance || 0),
                  provider: b.provider || b.name,
                })),
              )
            }
            setAccountsReceivable(String(existing.accountsReceivable || 0))
            setInventoryValue(String(existing.inventoryValue || 0))
            setFixedAssets(String(existing.fixedAssets || 0))
            setAccountsPayable(String(existing.accountsPayable || 0))
            setOtherLiabilities(String(existing.otherLiabilities || 0))
            if (existing.notes) setNotes(existing.notes)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open, tenantId])

  // Calculations
  const numCash = Number(cashOnHand) || 0
  const numBank = bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
  const numAr = Number(accountsReceivable) || 0
  const numInv = Number(inventoryValue) || 0
  const numFa = Number(fixedAssets) || 0

  const totalAssets = numCash + numBank + numAr + numInv + numFa

  const numAp = Number(accountsPayable) || 0
  const numOl = Number(otherLiabilities) || 0
  const totalLiabilities = numAp + numOl

  const ownerEquity = totalAssets - totalLiabilities

  function addBankAccount() {
    setBankAccounts((prev) => [
      ...prev,
      { name: `Bank ${prev.length + 1}`, balance: '0', provider: 'Bank' },
    ])
  }

  function removeBankAccount(index: number) {
    setBankAccounts((prev) => prev.filter((_, i) => i !== index))
  }

  function updateBankAccount(index: number, field: 'name' | 'balance' | 'provider', val: string) {
    setBankAccounts((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: val } : b)),
    )
  }

  async function handleSave() {
    if (!tenantId) return
    setSaving(true)
    try {
      const payload: OpeningBalanceInput = {
        date,
        cashOnHand: numCash,
        bankAccounts: bankAccounts.map((b) => ({
          name: b.name.trim() || 'Bank',
          balance: Number(b.balance) || 0,
          provider: b.provider.trim() || 'Bank',
        })),
        accountsReceivable: numAr,
        inventoryValue: numInv,
        fixedAssets: numFa,
        accountsPayable: numAp,
        otherLiabilities: numOl,
        notes: notes.trim(),
      }

      await saveOpeningBalance(tenantId, payload)
      setOpen(false)
      onSaved?.()
    } catch (err) {
      console.error('Error saving opening balance:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>Atur Saldo Awal</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            Saldo Awal Akuntansi
          </DialogTitle>
          <DialogDescription>
            Masukkan posisi saldo awal kas, bank, persediaan, piutang, dan hutang usaha untuk memulai pembukuan yang akurat.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Memuat data saldo awal...</div>
        ) : (
          <div className="flex flex-col gap-5 py-2">
            {/* 1. Tanggal Saldo Awal */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Tanggal Efektif Saldo Awal
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Biasanya tanggal awal pembukuan (misal: 1 Januari atau awal bulan operasional).
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Keterangan / Catatan
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Saldo Awal Pembukuan 2026"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Aset Awal (Harta Usaha) */}
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-bold text-primary tracking-wide">
                  1. ASET AWAL (HARTA USAHA)
                </span>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(totalAssets)}
                </span>
              </div>

              {/* Kas Tunai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                <div>
                  <p className="text-sm font-medium">Kas Tunai di Kasir / Brankas</p>
                  <p className="text-xs text-muted-foreground">Uang tunai fisik siap pakai</p>
                </div>
                <CurrencyInput
                  prefix="Rp"
                  value={cashOnHand}
                  onValueChange={(v) => setCashOnHand(String(v))}
                  placeholder="0"
                  className="h-9"
                />
              </div>

              {/* Rekening Bank */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Rekening Bank & QRIS</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addBankAccount}
                    className="h-7 text-xs text-primary gap-1"
                  >
                    <Plus className="h-3 w-3" /> Tambah Rekening
                  </Button>
                </div>

                {bankAccounts.map((bank, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={bank.name}
                      onChange={(e) => updateBankAccount(idx, 'name', e.target.value)}
                      placeholder="Nama Bank (misal BCA)"
                      className="h-9 text-sm w-44"
                    />
                    <div className="flex-1">
                      <CurrencyInput
                        prefix="Rp"
                        value={bank.balance}
                        onValueChange={(v) => updateBankAccount(idx, 'balance', String(v))}
                        placeholder="0"
                        className="h-9"
                      />
                    </div>
                    {bankAccounts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-700"
                        onClick={() => removeBankAccount(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Persediaan & Piutang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Persediaan Barang Dagang Awal
                  </label>
                  <CurrencyInput
                    prefix="Rp"
                    value={inventoryValue}
                    onValueChange={(v) => setInventoryValue(String(v))}
                    placeholder="0"
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Nilai total modal barang di gudang/toko</p>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Piutang Usaha (Tagihan Pelanggan)
                  </label>
                  <CurrencyInput
                    prefix="Rp"
                    value={accountsReceivable}
                    onValueChange={(v) => setAccountsReceivable(String(v))}
                    placeholder="0"
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tagihan penjualan periode sebelumnya</p>
                </div>
              </div>

              {/* Aset Tetap */}
              <div className="pt-2 border-t">
                <label className="text-xs font-medium block mb-1">
                  Peralatan & Aset Tetap (Non-Lancar)
                </label>
                <CurrencyInput
                  prefix="Rp"
                  value={fixedAssets}
                  onValueChange={(v) => setFixedAssets(String(v))}
                  placeholder="0"
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Nilai aset fisik jangka panjang (mesin kasir, rak, laptop, kendaraan operasional)
                </p>
              </div>
            </div>

            {/* 3. Kewajiban Awal (Hutang Usaha) */}
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400 tracking-wide">
                  2. KEWAJIBAN / HUTANG AWAL
                </span>
                <span className="text-sm font-semibold text-rose-600">
                  {formatCurrency(totalLiabilities)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Hutang Usaha ke Pemasok / Supplier
                  </label>
                  <CurrencyInput
                    prefix="Rp"
                    value={accountsPayable}
                    onValueChange={(v) => setAccountsPayable(String(v))}
                    placeholder="0"
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tagihan pembelian belum dibayar</p>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Hutang Lainnya / Pinjaman
                  </label>
                  <CurrencyInput
                    prefix="Rp"
                    value={otherLiabilities}
                    onValueChange={(v) => setOtherLiabilities(String(v))}
                    placeholder="0"
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Kewajiban jangka pendek/panjang lainnya</p>
                </div>
              </div>
            </div>

            {/* 4. Ekuitas / Modal Awal Otomatis */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    3. Modal Awal Pemilik (Ekuitas Bersih)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dihitung otomatis: Total Aset ({formatCurrency(totalAssets)}) - Total Hutang ({formatCurrency(totalLiabilities)})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(ownerEquity)}
                  </p>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Neraca 100% Seimbang
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Menyimpan...' : 'Simpan Saldo Awal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
