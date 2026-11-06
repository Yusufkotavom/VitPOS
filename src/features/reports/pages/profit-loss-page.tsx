import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
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

  function handleExport() {
    if (!data) return
    const rows = [
      ...data.revenues.map((r, i) => ({ id: `rev${i}`, akun: r.accountName, nilai: r.amount })),
      { id: 'tr', akun: t('reports.total_revenue'), nilai: data.totalRevenue },
      ...data.cogs.map((c, i) => ({ id: `cogs${i}`, akun: c.accountName, nilai: -c.amount })),
      { id: 'tc', akun: t('reports.total_cogs'), nilai: -data.totalCogs },
      { id: 'gp', akun: t('reports.gross_profit'), nilai: data.grossProfit },
      ...data.expenses.map((e, i) => ({ id: `exp${i}`, akun: e.accountName, nilai: -e.amount })),
      { id: 'te', akun: t('reports.total_expense'), nilai: -data.totalExpense },
      { id: 'np', akun: t('reports.net_profit'), nilai: data.netProfit },
    ]
    exportToCsv(
      `profit-loss-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`,
      [
        { key: 'akun', header: t('reports.account') },
        { key: 'nilai', header: t('reports.value') },
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('reports.profit_loss_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.profit_loss_description')}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            {t('common.export')} CSV
          </Button>
        </div>
      </div>

      <ReportDateFilter />

      {/* Cross-report correlation navigation with date sync */}
      <ReportCorrelationNav
        links={[
          { to: '/reports/sales', label: 'Laporan Penjualan', hint: 'Detail order & transaksi omzet' },
          { to: '/reports/balance-sheet', label: 'Neraca', hint: 'Akumulasi laba ditahan & saldo kas' },
          { to: '/reports/general-ledger', label: 'Buku Besar', hint: 'Telusuri jurnal akun' },
          { to: '/reports/payments', label: 'Laporan Pembayaran', hint: 'Arus kas & piutang' },
        ]}
      />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <ReportMetricCard
              label={t('reports.total_revenue')}
              value={formatCurrency(data.totalRevenue)}
              tone="positive"
            />
            <ReportMetricCard label={t('reports.cogs_label')} value={formatCurrency(data.totalCogs)} />
            <ReportMetricCard
              label={t('reports.gross_profit')}
              value={formatCurrency(data.grossProfit)}
              tone={data.grossProfit >= 0 ? 'positive' : 'negative'}
            />
            <ReportMetricCard
              label={t('reports.total_expense')}
              value={formatCurrency(data.totalExpense)}
              tone="negative"
            />
            <ReportMetricCard
              label={t('reports.net_profit')}
              value={formatCurrency(data.netProfit)}
              tone={data.netProfit >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <FilterToolbar
            placeholder="Cari akun pendapatan, HPP, atau beban..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {t('reports.revenue_section')}
                    </TableCell>
                  </TableRow>
                  {revenues.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>
                        {query ? 'Tidak ada akun pendapatan yang cocok' : t('reports.no_revenue_data')}
                      </TableCell>
                    </TableRow>
                  )}
                  {revenues.map((r) => (
                    <TableRow key={r.accountCode} className="group border-b">
                      <TableCell className="py-2">
                        <Link
                          to={getLedgerLink(r.accountCode)}
                          className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
                          title="Buka Buku Besar akun ini"
                        >
                          <span className="font-mono text-xs text-muted-foreground">{r.accountCode}</span>
                          <span>{r.accountName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium text-green-600">
                        {formatCurrency(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-bold">
                    <TableCell className="py-2">{t('reports.total_revenue')}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">
                      {formatCurrency(data.totalRevenue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {t('reports.cogs_section')}
                    </TableCell>
                  </TableRow>
                  {cogs.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>
                        {query ? 'Tidak ada akun HPP yang cocok' : t('reports.no_cogs_data')}
                      </TableCell>
                    </TableRow>
                  )}
                  {cogs.map((c) => (
                    <TableRow key={c.accountCode} className="group border-b">
                      <TableCell className="py-2">
                        <Link
                          to={getLedgerLink(c.accountCode)}
                          className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
                          title="Buka Buku Besar akun ini"
                        >
                          <span className="font-mono text-xs text-muted-foreground">{c.accountCode}</span>
                          <span>{c.accountName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium text-red-600">
                        -{formatCurrency(c.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-bold">
                    <TableCell className="py-2">{t('reports.total_cogs')}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">
                      -{formatCurrency(data.totalCogs)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/20 font-bold">
                    <TableCell className="py-2">{t('reports.gross_profit')}</TableCell>
                    <TableCell
                      className={`py-2 text-right ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(data.grossProfit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {t('reports.expense_section')}
                    </TableCell>
                  </TableRow>
                  {expenses.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>
                        {query ? 'Tidak ada akun beban yang cocok' : t('reports.no_expense_data')}
                      </TableCell>
                    </TableRow>
                  )}
                  {expenses.map((e) => (
                    <TableRow key={e.accountCode} className="group border-b">
                      <TableCell className="py-2">
                        <Link
                          to={getLedgerLink(e.accountCode)}
                          className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
                          title="Buka Buku Besar akun ini"
                        >
                          <span className="font-mono text-xs text-muted-foreground">{e.accountCode}</span>
                          <span>{e.accountName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium text-red-600">
                        -{formatCurrency(e.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-bold">
                    <TableCell className="py-2">{t('reports.total_expense')}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">
                      -{formatCurrency(data.totalExpense)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{t('reports.net_profit')}</p>
                  <p className="text-xs text-muted-foreground">Laba Kotor dikurangi Total Beban Operasional</p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(data.netProfit)}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
