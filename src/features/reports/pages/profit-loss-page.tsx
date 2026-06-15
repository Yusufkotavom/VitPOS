import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { useProfitLoss } from '@/features/reports/hooks/use-profit-loss'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

export function ProfitLossPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useProfitLoss(params)

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
    exportToCsv(`profit-loss-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'akun', header: t('reports.account') },
      { key: 'nilai', header: t('reports.value') },
    ], rows)
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
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>{t('common.export')} CSV</Button>
        </div>
      </div>

      <ReportDateFilter />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <ReportMetricCard label={t('reports.total_revenue')} value={formatCurrency(data.totalRevenue)} tone="positive" />
            <ReportMetricCard label={t('reports.cogs_label')} value={formatCurrency(data.totalCogs)} />
            <ReportMetricCard label={t('reports.gross_profit')} value={formatCurrency(data.grossProfit)} tone={data.grossProfit >= 0 ? 'positive' : 'negative'} />
            <ReportMetricCard label={t('reports.total_expense')} value={formatCurrency(data.totalExpense)} tone="negative" />
            <ReportMetricCard label={t('reports.net_profit')} value={formatCurrency(data.netProfit)} tone={data.netProfit >= 0 ? 'positive' : 'negative'} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">{t('reports.revenue_section')}</TableCell>
                  </TableRow>
                  {data.revenues.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>{t('reports.no_revenue_data')}</TableCell>
                    </TableRow>
                  )}
                  {data.revenues.map((r) => (
                    <TableRow key={r.accountCode} className="border-b">
                      <TableCell className="py-2">{r.accountName}</TableCell>
                      <TableCell className="py-2 text-right text-green-600">{formatCurrency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="py-2">{t('reports.total_revenue')}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{formatCurrency(data.totalRevenue)}</TableCell>
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
                    <TableCell colSpan={2} className="py-2 font-semibold">{t('reports.cogs_section')}</TableCell>
                  </TableRow>
                  {data.cogs.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>{t('reports.no_cogs_data')}</TableCell>
                    </TableRow>
                  )}
                  {data.cogs.map((c) => (
                    <TableRow key={c.accountCode} className="border-b">
                      <TableCell className="py-2">{c.accountName}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">-{formatCurrency(c.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="py-2">{t('reports.total_cogs')}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">-{formatCurrency(data.totalCogs)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell className="py-2">{t('reports.gross_profit')}</TableCell>
                    <TableCell className={`py-2 text-right ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                    <TableCell colSpan={2} className="py-2 font-semibold">{t('reports.expense_section')}</TableCell>
                  </TableRow>
                  {data.expenses.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>{t('reports.no_expense_data')}</TableCell>
                    </TableRow>
                  )}
                  {data.expenses.map((e) => (
                    <TableRow key={e.accountCode} className="border-b">
                      <TableCell className="py-2">{e.accountName}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">-{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="py-2">{t('reports.total_expense')}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">-{formatCurrency(data.totalExpense)}</TableCell>
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
                    <TableCell colSpan={2} className="py-2 font-semibold">{t('reports.net_profit_section')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-lg font-bold">{t('reports.net_profit')}</TableCell>
                    <TableCell className={`py-2 text-right text-lg font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.netProfit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
