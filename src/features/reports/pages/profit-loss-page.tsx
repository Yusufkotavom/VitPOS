import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useProfitLoss(params)

  function handleExport() {
    if (!data) return
    const rows = [
      ...data.revenues.map((r, i) => ({ id: `rev${i}`, akun: r.accountName, nilai: r.amount })),
      { id: 'tr', akun: 'Total Pendapatan', nilai: data.totalRevenue },
      ...data.cogs.map((c, i) => ({ id: `cogs${i}`, akun: c.accountName, nilai: -c.amount })),
      { id: 'tc', akun: 'Total HPP', nilai: -data.totalCogs },
      { id: 'gp', akun: 'Laba Kotor', nilai: data.grossProfit },
      ...data.expenses.map((e, i) => ({ id: `exp${i}`, akun: e.accountName, nilai: -e.amount })),
      { id: 'te', akun: 'Total Beban', nilai: -data.totalExpense },
      { id: 'np', akun: 'Laba Bersih', nilai: data.netProfit },
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
          <p className="text-sm text-muted-foreground">Pendapatan, HPP, beban, dan laba bersih — berdasarkan jurnal akuntansi</p>
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
            <ReportMetricCard label="HPP" value={formatCurrency(data.totalCogs)} />
            <ReportMetricCard label="Laba Kotor" value={formatCurrency(data.grossProfit)} tone={data.grossProfit >= 0 ? 'positive' : 'negative'} />
            <ReportMetricCard label="Total Beban" value={formatCurrency(data.totalExpense)} tone="negative" />
            <ReportMetricCard label="Laba Bersih" value={formatCurrency(data.netProfit)} tone={data.netProfit >= 0 ? 'positive' : 'negative'} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">PENDAPATAN (4xxx)</TableCell>
                  </TableRow>
                  {data.revenues.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>Belum ada data pendapatan</TableCell>
                    </TableRow>
                  )}
                  {data.revenues.map((r) => (
                    <TableRow key={r.accountCode} className="border-b">
                      <TableCell className="py-2">{r.accountName}</TableCell>
                      <TableCell className="py-2 text-right text-green-600">{formatCurrency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
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
                    <TableCell colSpan={2} className="py-2 font-semibold">HARGA POKOK PENJUALAN (5xxx)</TableCell>
                  </TableRow>
                  {data.cogs.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>Belum ada data HPP</TableCell>
                    </TableRow>
                  )}
                  {data.cogs.map((c) => (
                    <TableRow key={c.accountCode} className="border-b">
                      <TableCell className="py-2">{c.accountName}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">-{formatCurrency(c.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="py-2">Total HPP</TableCell>
                    <TableCell className="py-2 text-right text-red-600">-{formatCurrency(data.totalCogs)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell className="py-2">Laba Kotor</TableCell>
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
                    <TableCell colSpan={2} className="py-2 font-semibold">BEBAN OPERASIONAL (6xxx)</TableCell>
                  </TableRow>
                  {data.expenses.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>Belum ada data beban</TableCell>
                    </TableRow>
                  )}
                  {data.expenses.map((e) => (
                    <TableRow key={e.accountCode} className="border-b">
                      <TableCell className="py-2">{e.accountName}</TableCell>
                      <TableCell className="py-2 text-right text-red-600">-{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="py-2">Total Beban</TableCell>
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
                    <TableCell colSpan={2} className="py-2 font-semibold">LABA BERSIH</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-lg font-bold">Net Profit</TableCell>
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
