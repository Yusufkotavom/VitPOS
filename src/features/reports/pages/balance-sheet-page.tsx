import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { useBalanceSheet } from '@/features/reports/hooks/use-balance-sheet'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'

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

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Akun</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* ASET */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={2} className="font-bold">ASET</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Kas dan Bank</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.assets.cashOnHand)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Piutang Usaha</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.assets.accountsReceivable)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Persediaan Barang</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.assets.inventoryValue)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                      <TableCell className="font-bold text-emerald-700">Total Aset</TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">{formatCurrency(data.assets.totalAssets)}</TableCell>
                    </TableRow>

                    {/* LIABILITAS */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={2} className="font-bold mt-4">LIABILITAS</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Hutang Usaha</TableCell>
                      <TableCell className="text-right text-rose-600">{formatCurrency(data.liabilities.accountsPayable)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-rose-50/50 hover:bg-rose-50/50">
                      <TableCell className="font-bold text-rose-700">Total Liabilitas</TableCell>
                      <TableCell className="text-right font-bold text-rose-700">{formatCurrency(data.liabilities.totalLiabilities)}</TableCell>
                    </TableRow>

                    {/* EKUITAS */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={2} className="font-bold">EKUITAS (MODAL)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Laba Ditahan</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.equity.retainedEarnings)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50/50 hover:bg-blue-50/50">
                      <TableCell className="font-bold text-blue-700">Total Ekuitas</TableCell>
                      <TableCell className="text-right font-bold text-blue-700">{formatCurrency(data.equity.totalEquity)}</TableCell>
                    </TableRow>

                    {/* TOTAL */}
                    <TableRow className="border-t-2 border-primary/20 bg-primary/5 hover:bg-primary/5">
                      <TableCell className="font-extrabold">Total Liabilitas & Ekuitas</TableCell>
                      <TableCell className="text-right font-extrabold">{formatCurrency(data.totalLiabilitiesAndEquity)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
