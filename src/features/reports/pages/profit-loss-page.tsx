import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useProfitLoss } from '@/features/reports/hooks/use-profit-loss'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

export function ProfitLossPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useProfitLoss(params)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAccountCodes, setShowAccountCodes] = useState(false)

  function handleExport() {
    if (!data) return
    const rows = [
      { id: 'h1', akun: 'I. PENDAPATAN USAHA', nilai: '', persen: '' },
      ...data.revenues.map((r, i) => ({
        id: `rev${i}`,
        akun: `   ${r.accountCode} - ${r.accountName}`,
        nilai: String(r.amount),
        persen: data.totalRevenue > 0 ? `${((r.amount / data.totalRevenue) * 100).toFixed(1)}%` : '0%',
      })),
      { id: 'tr', akun: 'TOTAL PENDAPATAN USAHA', nilai: String(data.totalRevenue), persen: '100.0%' },
      { id: 'sp1', akun: '', nilai: '', persen: '' },
      { id: 'h2', akun: 'II. HARGA POKOK PENJUALAN (HPP)', nilai: '', persen: '' },
      ...data.cogs.map((c, i) => ({
        id: `cogs${i}`,
        akun: `   ${c.accountCode} - ${c.accountName}`,
        nilai: String(-c.amount),
        persen: data.totalRevenue > 0 ? `${((c.amount / data.totalRevenue) * 100).toFixed(1)}%` : '0%',
      })),
      { id: 'tc', akun: 'TOTAL HARGA POKOK PENJUALAN', nilai: String(-data.totalCogs), persen: data.totalRevenue > 0 ? `${((data.totalCogs / data.totalRevenue) * 100).toFixed(1)}%` : '0%' },
      { id: 'gp', akun: 'LABA KOTOR (GROSS PROFIT)', nilai: String(data.grossProfit), persen: data.totalRevenue > 0 ? `${((data.grossProfit / data.totalRevenue) * 100).toFixed(1)}%` : '0%' },
      { id: 'sp2', akun: '', nilai: '', persen: '' },
      { id: 'h3', akun: 'III. BEBAN OPERASIONAL', nilai: '', persen: '' },
      ...data.expenses.map((e, i) => ({
        id: `exp${i}`,
        akun: `   ${e.accountCode} - ${e.accountName}`,
        nilai: String(-e.amount),
        persen: data.totalRevenue > 0 ? `${((e.amount / data.totalRevenue) * 100).toFixed(1)}%` : '0%',
      })),
      { id: 'te', akun: 'TOTAL BEBAN OPERASIONAL', nilai: String(-data.totalExpense), persen: data.totalRevenue > 0 ? `${((data.totalExpense / data.totalRevenue) * 100).toFixed(1)}%` : '0%' },
      { id: 'sp3', akun: '', nilai: '', persen: '' },
      { id: 'np', akun: 'LABA BERSIH (NET PROFIT)', nilai: String(data.netProfit), persen: data.totalRevenue > 0 ? `${((data.netProfit / data.totalRevenue) * 100).toFixed(1)}%` : '0%' },
    ]
    exportToCsv(
      `laba-rugi-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`,
      [
        { key: 'akun', header: 'Akun / Pos Keuangan' },
        { key: 'nilai', header: 'Nominal (Rp)' },
        { key: 'persen', header: '% dari Pendapatan' },
      ],
      rows,
    )
  }

  const query = searchQuery.toLowerCase().trim()

  const revenues = (data?.revenues ?? []).filter(
    (r) => !query || r.accountName.toLowerCase().includes(query) || r.accountCode.toLowerCase().includes(query),
  )
  const cogs = (data?.cogs ?? []).filter(
    (c) => !query || c.accountName.toLowerCase().includes(query) || c.accountCode.toLowerCase().includes(query),
  )
  const expenses = (data?.expenses ?? []).filter(
    (e) => !query || e.accountName.toLowerCase().includes(query) || e.accountCode.toLowerCase().includes(query),
  )

  function getLedgerLink(accountCode: string) {
    const searchParams = new URLSearchParams()
    searchParams.set('accountCode', accountCode)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)
    return `/reports/general-ledger?${searchParams.toString()}`
  }

  // Margin calculations
  const totalRevenue = data?.totalRevenue ?? 0
  const grossProfit = data?.grossProfit ?? 0
  const netProfit = data?.netProfit ?? 0
  const totalExpense = data?.totalExpense ?? 0
  const totalCogs = data?.totalCogs ?? 0

  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0'
  const netMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0'
  const expenseRatioPct = totalRevenue > 0 ? ((totalExpense / totalRevenue) * 100).toFixed(1) : '0.0'
  const cogsRatioPct = totalRevenue > 0 ? ((totalCogs / totalRevenue) * 100).toFixed(1) : '0.0'

  const isProfitable = netProfit >= 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Laporan Laba Rugi</h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan pendapatan, beban pokok penjualan (HPP), biaya operasional, dan laba bersih usaha.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-11">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccountCodes((prev) => !prev)}
            className="text-xs"
          >
            {showAccountCodes ? 'Sembunyikan Kode Akun' : 'Tampilkan Kode Akun'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <ReportDateFilter />

      {/* Cross-report correlation navigation with date sync */}
      <ReportCorrelationNav
        links={[
          { to: '/reports/sales', label: 'Laporan Penjualan', hint: 'Detail order & transaksi omzet' },
          { to: '/reports/balance-sheet', label: 'Neraca Keuangan', hint: 'Akumulasi laba & saldo aset' },
          { to: '/cash', label: 'Buku Kas & Bank', hint: 'Mutasi uang masuk & keluar' },
          { to: '/reports/general-ledger', label: 'Buku Besar', hint: 'Jurnal rincian akun' },
        ]}
      />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : data ? (
        <>
          {/* Executive Margin Breakdown Card */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    Kinerja Keuangan Periode Ini
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      isProfitable
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isProfitable ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Usaha Menguntungkan
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Posisi Rugi Bersih
                      </span>
                    )}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(netProfit)}
                  </p>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Laba Bersih ({netMarginPct}% dari Omzet)
                  </span>
                </div>
              </div>

              {/* Quick Key Ratios */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Margin Kotor (HPP)</p>
                  <p className="mt-1 text-base font-bold text-emerald-600">{grossMarginPct}%</p>
                  <p className="text-[10px] text-muted-foreground">HPP: {cogsRatioPct}%</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Beban Operasional</p>
                  <p className="mt-1 text-base font-bold text-amber-600">{expenseRatioPct}%</p>
                  <p className="text-[10px] text-muted-foreground">Rasio Pengeluaran</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Margin Bersih</p>
                  <p className={`mt-1 text-base font-bold ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netMarginPct}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Net Profit Margin</p>
                </div>
              </div>
            </div>

            {/* Visual Margin Flow Bar */}
            {totalRevenue > 0 && (
              <div className="mt-5 space-y-1.5 border-t pt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Alur Pendapatan (Omzet 100%)</span>
                  <span>HPP ({cogsRatioPct}%) + Biaya ({expenseRatioPct}%) = Sisa Laba ({netMarginPct}%)</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, Number(cogsRatioPct)))}%` }}
                    className="bg-rose-400"
                    title={`HPP: ${formatCurrency(totalCogs)} (${cogsRatioPct}%)`}
                  />
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, Number(expenseRatioPct)))}%` }}
                    className="bg-amber-400"
                    title={`Beban Operasional: ${formatCurrency(totalExpense)} (${expenseRatioPct}%)`}
                  />
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, Number(netMarginPct)))}%` }}
                    className="bg-emerald-500"
                    title={`Laba Bersih: ${formatCurrency(netProfit)} (${netMarginPct}%)`}
                  />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400 inline-block" /> HPP (Beban Pokok)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" /> Beban Operasional
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Laba Bersih
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Metric Cards Row */}
          <div className="grid gap-3 md:grid-cols-4">
            <ReportMetricCard
              label="Total Pendapatan Usaha"
              value={formatCurrency(data.totalRevenue)}
              tone="positive"
            />
            <ReportMetricCard
              label="Total HPP (Beban Pokok)"
              value={formatCurrency(data.totalCogs)}
            />
            <ReportMetricCard
              label="Laba Kotor"
              value={formatCurrency(data.grossProfit)}
              tone={data.grossProfit >= 0 ? 'positive' : 'negative'}
            />
            <ReportMetricCard
              label="Total Beban Operasional"
              value={formatCurrency(data.totalExpense)}
              tone="negative"
            />
          </div>

          <FilterToolbar
            placeholder="Cari pos atau akun laba rugi..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Structured Multi-Step Profit & Loss Statement */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 px-6 py-4">
              <h2 className="text-base font-semibold">Format Standar Laporan Laba Rugi</h2>
              <p className="text-xs text-muted-foreground">
                Sesuai standar akuntansi UMKM (SAK EMKM) dengan perincian berjenjang (multi-step format).
              </p>
            </div>

            <Table>
              <TableBody>
                {/* ── BAGIAN I: PENDAPATAN ── */}
                <TableRow className="bg-muted/60 border-y">
                  <TableCell className="py-2.5 font-bold text-sm tracking-wide text-primary">
                    I. PENDAPATAN USAHA (REVENUE)
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-xs text-muted-foreground w-28">
                    % Omzet
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-bold text-sm w-44">
                    Nominal
                  </TableCell>
                </TableRow>

                {revenues.length === 0 ? (
                  <TableRow className="border-b">
                    <TableCell colSpan={3} className="py-3 text-sm text-muted-foreground italic pl-8">
                      {query ? 'Tidak ada akun pendapatan yang cocok dengan pencarian' : 'Belum ada data pendapatan penjualan tercatat'}
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues.map((r) => {
                    const rowPct = totalRevenue > 0 ? ((r.amount / totalRevenue) * 100).toFixed(1) : '0.0'
                    return (
                      <TableRow key={r.accountCode} className="group border-b hover:bg-muted/30">
                        <TableCell className="py-2.5 pl-8">
                          <Link
                            to={getLedgerLink(r.accountCode)}
                            className="inline-flex items-center gap-2 hover:text-primary hover:underline text-sm"
                            title="Buka Buku Besar akun ini"
                          >
                            {showAccountCodes && (
                              <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {r.accountCode}
                              </span>
                            )}
                            <span>{r.accountName}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs text-muted-foreground font-mono">
                          {rowPct}%
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-medium text-emerald-600">
                          {formatCurrency(r.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}

                {/* Subtotal Pendapatan */}
                <TableRow className="border-t bg-muted/20 font-semibold">
                  <TableCell className="py-2.5 pl-6 text-sm">TOTAL PENDAPATAN USAHA (A)</TableCell>
                  <TableCell className="py-2.5 text-right text-xs font-mono">100.0%</TableCell>
                  <TableCell className="py-2.5 text-right font-bold text-emerald-600 text-sm">
                    {formatCurrency(data.totalRevenue)}
                  </TableCell>
                </TableRow>

                {/* ── BAGIAN II: HARGA POKOK PENJUALAN ── */}
                <TableRow className="bg-muted/60 border-y">
                  <TableCell className="py-2.5 font-bold text-sm tracking-wide text-primary">
                    II. HARGA POKOK PENJUALAN (HPP / COGS)
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-xs text-muted-foreground">
                    % Omzet
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-bold text-sm">
                    Nominal
                  </TableCell>
                </TableRow>

                {cogs.length === 0 ? (
                  <TableRow className="border-b">
                    <TableCell colSpan={3} className="py-3 text-sm text-muted-foreground italic pl-8">
                      {query ? 'Tidak ada akun HPP yang cocok dengan pencarian' : 'Belum ada data HPP / biaya pokok tercatat'}
                    </TableCell>
                  </TableRow>
                ) : (
                  cogs.map((c) => {
                    const rowPct = totalRevenue > 0 ? ((c.amount / totalRevenue) * 100).toFixed(1) : '0.0'
                    return (
                      <TableRow key={c.accountCode} className="group border-b hover:bg-muted/30">
                        <TableCell className="py-2.5 pl-8">
                          <Link
                            to={getLedgerLink(c.accountCode)}
                            className="inline-flex items-center gap-2 hover:text-primary hover:underline text-sm"
                            title="Buka Buku Besar akun ini"
                          >
                            {showAccountCodes && (
                              <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {c.accountCode}
                              </span>
                            )}
                            <span>{c.accountName}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs text-muted-foreground font-mono">
                          {rowPct}%
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-medium text-rose-600">
                          -{formatCurrency(c.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}

                {/* Subtotal HPP */}
                <TableRow className="border-t bg-muted/20 font-semibold">
                  <TableCell className="py-2.5 pl-6 text-sm">TOTAL HARGA POKOK PENJUALAN (B)</TableCell>
                  <TableCell className="py-2.5 text-right text-xs font-mono">{cogsRatioPct}%</TableCell>
                  <TableCell className="py-2.5 text-right font-bold text-rose-600 text-sm">
                    -{formatCurrency(data.totalCogs)}
                  </TableCell>
                </TableRow>

                {/* LABA KOTOR HIGHLIGHT ROW */}
                <TableRow className="bg-emerald-500/10 border-y font-bold">
                  <TableCell className="py-3 pl-6 text-sm text-emerald-900 dark:text-emerald-300">
                    LABA KOTOR USAHA (GROSS PROFIT = A - B)
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-emerald-900 dark:text-emerald-300">
                    {grossMarginPct}%
                  </TableCell>
                  <TableCell
                    className={`py-3 text-right text-base ${
                      data.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(data.grossProfit)}
                  </TableCell>
                </TableRow>

                {/* ── BAGIAN III: BEBAN OPERASIONAL ── */}
                <TableRow className="bg-muted/60 border-y">
                  <TableCell className="py-2.5 font-bold text-sm tracking-wide text-primary">
                    III. BEBAN OPERASIONAL USAHA (OPERATING EXPENSES)
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-medium text-xs text-muted-foreground">
                    % Omzet
                  </TableCell>
                  <TableCell className="py-2.5 text-right font-bold text-sm">
                    Nominal
                  </TableCell>
                </TableRow>

                {expenses.length === 0 ? (
                  <TableRow className="border-b">
                    <TableCell colSpan={3} className="py-3 text-sm text-muted-foreground italic pl-8">
                      {query ? 'Tidak ada akun beban yang cocok dengan pencarian' : 'Belum ada beban operasional tercatat'}
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((e) => {
                    const rowPct = totalRevenue > 0 ? ((e.amount / totalRevenue) * 100).toFixed(1) : '0.0'
                    return (
                      <TableRow key={e.accountCode} className="group border-b hover:bg-muted/30">
                        <TableCell className="py-2.5 pl-8">
                          <Link
                            to={getLedgerLink(e.accountCode)}
                            className="inline-flex items-center gap-2 hover:text-primary hover:underline text-sm"
                            title="Buka Buku Besar akun ini"
                          >
                            {showAccountCodes && (
                              <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {e.accountCode}
                              </span>
                            )}
                            <span>{e.accountName}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5 text-right text-xs text-muted-foreground font-mono">
                          {rowPct}%
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-medium text-rose-600">
                          -{formatCurrency(e.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}

                {/* Subtotal Beban Operasional */}
                <TableRow className="border-t bg-muted/20 font-semibold">
                  <TableCell className="py-2.5 pl-6 text-sm">TOTAL BEBAN OPERASIONAL (C)</TableCell>
                  <TableCell className="py-2.5 text-right text-xs font-mono">{expenseRatioPct}%</TableCell>
                  <TableCell className="py-2.5 text-right font-bold text-rose-600 text-sm">
                    -{formatCurrency(data.totalExpense)}
                  </TableCell>
                </TableRow>

                {/* FINAL LABA BERSIH HIGHLIGHT ROW */}
                <TableRow className={`border-t-2 border-b-2 font-bold ${isProfitable ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40'}`}>
                  <TableCell className="py-4 pl-6 text-base">
                    LABA BERSIH PERIODE BERJALAN (NET PROFIT = LABA KOTOR - C)
                  </TableCell>
                  <TableCell className="py-4 text-right font-mono text-sm">
                    {netMarginPct}%
                  </TableCell>
                  <TableCell
                    className={`py-4 text-right text-xl font-extrabold ${
                      isProfitable ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(data.netProfit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  )
}
