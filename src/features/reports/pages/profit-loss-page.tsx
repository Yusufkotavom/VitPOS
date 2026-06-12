import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { useProfitLoss } from '@/features/reports/hooks/use-profit-loss'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

export function ProfitLossPage() {
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useProfitLoss(params)

  function handleExport() {
    if (!data) return
    const rows = [
      { id: '1', akun: 'Pendapatan Penjualan', nilai: data.salesRevenue },
      ...data.salesByMethod.map((s, i) => ({ id: `1a${i}`, akun: `  Penjualan: ${s.method.toUpperCase()}`, nilai: s.total })),
      { id: '2', akun: 'Pendapatan Service', nilai: data.serviceRevenue },
      { id: '3', akun: 'Total Pendapatan', nilai: data.totalRevenue },
      { id: '4', akun: 'HPP (Harga Pokok Penjualan)', nilai: -data.cogs },
      ...data.salesByMethod.map((s, i) => ({ id: `4a${i}`, akun: `  HPP: ${s.method.toUpperCase()}`, nilai: -s.cogs })),
      { id: '5', akun: 'Laba Kotor', nilai: data.grossProfit },
      ...data.incomes.map((e, i) => ({ id: `i${i}`, akun: `  Pendapatan Lain: ${e.category}`, nilai: e.total })),
      { id: '7', akun: 'Total Pendapatan Lain', nilai: data.otherIncome },
      ...data.expenses.map((e, i) => ({ id: `e${i}`, akun: `  Beban: ${e.category}`, nilai: -e.total })),
      { id: '6', akun: 'Total Beban', nilai: -data.totalExpenses },
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
          <h1 className="text-xl font-semibold">Laporan Laba Rugi</h1>
          <p className="text-sm text-muted-foreground">Pendapatan, HPP, beban, dan laba bersih (penjualan + service)</p>
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

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">PENDAPATAN</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Total Penjualan ({data.salesOrderCount} order)</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.salesRevenue)}</TableCell>
                  </TableRow>
                  {data.salesByMethod.map((s) => (
                    <TableRow key={s.method} className="border-b text-sm">
                      <TableCell className="py-1 text-muted-foreground pl-6">Penjualan ({s.method.toUpperCase()})</TableCell>
                      <TableCell className="py-1 text-right text-muted-foreground">{formatCurrency(s.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-b">
                    <TableCell className="py-2">Service ({data.serviceOrderCount} order)</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.serviceRevenue)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell className="py-2">Total Pendapatan</TableCell>
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
                    <TableCell colSpan={2} className="py-2 font-semibold">HARGA POKOK PENJUALAN (HPP)</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="py-2">Total HPP dari {data.salesOrderCount} penjualan</TableCell>
                    <TableCell className="py-2 text-right font-semibold">{formatCurrency(data.cogs)}</TableCell>
                  </TableRow>
                  {data.salesByMethod.map((s) => (
                    <TableRow key={s.method} className="border-b text-sm">
                      <TableCell className="py-1 text-muted-foreground pl-6">HPP Penjualan ({s.method.toUpperCase()})</TableCell>
                      <TableCell className="py-1 text-right text-muted-foreground">{formatCurrency(s.cogs)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="py-2">Laba Kotor</TableCell>
                    <TableCell className={`py-2 text-right ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.grossProfit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.incomes.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="border-b bg-muted/50">
                      <TableCell colSpan={2} className="py-2 font-semibold">PENDAPATAN LAIN (KAS)</TableCell>
                    </TableRow>
                    {data.incomes.map((e, i) => (
                      <TableRow key={i} className="border-b last:border-0">
                        <TableCell className="py-2">{e.category}</TableCell>
                        <TableCell className="py-2 text-right font-semibold text-green-600">{formatCurrency(e.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="py-2">Total Pendapatan Lain</TableCell>
                      <TableCell className="py-2 text-right text-green-600">{formatCurrency(data.otherIncome)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.expenses.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="border-b bg-muted/50">
                      <TableCell colSpan={2} className="py-2 font-semibold">BEBAN OPERASIONAL (KAS)</TableCell>
                    </TableRow>
                    {data.expenses.map((e, i) => (
                      <TableRow key={i} className="border-b last:border-0">
                        <TableCell className="py-2">{e.category}</TableCell>
                        <TableCell className="py-2 text-right font-semibold text-red-600">-{formatCurrency(e.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell className="py-2">Total Beban</TableCell>
                      <TableCell className="py-2 text-right text-red-600">-{formatCurrency(data.totalExpenses)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.paymentBreakdown.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/50">
                      <TableHead className="py-2 font-semibold">PENERIMAAN PER METODE BAYAR</TableHead>
                      <TableHead className="py-2 text-right font-semibold">Total</TableHead>
                      <TableHead className="py-2 text-right font-semibold">Transaksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentBreakdown.map((p) => (
                      <TableRow key={p.method} className="border-b last:border-0">
                        <TableCell className="py-2">
                          <Badge variant="outline" className="capitalize">{p.method}</Badge>
                        </TableCell>
                        <TableCell className="py-2 text-right font-semibold">{formatCurrency(p.total)}</TableCell>
                        <TableCell className="py-2 text-right">{p.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">LABA BERSIH</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-lg font-bold">Net Profit</TableCell>
                    <TableCell className={`py-2 text-right text-lg font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.netProfit)}</TableCell>
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
