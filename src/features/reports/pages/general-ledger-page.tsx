import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useGeneralLedger } from '@/features/reports/hooks/use-general-ledger'
import { DataTable } from '@/shared/components/data-table/data-table'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

type LedgerRowItem = {
  id: string
  date: string
  journalCode: string
  description: string
  debit: number
  credit: number
  balance: number
}

export function GeneralLedgerPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const params = useReportDateParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [accountCode, setAccountCode] = useState<string>(() => searchParams.get('accountCode') ?? '')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    const codeFromUrl = searchParams.get('accountCode')
    if (codeFromUrl && codeFromUrl !== accountCode) {
      setAccountCode(codeFromUrl)
    }
  }, [searchParams, accountCode])

  function handleAccountSelect(code: string) {
    setAccountCode(code)
    const next = new URLSearchParams(searchParams)
    if (code) next.set('accountCode', code)
    else next.delete('accountCode')
    setSearchParams(next)
  }

  const { accounts, accountsLoading, data, isLoading } = useGeneralLedger(accountCode || undefined, params)

  const rows: LedgerRowItem[] = (data?.rows ?? []).map((r, i) => ({
    id: `${r.journalCode}-${i}`,
    date: r.date,
    journalCode: r.journalCode,
    description: r.description,
    debit: r.debit,
    credit: r.credit,
    balance: r.balance,
  }))

  const filteredRows = searchQuery
    ? rows.filter(
        (r) =>
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.journalCode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : rows

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)

  function handleExport() {
    if (!data) return
    const exportRows = rows.map((r) => ({
      id: r.id,
      tanggal: r.date,
      kodeJurnal: r.journalCode,
      deskripsi: r.description,
      debit: r.debit,
      kredit: r.credit,
      saldo: r.balance,
    }))
    exportToCsv(
      `general-ledger-${data.account.code}-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`,
      [
        { key: 'tanggal', header: t('common.date') },
        { key: 'kodeJurnal', header: 'Kode Jurnal' },
        { key: 'deskripsi', header: t('common.description') },
        { key: 'debit', header: t('reports.debit') },
        { key: 'kredit', header: t('reports.credit') },
        { key: 'saldo', header: t('reports.balance') },
      ],
      exportRows,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('reports.general_ledger')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.general_ledger_description')}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data || rows.length === 0}>
            {t('common.export')} CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <label className="space-y-1.5 text-sm font-medium">
          {t('reports.select_account')}
          <Select value={accountCode} onValueChange={handleAccountSelect} disabled={accountsLoading}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder={t('reports.select_account_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <ReportDateFilter />

      <ReportCorrelationNav
        links={[
          { to: '/reports/balance-sheet', label: 'Neraca', hint: 'Posisi akun aset, kewajiban, ekuitas' },
          { to: '/reports/profit-loss', label: 'Laba Rugi', hint: 'Kinerja pendapatan & beban' },
          { to: '/reports/payments', label: 'Laporan Pembayaran', hint: 'Histori mutasi kas/bank & piutang' },
        ]}
      />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !accountCode ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('reports.no_account_selected')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard label="Total Debit" value={formatCurrency(totalDebit)} />
            <ReportMetricCard label="Total Kredit" value={formatCurrency(totalCredit)} />
            <ReportMetricCard
              label={t('reports.ending_balance')}
              value={formatCurrency(data.endingBalance)}
              tone="positive"
            />
          </div>

          <ReportSection title={`Mutasi Akun: ${data.account.code} - ${data.account.name}`}>
            <FilterToolbar
              placeholder="Cari deskripsi atau nomor jurnal..."
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <DataTable<LedgerRowItem>
              columns={[
                { key: 'date', header: t('common.date'), sortable: true },
                {
                  key: 'journalCode',
                  header: 'Kode Jurnal',
                  sortable: true,
                  render: (row) => <span className="font-mono text-xs">{row.journalCode}</span>,
                },
                { key: 'description', header: t('common.description'), sortable: true },
                {
                  key: 'debit',
                  header: t('reports.debit'),
                  sortable: true,
                  render: (row) => (row.debit > 0 ? formatCurrency(row.debit) : '-'),
                },
                {
                  key: 'credit',
                  header: t('reports.credit'),
                  sortable: true,
                  render: (row) => (row.credit > 0 ? formatCurrency(row.credit) : '-'),
                },
                {
                  key: 'balance',
                  header: t('reports.balance'),
                  sortable: true,
                  render: (row) => <span className="font-semibold">{formatCurrency(row.balance)}</span>,
                },
              ]}
              data={filteredRows}
              emptyTitle={t('reports.no_transactions_for_account')}
            />
          </ReportSection>
        </>
      ) : null}
    </div>
  )
}
