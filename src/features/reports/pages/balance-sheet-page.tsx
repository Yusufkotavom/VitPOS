import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useBalanceSheet } from '@/features/reports/hooks/use-balance-sheet'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { OpeningBalanceDialog } from '@/features/accounting/components/opening-balance-dialog'

export function BalanceSheetPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading, refetch } = useBalanceSheet(params)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAccountCodes, setShowAccountCodes] = useState(false)

  function handleExport() {
    if (!data) return
    const rows = [
      { id: '1', akun: 'I. ASET (AKTIVA)', nilai: '' },
      { id: '1a', akun: '  A. Aset Lancar', nilai: '' },
      ...currentAssets.map((a, i) => ({ id: `ca${i}`, akun: `    ${a.accountCode} - ${a.accountName}`, nilai: String(a.balance) })),
      { id: 'tca', akun: '  Subtotal Aset Lancar', nilai: String(totalCurrentAssets) },
      { id: '1b', akun: '  B. Aset Tetap & Non-Lancar', nilai: '' },
      ...fixedAssets.map((a, i) => ({ id: `fa${i}`, akun: `    ${a.accountCode} - ${a.accountName}`, nilai: String(a.balance) })),
      { id: 'tfa', akun: '  Subtotal Aset Tetap', nilai: String(totalFixedAssets) },
      { id: 'ta', akun: 'TOTAL ASET (AKTIVA)', nilai: String(data.totalAssets) },
      { id: 'sp1', akun: '', nilai: '' },
      { id: '2', akun: 'II. LIABILITAS / KEWAJIBAN', nilai: '' },
      ...data.liabilities.map((l, i) => ({ id: `l${i}`, akun: `    ${l.accountCode} - ${l.accountName}`, nilai: String(l.balance) })),
      { id: 'tl', akun: 'TOTAL LIABILITAS', nilai: String(data.totalLiabilities) },
      { id: 'sp2', akun: '', nilai: '' },
      { id: '3', akun: 'III. EKUITAS / MODAL', nilai: '' },
      ...data.equities.map((e, i) => ({ id: `e${i}`, akun: `    ${e.accountCode} - ${e.accountName}`, nilai: String(e.balance) })),
      { id: 'te', akun: 'TOTAL EKUITAS', nilai: String(data.totalEquity) },
      { id: 'sp3', akun: '', nilai: '' },
      { id: '4', akun: 'TOTAL LIABILITAS & EKUITAS (PASIVA)', nilai: String(data.totalLiabilitiesEquity) },
    ]
    exportToCsv(
      `neraca-${params.to ?? 'current'}.csv`,
      [
        { key: 'akun', header: 'Akun / Komponen Neraca' },
        { key: 'nilai', header: 'Nominal (Rp)' },
      ],
      rows,
    )
  }

  const query = searchQuery.toLowerCase().trim()

  const allAssets = data?.assets ?? []
  const allLiabilities = data?.liabilities ?? []
  const allEquities = data?.equities ?? []

  // Classification: Current Assets (1-1xxx, 1-2xxx, 1-3xxx) vs Fixed Assets (1-4xxx, 1-5xxx, dsb)
  const currentAssets = allAssets.filter(
    (a) => a.accountCode.startsWith('1-1') || a.accountCode.startsWith('1-2') || a.accountCode.startsWith('1-3'),
  )
  const fixedAssets = allAssets.filter(
    (a) => !a.accountCode.startsWith('1-1') && !a.accountCode.startsWith('1-2') && !a.accountCode.startsWith('1-3'),
  )

  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.balance, 0)
  const totalFixedAssets = fixedAssets.reduce((s, a) => s + a.balance, 0)

  // Filtered lists by query
  const filteredCurrentAssets = currentAssets.filter(
    (a) => !query || a.accountName.toLowerCase().includes(query) || a.accountCode.toLowerCase().includes(query),
  )
  const filteredFixedAssets = fixedAssets.filter(
    (a) => !query || a.accountName.toLowerCase().includes(query) || a.accountCode.toLowerCase().includes(query),
  )
  const filteredLiabilities = allLiabilities.filter(
    (l) => !query || l.accountName.toLowerCase().includes(query) || l.accountCode.toLowerCase().includes(query),
  )
  const filteredEquities = allEquities.filter(
    (e) => !query || e.accountName.toLowerCase().includes(query) || e.accountCode.toLowerCase().includes(query),
  )

  function getLedgerLink(accountCode: string) {
    const searchParams = new URLSearchParams()
    searchParams.set('accountCode', accountCode)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)
    return `/reports/general-ledger?${searchParams.toString()}`
  }

  // Balance Check
  const totalAssets = data?.totalAssets ?? 0
  const totalLiabilitiesEquity = data?.totalLiabilitiesEquity ?? 0
  const balanceDiff = Math.abs(totalAssets - totalLiabilitiesEquity)
  const isBalanced = balanceDiff < 1

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Laporan Neraca Keuangan</h1>
          <p className="text-sm text-muted-foreground">
            Posisi aset, liabilitas (hutang), dan ekuitas (modal) usaha per tanggal laporan.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <OpeningBalanceDialog onSaved={() => refetch()} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccountCodes((prev) => !prev)}
            className="text-xs"
          >
            {showAccountCodes ? 'Sembunyikan Kode' : 'Tampilkan Kode'}
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
          { to: '/reports/profit-loss', label: 'Laba Rugi', hint: 'Kinerja laba periode berjalan' },
          { to: '/cash', label: 'Buku Kas & Bank', hint: 'Mutasi uang masuk & keluar' },
          { to: '/reports/payments?tab=receivables', label: 'Piutang Usaha', hint: 'Rincian piutang belum lunas' },
          { to: '/reports/inventory', label: 'Stok & Inventori', hint: 'Rincian persediaan fisik' },
          { to: '/reports/general-ledger', label: 'Buku Besar', hint: 'Mutasi akun neraca' },
        ]}
      />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : data ? (
        <>
          {/* 1. Neraca Balance Indicator Card */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition-all ${
              isBalanced
                ? 'border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30'
                : 'border-amber-300 bg-amber-50/70 dark:bg-amber-950/30'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-full p-1.5 ${
                    isBalanced
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}
                >
                  {isBalanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {isBalanced ? 'Neraca Seimbang (Balanced)' : 'Neraca Belum Seimbang'}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isBalanced
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {isBalanced ? 'Persamaan Akuntansi Tepat' : `Selisih ${formatCurrency(balanceDiff)}`}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isBalanced
                      ? `Total Aset (${formatCurrency(totalAssets)}) = Total Liabilitas (${formatCurrency(
                          data.totalLiabilities,
                        )}) + Total Ekuitas (${formatCurrency(data.totalEquity)})`
                      : 'Pastikan modal awal dan saldo pembukuan sudah diatur agar Total Aset sama dengan Total Pasiva.'}
                  </p>
                </div>
              </div>

              {!isBalanced && (
                <div className="flex items-center gap-2 shrink-0">
                  <OpeningBalanceDialog
                    trigger={
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        Atur Saldo Awal Sekarang
                      </Button>
                    }
                    onSaved={() => refetch()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid gap-3 md:grid-cols-4">
            <ReportMetricCard
              label="Total Aset (Aktiva)"
              value={formatCurrency(data.totalAssets)}
              tone="positive"
            />
            <ReportMetricCard
              label="Aset Lancar (Kas & Persediaan)"
              value={formatCurrency(totalCurrentAssets)}
            />
            <ReportMetricCard
              label="Total Liabilitas (Hutang)"
              value={formatCurrency(data.totalLiabilities)}
              tone="negative"
            />
            <ReportMetricCard
              label="Total Ekuitas (Modal)"
              value={formatCurrency(data.totalEquity)}
              tone="positive"
            />
          </div>

          <FilterToolbar
            placeholder="Cari akun neraca (kas, bank, piutang, hutang, modal)..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Two-Column Structured Balance Sheet */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* ── SISI KIRI: ASET (AKTIVA) ── */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="border-b bg-muted/40 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-primary">ASET (AKTIVA)</h2>
                  <p className="text-xs text-muted-foreground">Seluruh kekayaan dan hak yang dimiliki usaha</p>
                </div>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(data.totalAssets)}</span>
              </div>

              <div className="flex-1">
                <Table>
                  <TableBody>
                    {/* A. Aset Lancar */}
                    <TableRow className="bg-muted/30 border-y">
                      <TableCell colSpan={2} className="py-2 pl-4 font-bold text-xs tracking-wider uppercase text-muted-foreground">
                        A. Aset Lancar (Kas, Bank, Piutang, Persediaan)
                      </TableCell>
                    </TableRow>

                    {filteredCurrentAssets.length === 0 ? (
                      <TableRow className="border-b">
                        <TableCell colSpan={2} className="py-3 text-sm text-muted-foreground italic pl-6">
                          {query ? 'Tidak ada akun aset lancar yang cocok' : 'Belum ada data aset lancar'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurrentAssets.map((a) => (
                        <TableRow key={a.accountCode} className="group border-b hover:bg-muted/30">
                          <TableCell className="py-2.5 pl-6">
                            <Link
                              to={getLedgerLink(a.accountCode)}
                              className="inline-flex items-center gap-2 hover:text-primary hover:underline text-sm"
                              title="Buka Buku Besar akun ini"
                            >
                              {showAccountCodes && (
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {a.accountCode}
                                </span>
                              )}
                              <span>{a.accountName}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                            </Link>
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-medium text-emerald-600">
                            {formatCurrency(a.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    <TableRow className="border-t bg-muted/10 font-semibold">
                      <TableCell className="py-2 pl-6 text-xs text-muted-foreground">Subtotal Aset Lancar</TableCell>
                      <TableCell className="py-2 text-right font-semibold text-sm">
                        {formatCurrency(totalCurrentAssets)}
                      </TableCell>
                    </TableRow>

                    {/* B. Aset Tetap */}
                    <TableRow className="bg-muted/30 border-y">
                      <TableCell colSpan={2} className="py-2 pl-4 font-bold text-xs tracking-wider uppercase text-muted-foreground">
                        B. Aset Tetap & Non-Lancar (Peralatan & Fasilitas)
                      </TableCell>
                    </TableRow>

                    {filteredFixedAssets.length === 0 ? (
                      <TableRow className="border-b">
                        <TableCell colSpan={2} className="py-3 text-sm text-muted-foreground italic pl-6">
                          {query ? 'Tidak ada akun aset tetap yang cocok' : 'Belum ada aset tetap tercatat'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFixedAssets.map((a) => (
                        <TableRow key={a.accountCode} className="group border-b hover:bg-muted/30">
                          <TableCell className="py-2.5 pl-6">
                            <Link
                              to={getLedgerLink(a.accountCode)}
                              className="inline-flex items-center gap-2 hover:text-primary hover:underline text-sm"
                              title="Buka Buku Besar akun ini"
                            >
                              {showAccountCodes && (
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {a.accountCode}
                                </span>
                              )}
                              <span>{a.accountName}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                            </Link>
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-medium text-emerald-600">
                            {formatCurrency(a.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    <TableRow className="border-t bg-muted/10 font-semibold">
                      <TableCell className="py-2 pl-6 text-xs text-muted-foreground">Subtotal Aset Tetap</TableCell>
                      <TableCell className="py-2 text-right font-semibold text-sm">
                        {formatCurrency(totalFixedAssets)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Total Aset Footer */}
              <div className="border-t-2 bg-muted/40 px-5 py-3.5 flex items-center justify-between font-bold">
                <span className="text-sm">TOTAL ASET (AKTIVA)</span>
                <span className="text-base text-emerald-600 font-extrabold">{formatCurrency(data.totalAssets)}</span>
              </div>
            </div>

            {/* ── SISI KANAN: LIABILITAS & EKUITAS (PASIVA) ── */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="border-b bg-muted/40 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-primary">LIABILITAS & EKUITAS (PASIVA)</h2>
                  <p className="text-xs text-muted-foreground">Kewajiban kepada pihak ketiga dan modal pemilik usaha</p>
                </div>
                <span className="text-base font-bold text-primary">{formatCurrency(data.totalLiabilitiesEquity)}</span>
              </div>

              <div className="flex-1">
                <Table>
                  <TableBody>
                    {/* A. Liabilitas */}
                    <TableRow className="bg-muted/30 border-y">
                      <TableCell colSpan={2} className="py-2 pl-4 font-bold text-xs tracking-wider uppercase text-muted-foreground">
                        A. Liabilitas / Kewajiban Usaha
                      </TableCell>
                    </TableRow>

                    {filteredLiabilities.length === 0 ? (
                      <TableRow className="border-b">
                        <TableCell colSpan={2} className="py-3 text-sm text-muted-foreground italic pl-6">
                          {query ? 'Tidak ada akun liabilitas yang cocok' : 'Tidak ada kewajiban atau hutang usaha'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLiabilities.map((l) => (
                        <TableRow key={l.accountCode} className="group border-b hover:bg-muted/30">
                          <TableCell className="py-2.5 pl-6">
                            <Link
                              to={getLedgerLink(l.accountCode)}
                              className="inline-flex items-center gap-2 hover:text-primary hover:underline text-sm"
                              title="Buka Buku Besar akun ini"
                            >
                              {showAccountCodes && (
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {l.accountCode}
                                </span>
                              )}
                              <span>{l.accountName}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
                            </Link>
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-medium text-rose-600">
                            {formatCurrency(l.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    <TableRow className="border-t bg-muted/10 font-semibold">
                      <TableCell className="py-2 pl-6 text-xs text-muted-foreground">Subtotal Liabilitas</TableCell>
                      <TableCell className="py-2 text-right font-semibold text-sm text-rose-600">
                        {formatCurrency(data.totalLiabilities)}
                      </TableCell>
                    </TableRow>

                    {/* B. Ekuitas */}
                    <TableRow className="bg-muted/30 border-y">
                      <TableCell colSpan={2} className="py-2 pl-4 font-bold text-xs tracking-wider uppercase text-muted-foreground">
                        B. Ekuitas / Modal Pemilik Usaha
                      </TableCell>
                    </TableRow>

                    {filteredEquities.length === 0 ? (
                      <TableRow className="border-b">
                        <TableCell colSpan={2} className="py-3 text-sm text-muted-foreground italic pl-6">
                          {query ? 'Tidak ada akun ekuitas yang cocok' : 'Belum ada ekuitas/modal tercatat'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEquities.map((e) => (
                        <TableRow key={e.accountCode} className="group border-b hover:bg-muted/30">
                          <TableCell className="py-2.5 pl-6">
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
                          <TableCell className="py-2.5 text-right font-medium text-primary">
                            {formatCurrency(e.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    <TableRow className="border-t bg-muted/10 font-semibold">
                      <TableCell className="py-2 pl-6 text-xs text-muted-foreground">Subtotal Ekuitas</TableCell>
                      <TableCell className="py-2 text-right font-semibold text-sm">
                        {formatCurrency(data.totalEquity)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Total Liabilitas & Ekuitas Footer */}
              <div className="border-t-2 bg-muted/40 px-5 py-3.5 flex items-center justify-between font-bold">
                <span className="text-sm">TOTAL LIABILITAS & EKUITAS (PASIVA)</span>
                <span className="text-base text-primary font-extrabold">{formatCurrency(data.totalLiabilitiesEquity)}</span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
