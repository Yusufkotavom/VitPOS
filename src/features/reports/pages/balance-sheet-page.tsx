import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { useBalanceSheet } from '@/features/reports/hooks/use-balance-sheet'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

export function BalanceSheetPage() {
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useBalanceSheet(params)

  function handleExport() {
    if (!data) return
    const rows = [
      { id: '1', akun: 'ASET', nilai: '' },
      { id: '2', akun: '  Kas', nilai: String(data.assets.cashOnHand) },
      { id: '3', akun: '  Piutang Usaha', nilai: String(data.assets.accountsReceivable) },
      { id: '4', akun: '  Persediaan', nilai: String(data.assets.inventoryValue) },
      { id: '5', akun: 'Total Aset', nilai: String(data.assets.totalAssets) },
      { id: '6', akun: '', nilai: '' },
      { id: '7', akun: 'LIABILITAS', nilai: '' },
      { id: '8', akun: '  Hutang Usaha', nilai: String(data.liabilities.accountsPayable) },
      { id: '9', akun: 'Total Liabilitas', nilai: String(data.liabilities.totalLiabilities) },
      { id: '10', akun: '', nilai: '' },
      { id: '11', akun: 'EKUITAS', nilai: '' },
      { id: '12', akun: '  Laba Ditahan', nilai: String(data.equity.retainedEarnings) },
      { id: '13', akun: 'Total Ekuitas', nilai: String(data.equity.totalEquity) },
      { id: '14', akun: '', nilai: '' },
      { id: '15', akun: 'Total Liabilitas + Ekuitas', nilai: String(data.totalLiabilitiesAndEquity) },
    ]
    exportToCsv(`neraca-${params.to ?? 'current'}.csv`, [
      { key: 'akun', header: 'Akun' },
      { key: 'nilai', header: 'Nilai' },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Neraca (Balance Sheet)</h1>
          <p className="text-sm text-muted-foreground">Posisi keuangan: aset, liabilitas, dan ekuitas</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>Export CSV</Button>
        </div>
      </div>

      <ReportDateFilter />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Memuat data...</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard label="Total Aset" value={formatCurrency(data.assets.totalAssets)} tone="positive" />
            <ReportMetricCard label="Total Liabilitas" value={formatCurrency(data.liabilities.totalLiabilities)} tone="negative" />
            <ReportMetricCard label="Total Ekuitas" value={formatCurrency(data.equity.totalEquity)} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">ASET</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Kas</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.assets.cashOnHand)}</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Piutang Usaha</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.assets.accountsReceivable)}</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Persediaan</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.assets.inventoryValue)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t">
                    <TableCell className="py-2">Total Aset</TableCell>
                    <TableCell className="py-2 text-right text-green-600">{formatCurrency(data.assets.totalAssets)}</TableCell>
                  </TableRow>

                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">LIABILITAS</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Hutang Usaha</TableCell>
                    <TableCell className="py-2 text-right font-semibold text-red-600">{formatCurrency(data.liabilities.accountsPayable)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t">
                    <TableCell className="py-2">Total Liabilitas</TableCell>
                    <TableCell className="py-2 text-right text-red-600">{formatCurrency(data.liabilities.totalLiabilities)}</TableCell>
                  </TableRow>

                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">EKUITAS</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Laba Ditahan</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.equity.retainedEarnings)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t">
                    <TableCell className="py-2">Total Ekuitas</TableCell>
                    <TableCell className="py-2 text-right">{formatCurrency(data.equity.totalEquity)}</TableCell>
                  </TableRow>

                  <TableRow className="font-bold border-t-2">
                    <TableCell className="py-2">Liabilitas + Ekuitas</TableCell>
                    <TableCell className="py-2 text-right">{formatCurrency(data.totalLiabilitiesAndEquity)}</TableCell>
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
