import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { useProfitLoss } from '@/features/reports/hooks/use-profit-loss'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProfitLossPage() {
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useProfitLoss(params)

  function handleExport() {
    if (!data) return
    const rows = [
      { id: '1', akun: 'Pendapatan Penjualan', nilai: data.salesRevenue },
      { id: '2', akun: 'Pendapatan Service', nilai: data.serviceRevenue },
      { id: '3', akun: 'Total Pendapatan', nilai: data.totalRevenue },
      { id: '4', akun: 'HPP (Harga Pokok Penjualan)', nilai: -data.cogs },
      { id: '5', akun: 'Laba Kotor', nilai: data.grossProfit },
      ...data.expenses.map((e, i) => ({ id: `e${i}`, akun: `  Beban: ${e.category}`, nilai: -e.total })),
      { id: '6', akun: 'Total Beban', nilai: -data.totalExpenses },
      { id: '7', akun: 'Pendapatan Lain', nilai: data.otherIncome },
      { id: '8', akun: 'Laba Bersih', nilai: data.netProfit },
    ]
    exportToCsv(`laba-rugi-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
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
          <h1 className="text-xl font-semibold">Laba Rugi (Profit & Loss)</h1>
          <p className="text-sm text-muted-foreground">Rincian pendapatan, HPP, beban operasional, dan laba bersih</p>
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
          <div className="grid gap-3 md:grid-cols-5">
            <ReportMetricCard label="Total Pendapatan" value={formatCurrency(data.totalRevenue)} tone="positive" />
            <ReportMetricCard label="HPP" value={formatCurrency(data.cogs)} />
            <ReportMetricCard label="Laba Kotor" value={formatCurrency(data.grossProfit)} tone={data.grossProfit >= 0 ? 'positive' : 'negative'} />
            <ReportMetricCard label="Total Beban" value={formatCurrency(data.totalExpenses)} tone="negative" />
            <ReportMetricCard label="Laba Bersih" value={formatCurrency(data.netProfit)} tone={data.netProfit >= 0 ? 'positive' : 'negative'} />
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Keterangan</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* PENDAPATAN */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={2} className="font-bold">PENDAPATAN</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Penjualan ({data.salesOrderCount} order)</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.salesRevenue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">Service ({data.serviceOrderCount} order)</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.serviceRevenue)}</TableCell>
                    </TableRow>
                    {data.otherIncome > 0 && (
                      <TableRow>
                        <TableCell className="pl-8">Pendapatan Lain-lain</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.otherIncome)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                      <TableCell className="font-bold text-emerald-700">Total Pendapatan</TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">{formatCurrency(data.totalRevenue + data.otherIncome)}</TableCell>
                    </TableRow>

                    {/* HPP */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={2} className="font-bold mt-4">HARGA POKOK PENJUALAN (HPP)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8">HPP dari {data.salesOrderCount} penjualan</TableCell>
                      <TableCell className="text-right text-rose-600">-{formatCurrency(data.cogs)}</TableCell>
                    </TableRow>
                    
                    {/* LABA KOTOR */}
                    <TableRow className="bg-blue-50/50 hover:bg-blue-50/50 border-t-2 border-b-2">
                      <TableCell className="font-bold text-blue-700">Laba Kotor</TableCell>
                      <TableCell className="text-right font-bold text-blue-700">{formatCurrency(data.grossProfit)}</TableCell>
                    </TableRow>

                    {/* BEBAN OPERASIONAL */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={2} className="font-bold mt-4">BEBAN OPERASIONAL</TableCell>
                    </TableRow>
                    {data.expenses.length > 0 ? (
                      data.expenses.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="pl-8 capitalize">{e.category}</TableCell>
                          <TableCell className="text-right text-rose-600">-{formatCurrency(e.total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="pl-8 text-muted-foreground italic">Tidak ada beban dicatat</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-rose-50/50 hover:bg-rose-50/50">
                      <TableCell className="font-bold text-rose-700">Total Beban</TableCell>
                      <TableCell className="text-right font-bold text-rose-700">-{formatCurrency(data.totalExpenses)}</TableCell>
                    </TableRow>

                    {/* LABA BERSIH */}
                    <TableRow className="border-t-4 border-primary/20 bg-primary/10 hover:bg-primary/10">
                      <TableCell className="font-extrabold text-lg">Laba Bersih (Net Profit)</TableCell>
                      <TableCell className="text-right font-extrabold text-lg">
                        <span className={data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {formatCurrency(data.netProfit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {data.paymentBreakdown.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">Penerimaan per Metode Bayar</h3>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <Table className="w-full text-sm">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-medium text-foreground">Metode</TableHead>
                        <TableHead className="font-medium text-right text-foreground">Total Nominal</TableHead>
                        <TableHead className="font-medium text-right text-foreground">Jumlah Transaksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.paymentBreakdown.map((p) => (
                        <TableRow key={p.method}>
                          <TableCell className="font-medium capitalize"><Badge variant="outline" className="capitalize">{p.method}</Badge></TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(p.total)}</TableCell>
                          <TableCell className="text-right">{p.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

