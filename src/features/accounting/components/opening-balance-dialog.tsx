import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, BookOpen, Sparkles, Download } from 'lucide-react'
import { toast } from 'sonner'
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
  getCurrentSystemBalances,
  saveOpeningBalance,
  type OpeningBalanceInput,
  type CurrentSystemBalances,
} from '@/features/accounting/services/opening-balance.service'

interface OpeningBalanceDialogProps {
  trigger?: React.ReactNode
  onSaved?: () => void
}

export function OpeningBalanceDialog({ trigger, onSaved }: OpeningBalanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [systemBalances, setSystemBalances] = useState<CurrentSystemBalances | null>(null)
  const [isEditingExisting, setIsEditingExisting] = useState(false)
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
      Promise.all([
        getOpeningBalance(tenantId),
        getCurrentSystemBalances(tenantId),
      ])
        .then(([existing, sys]) => {
          setSystemBalances(sys)
          if (existing) {
            setIsEditingExisting(true)
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
          } else {
            // Belum pernah menyimpan saldo awal -> otomatis baca dari saldo berjalan saat ini
            setIsEditingExisting(false)
            setCashOnHand(String(sys.cashOnHand || 0))
            if (sys.bankAccounts && sys.bankAccounts.length > 0) {
              setBankAccounts(
                sys.bankAccounts.map((b) => ({
                  name: b.name,
                  balance: String(b.balance || 0),
                  provider: b.provider || b.name,
                })),
              )
            }
            setAccountsReceivable(String(sys.accountsReceivable || 0))
            setInventoryValue(String(sys.inventoryValue || 0))
            setFixedAssets(String(sys.fixedAssets || 0))
            setAccountsPayable(String(sys.accountsPayable || 0))
            setOtherLiabilities(String(sys.otherLiabilities || 0))
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open, tenantId])

  function loadFromCurrentSystem() {
    if (!systemBalances) return
    setCashOnHand(String(systemBalances.cashOnHand || 0))
    if (systemBalances.bankAccounts && systemBalances.bankAccounts.length > 0) {
      setBankAccounts(
        systemBalances.bankAccounts.map((b) => ({
          name: b.name,
          balance: String(b.balance || 0),
          provider: b.provider || b.name,
        })),
      )
    }
    setAccountsReceivable(String(systemBalances.accountsReceivable || 0))
    setInventoryValue(String(systemBalances.inventoryValue || 0))
    setFixedAssets(String(systemBalances.fixedAssets || 0))
    setAccountsPayable(String(systemBalances.accountsPayable || 0))
    setOtherLiabilities(String(systemBalances.otherLiabilities || 0))
    toast.success('Formulir diisi dengan saldo berjalan sistem saat ini!')
  }

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
      toast.success(
        isEditingExisting
          ? 'Saldo awal akuntansi berhasil diperbarui'
          : 'Saldo awal akuntansi berhasil disimpan',
      )
      setOpen(false)
      onSaved?.()
    } catch (err) {
      console.error('Error saving opening balance:', err)
      toast.error('Gagal menyimpan saldo awal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Atur Saldo Awal</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5 text-primary" />
              {isEditingExisting ? 'Edit / Sesuaikan Saldo Awal' : 'Saldo Awal Akuntansi'}
            </DialogTitle>
            {isEditingExisting && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Tersimpan
              </Badge>
            )}
          </div>
          <DialogDescription>
            Masukkan atau sesuaikan posisi saldo awal kas, rekening bank, persediaan, piutang, dan hutang usaha.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Memuat data saldo awal...</div>
        ) : (
          <div className="flex flex-col gap-5 py-2">
            {/* Card Saldo Sistem Saat Ini & Opsi Tarik Saldo */}
            {systemBalances && (
              <div className="rounded-xl border bg-accent/40 p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-xs font-bold text-foreground tracking-wide">
                        Saldo Berjalan di Sistem Saat Ini
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isEditingExisting
                        ? 'Data di bawah ini mencerminkan transaksi berjalan saat ini. Klik tombol di kanan jika ingin menyamakan formulir dengan saldo sistem.'
                        : 'Formulir telah otomatis diisi membaca posisi kas, persediaan stok produk, piutang, dan hutang supplier Anda saat ini.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadFromCurrentSystem}
                    className="h-8 text-xs font-semibold gap-1.5 shrink-0 bg-background hover:bg-accent border-primary/30 text-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Tarik Saldo Berjalan
                  </Button>
                </div>

                {/* Mini metric pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                  <div className="rounded-lg border bg-background/80 p-2">
                    <span className="text-muted-foreground block text-[10px]">Kas Tunai</span>
                    <span className="font-semibold text-foreground">{formatCurrency(systemBalances.cashOnHand)}</span>
                  </div>
                  <div className="rounded-lg border bg-background/80 p-2">
                    <span className="text-muted-foreground block text-[10px]">Rekening Bank</span>
                    <span className="font-semibold text-foreground">{formatCurrency(systemBalances.totalBank)}</span>
                  </div>
                  <div className="rounded-lg border bg-background/80 p-2">
                    <span className="text-muted-foreground block text-[10px]">Nilai Stok ({systemBalances.productCount} item)</span>
                    <span className="font-semibold text-foreground">{formatCurrency(systemBalances.inventoryValue)}</span>
                  </div>
                  <div className="rounded-lg border bg-background/80 p-2">
                    <span className="text-muted-foreground block text-[10px]">Piutang Pelanggan</span>
                    <span className="font-semibold text-foreground">{formatCurrency(systemBalances.accountsReceivable)}</span>
                  </div>
                  <div className="rounded-lg border bg-background/80 p-2">
                    <span className="text-muted-foreground block text-[10px]">Hutang Supplier</span>
                    <span className="font-semibold text-rose-600">{formatCurrency(systemBalances.accountsPayable)}</span>
                  </div>
                </div>
              </div>
            )}

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
                    Tanggal awal pembukuan toko (misal: awal tahun atau tanggal mulai operasional).
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
                  {systemBalances && numCash !== systemBalances.cashOnHand && (
                    <button
                      type="button"
                      onClick={() => setCashOnHand(String(systemBalances.cashOnHand))}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5 font-medium"
                    >
                      <span>Sistem saat ini: {formatCurrency(systemBalances.cashOnHand)}</span>
                      <span className="font-semibold underline">(Gunakan)</span>
                    </button>
                  )}
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
                  <div>
                    <p className="text-sm font-medium">Rekening Bank & QRIS</p>
                    <p className="text-xs text-muted-foreground">Saldo giro/tabungan usaha</p>
                  </div>
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
                      placeholder="Nama Bank (misal Bank BCA)"
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
                  {systemBalances && numInv !== systemBalances.inventoryValue ? (
                    <button
                      type="button"
                      onClick={() => setInventoryValue(String(systemBalances.inventoryValue))}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      <span>Nilai stok sistem: {formatCurrency(systemBalances.inventoryValue)}</span>
                      <span className="font-semibold underline">(Gunakan)</span>
                    </button>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Nilai total modal barang di toko</p>
                  )}
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
                  {systemBalances && numAr !== systemBalances.accountsReceivable ? (
                    <button
                      type="button"
                      onClick={() => setAccountsReceivable(String(systemBalances.accountsReceivable))}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      <span>Piutang sistem: {formatCurrency(systemBalances.accountsReceivable)}</span>
                      <span className="font-semibold underline">(Gunakan)</span>
                    </button>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Tagihan penjualan tempo sebelumnya</p>
                  )}
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
                  Nilai aset fisik jangka panjang (mesin kasir, rak etalase, laptop, kendaraan operasional)
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
                  {systemBalances && numAp !== systemBalances.accountsPayable ? (
                    <button
                      type="button"
                      onClick={() => setAccountsPayable(String(systemBalances.accountsPayable))}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      <span>Hutang sistem: {formatCurrency(systemBalances.accountsPayable)}</span>
                      <span className="font-semibold underline">(Gunakan)</span>
                    </button>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Tagihan pembelian barang ke supplier</p>
                  )}
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
            {saving
              ? 'Menyimpan...'
              : isEditingExisting
                ? 'Perbarui Saldo Awal'
                : 'Simpan Saldo Awal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
