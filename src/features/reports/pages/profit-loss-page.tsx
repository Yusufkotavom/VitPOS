import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
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

          <ReportSection title="Pendapatan">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Penjualan ({data.salesOrderCount} order)</td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(data.salesRevenue)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Service ({data.serviceOrderCount} order)</td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(data.serviceRevenue)}</td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-2">Total Pendapatan</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(data.totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ReportSection>

          <ReportSection title="Harga Pokok Penjualan (HPP)">
            <div className="flex justify-between text-sm">
              <span>HPP dari {data.salesOrderCount} penjualan</span>
              <span className="font-semibold">{formatCurrency(data.cogs)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm">
              <span>Laba Kotor</span>
              <span className={data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(data.grossProfit)}</span>
            </div>
          </ReportSection>

          {data.expenses.length > 0 && (
            <ReportSection title="Beban Operasional">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {data.expenses.map((e, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{e.category}</td>
                        <td className="py-2 text-right font-semibold text-red-600">-{formatCurrency(e.total)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2">Total Beban</td>
                      <td className="py-2 text-right text-red-600">-{formatCurrency(data.totalExpenses)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ReportSection>
          )}

          {data.paymentBreakdown.length > 0 && (
            <ReportSection title="Penerimaan per Metode Bayar">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Metode</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium text-right">Transaksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.paymentBreakdown.map((p) => (
                      <tr key={p.method} className="border-b last:border-0">
                        <td className="py-2 font-medium capitalize">{p.method}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(p.total)}</td>
                        <td className="py-2 text-right">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          )}

          <ReportSection title="Laba Bersih">
            <div className="flex justify-between text-lg font-bold">
              <span>Net Profit</span>
              <span className={data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(data.netProfit)}</span>
            </div>
            {data.otherIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Termasuk pendapatan lain: {formatCurrency(data.otherIncome)}</p>
            )}
          </ReportSection>
        </>
      ) : null}
    </div>
  )
}
