import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  CalendarClock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyInput } from '@/shared/components/forms/currency-input'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { formatCurrency } from '@/lib/format-currency'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import {
  getRecurringTemplates,
  saveRecurringTemplates,
  executeRecurringTransaction,
  executeAllPendingRecurring,
  isExecutedThisMonth,
  getCurrentMonthKey,
  type RecurringCashTemplate,
} from '@/features/cash/services/recurring-cash.service'

interface RecurringCashDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function RecurringCashDialog({ trigger, onSuccess }: RecurringCashDialogProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<RecurringCashTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list')
  const [filterType, setFilterType] = useState<'all' | 'Pengeluaran' | 'Pemasukan'>('all')

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'Pengeluaran' | 'Pemasukan'>('Pengeluaran')
  const [formCategory, setFormCategory] = useState('Biaya Operasional')
  const [formAccount, setFormAccount] = useState('Kas Toko')
  const [formAmount, setFormAmount] = useState('0')
  const [formDueDay, setFormDueDay] = useState('10')
  const [formNotes, setFormNotes] = useState('')

  // Quick Execute Modal
  const [executingTemplate, setExecutingTemplate] = useState<RecurringCashTemplate | null>(null)
  const [execAmount, setExecAmount] = useState('0')
  const [execDate, setExecDate] = useState(new Date().toISOString().slice(0, 10))
  const [execAccount, setExecAccount] = useState('Kas Toko')
  const [isExecuting, setIsExecuting] = useState(false)

  const tenantId = resolveTenantId()
  const paymentMethods = usePaymentMethods()
  const currentMonthKey = getCurrentMonthKey()

  const availableAccounts = useMemo(() => {
    const list = ['Kas Toko']
    for (const pm of paymentMethods) {
      if (pm.status === 'Aktif' && !list.includes(pm.name)) {
        list.push(pm.name)
      }
    }
    return list
  }, [paymentMethods])

  const loadData = useCallback(() => {
    if (!tenantId) return
    setLoading(true)
    getRecurringTemplates(tenantId)
      .then((data) => setTemplates(data))
      .catch((err) => console.error('Failed to load recurring templates:', err))
      .finally(() => setLoading(false))
  }, [tenantId])

  useEffect(() => {
    if (open) {
      loadData()
      setActiveTab('list')
      setEditingId(null)
    }
  }, [open, loadData])

  // Metrics
  const totalMonthlyExpense = useMemo(() => {
    return templates
      .filter((t) => t.isActive && t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0)
  }, [templates])

  const totalMonthlyIncome = useMemo(() => {
    return templates
      .filter((t) => t.isActive && t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0)
  }, [templates])

  const pendingTemplates = useMemo(() => {
    return templates.filter((t) => t.isActive && !isExecutedThisMonth(t, currentMonthKey))
  }, [templates, currentMonthKey])

  const executedCount = templates.filter((t) => t.isActive && isExecutedThisMonth(t, currentMonthKey)).length
  const totalActive = templates.filter((t) => t.isActive).length

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (filterType === 'all') return true
      return t.type === filterType
    })
  }, [templates, filterType])

  function handleStartCreate() {
    setEditingId(null)
    setFormName('')
    setFormType('Pengeluaran')
    setFormCategory('Biaya Operasional')
    setFormAccount(availableAccounts[0] || 'Kas Toko')
    setFormAmount('0')
    setFormDueDay('10')
    setFormNotes('')
    setActiveTab('form')
  }

  function handleStartEdit(t: RecurringCashTemplate) {
    setEditingId(t.id)
    setFormName(t.name)
    setFormType(t.type)
    setFormCategory(t.category)
    setFormAccount(t.account)
    setFormAmount(String(t.amount))
    setFormDueDay(String(t.dueDay))
    setFormNotes(t.notes || '')
    setActiveTab('form')
  }

  async function handleSaveTemplate() {
    if (!tenantId || !formName.trim()) {
      toast.error('Nama transaksi wajib diisi')
      return
    }
    const numAmount = Number(formAmount) || 0
    if (numAmount <= 0) {
      toast.error('Nominal harus lebih dari 0')
      return
    }

    const payload: RecurringCashTemplate = {
      id: editingId || `rec-${crypto.randomUUID()}`,
      tenantId,
      name: formName.trim(),
      type: formType,
      category: formCategory.trim() || (formType === 'Pengeluaran' ? 'Biaya Operasional' : 'Pendapatan Lain'),
      account: formAccount,
      amount: numAmount,
      dueDay: Math.min(31, Math.max(1, Number(formDueDay) || 1)),
      notes: formNotes.trim(),
      isActive: true,
      lastExecutedMonth: editingId ? templates.find((t) => t.id === editingId)?.lastExecutedMonth : undefined,
      lastExecutedDate: editingId ? templates.find((t) => t.id === editingId)?.lastExecutedDate : undefined,
      lastExecutedCashRef: editingId ? templates.find((t) => t.id === editingId)?.lastExecutedCashRef : undefined,
    }

    const updated = editingId
      ? templates.map((t) => (t.id === editingId ? payload : t))
      : [...templates, payload]

    await saveRecurringTemplates(tenantId, updated)
    setTemplates(updated)
    toast.success(editingId ? 'Template rutin berhasil diperbarui' : 'Template rutin berhasil ditambahkan')
    setActiveTab('list')
    setEditingId(null)
  }

  async function handleDeleteTemplate(id: string) {
    if (!tenantId) return
    const updated = templates.filter((t) => t.id !== id)
    await saveRecurringTemplates(tenantId, updated)
    setTemplates(updated)
    toast.success('Template rutin berhasil dihapus')
  }

  function handleOpenExecute(t: RecurringCashTemplate) {
    setExecutingTemplate(t)
    setExecAmount(String(t.amount))
    setExecDate(new Date().toISOString().slice(0, 10))
    setExecAccount(t.account)
  }

  async function handleConfirmExecute() {
    if (!tenantId || !executingTemplate) return
    setIsExecuting(true)
    try {
      const numAmount = Number(execAmount) || executingTemplate.amount
      const res = await executeRecurringTransaction(tenantId, executingTemplate.id, {
        executionDate: execDate,
        amount: numAmount,
        account: execAccount,
      })
      toast.success(
        `Transaksi ${executingTemplate.name} berhasil dibukukan (${res.ref})`,
      )
      setExecutingTemplate(null)
      loadData()
      onSuccess?.()
    } catch (err) {
      console.error('Execution error:', err)
      toast.error('Gagal membukukan transaksi')
    } finally {
      setIsExecuting(false)
    }
  }

  async function handleExecuteAllPending() {
    if (!tenantId || pendingTemplates.length === 0) return
    setIsExecuting(true)
    try {
      const res = await executeAllPendingRecurring(tenantId)
      toast.success(`${res.executedCount} transaksi rutin berhasil dibukukan untuk bulan ini`)
      loadData()
      onSuccess?.()
    } catch (err) {
      console.error('Execute all error:', err)
      toast.error('Gagal membukukan beberapa transaksi')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium relative">
              <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
              <span>Biaya & Pemasukan Rutin</span>
              {pendingTemplates.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {pendingTemplates.length}
                </span>
              )}
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock className="h-5 w-5 text-blue-500" />
                Transaksi Rutin Bulanan (Biaya & Pemasukan Tetap)
              </DialogTitle>
            </div>
            <DialogDescription>
              Kelola daftar biaya tetap bulanan (sewa, listrik, air, internet, gaji) dan pendapatan rutin agar pembukuan tidak pernah terlewat.
            </DialogDescription>
          </DialogHeader>

          {/* Metric Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border bg-card p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Biaya Rutin / Bln</span>
                <ArrowUpRight className="h-4 w-4 text-rose-500" />
              </div>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-rose-600">
                {formatCurrency(totalMonthlyExpense)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pengeluaran tetap per bulan</p>
            </div>

            <div className="rounded-xl border bg-card p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Pemasukan Rutin / Bln</span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-emerald-600">
                {formatCurrency(totalMonthlyIncome)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pemasukan tetap per bulan</p>
            </div>

            <div className="rounded-xl border bg-card p-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status Bulan Ini ({currentMonthKey})</span>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-1.5 text-sm font-semibold">
                  {executedCount} dari {totalActive} tercatat
                </p>
              </div>
              {pendingTemplates.length > 0 ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleExecuteAllPending}
                  disabled={isExecuting}
                  className="mt-2 h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  <Play className="h-3 w-3" />
                  Catat Semua yang Belum ({pendingTemplates.length})
                </Button>
              ) : (
                <Badge variant="outline" className="mt-2 text-[11px] bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 py-1 gap-1 justify-center">
                  <CheckCircle2 className="h-3 w-3" /> Semua Rutin Bulan Ini Selesai
                </Badge>
              )}
            </div>
          </div>

          {/* Navigation Bar between List and Form */}
          <div className="flex items-center justify-between border-b pb-2 pt-2">
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
              <Button
                type="button"
                variant={activeTab === 'list' && filterType === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('list')
                  setFilterType('all')
                }}
                className="h-7 text-xs font-medium"
              >
                Semua ({templates.length})
              </Button>
              <Button
                type="button"
                variant={activeTab === 'list' && filterType === 'Pengeluaran' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('list')
                  setFilterType('Pengeluaran')
                }}
                className="h-7 text-xs font-medium text-rose-600"
              >
                Biaya ({templates.filter((t) => t.type === 'Pengeluaran').length})
              </Button>
              <Button
                type="button"
                variant={activeTab === 'list' && filterType === 'Pemasukan' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('list')
                  setFilterType('Pemasukan')
                }}
                className="h-7 text-xs font-medium text-emerald-600"
              >
                Pemasukan ({templates.filter((t) => t.type === 'Pemasukan').length})
              </Button>
            </div>

            {activeTab === 'list' ? (
              <Button
                type="button"
                size="sm"
                onClick={handleStartCreate}
                className="h-7 text-xs gap-1 font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Transaksi Rutin
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('list')}
                className="h-7 text-xs font-medium"
              >
                Kembali ke Daftar
              </Button>
            )}
          </div>

          {/* Content Area */}
          {activeTab === 'list' ? (
            <div className="space-y-2.5">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Memuat data transaksi rutin...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground border rounded-xl border-dashed">
                  Belum ada transaksi rutin pada filter ini.
                </div>
              ) : (
                filteredTemplates.map((item) => {
                  const done = isExecutedThisMonth(item, currentMonthKey)
                  const isExpense = item.type === 'Pengeluaran'
                  const isBank = item.account.toLowerCase().includes('bank') || item.account.toLowerCase().includes('bca')

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                        done ? 'bg-muted/10 opacity-90' : 'bg-card shadow-sm hover:border-primary/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{item.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isExpense
                                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {item.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-muted/50 gap-1">
                            {isBank ? <Building2 className="h-2.5 w-2.5 text-blue-500" /> : <Wallet className="h-2.5 w-2.5 text-emerald-500" />}
                            <span>{item.account}</span>
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>Kategori: <strong className="text-foreground font-medium">{item.category}</strong></span>
                          <span>•</span>
                          <span>Jatuh tempo: <strong>Tgl {item.dueDay}</strong> per bulan</span>
                          {item.notes && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-xs">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                        <div className="text-left sm:text-right">
                          <p className={`text-base font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
                          </p>
                          <div className="mt-0.5">
                            {done ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" /> Tercatat ({item.lastExecutedCashRef})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                                <AlertCircle className="h-3 w-3" /> Belum Dibukukan
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!done ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenExecute(item)}
                              className="h-8 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Play className="h-3 w-3" /> Catat Sekarang
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenExecute(item)}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              title="Catat lagi untuk bulan ini jika ada tambahan biaya"
                            >
                              Catat Lagi
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(item.id)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            /* Create / Edit Form */
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="border-b pb-2">
                <p className="text-sm font-bold text-foreground">
                  {editingId ? 'Edit Template Transaksi Rutin' : 'Tambah Template Transaksi Rutin Baru'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Simpan rincian pengeluaran/pemasukan rutin agar dapat dibukukan otomatis setiap bulan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium block mb-1">
                    Nama Transaksi Rutin <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Tagihan Listrik PLN & PDAM Toko"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Jenis Transaksi</label>
                  <Select value={formType} onValueChange={(v: 'Pengeluaran' | 'Pemasukan') => setFormType(v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pengeluaran">Pengeluaran (Biaya Rutin)</SelectItem>
                      <SelectItem value="Pemasukan">Pemasukan (Pendapatan Rutin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Kategori Kas</label>
                  <Input
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Misal: Utilitas, Gaji & Upah, Sewa"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Akun Pembayaran / Penerima</label>
                  <Select value={formAccount} onValueChange={setFormAccount}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAccounts.map((acc) => (
                        <SelectItem key={acc} value={acc}>
                          {acc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">
                    Tanggal Jatuh Tempo Bulanan (Tgl 1 - 31)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formDueDay}
                    onChange={(e) => setFormDueDay(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tanggal rutin transaksi ditagih / dibayar</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium block mb-1">
                    Nominal Tetap / Estimasi (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <CurrencyInput
                    prefix="Rp"
                    value={formAmount}
                    onValueChange={(v) => setFormAmount(String(v))}
                    placeholder="0"
                    className="h-9"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Nilai ini dapat disesuaikan kembali saat melakukan pencatatan bulanan.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium block mb-1">Keterangan Tambahan</label>
                  <Input
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Catatan tambahan seperti No ID Pelanggan PLN / No Rekening..."
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('list')}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="h-8 text-xs font-medium"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan Template'}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Execute Modal */}
      {executingTemplate && (
        <Dialog open={Boolean(executingTemplate)} onOpenChange={(o) => !o && setExecutingTemplate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Catat Transaksi Rutin Bulan Ini
              </DialogTitle>
              <DialogDescription>
                Konfirmasi pembukuan <strong>{executingTemplate.name}</strong> untuk periode berjalan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tanggal Transaksi</label>
                <Input
                  type="date"
                  value={execDate}
                  onChange={(e) => setExecDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Akun Kas / Bank</label>
                <Select value={execAccount} onValueChange={setExecAccount}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((acc) => (
                      <SelectItem key={acc} value={acc}>
                        {acc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Nominal {executingTemplate.type === 'Pengeluaran' ? 'Keluar' : 'Masuk'}
                </label>
                <CurrencyInput
                  prefix="Rp"
                  value={execAmount}
                  onValueChange={(v) => setExecAmount(String(v))}
                  placeholder="0"
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Sesuaikan nilai jika ada kenaikan / penurunan tagihan bulan ini.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setExecutingTemplate(null)}
                disabled={isExecuting}
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmExecute}
                disabled={isExecuting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isExecuting ? 'Membukukan...' : 'Bukukan Transaksi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
