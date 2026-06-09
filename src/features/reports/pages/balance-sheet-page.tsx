import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
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
          <h1 className="text-xl font-semibold">Neraca</h1>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <ReportSection title="Aset">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Kas</span>
                    <span className="font-semibold">{formatCurrency(data.assets.cashOnHand)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Piutang Usaha</span>
                    <span className="font-semibold">{formatCurrency(data.assets.accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span>Persediaan</span>
                    <span className="font-semibold">{formatCurrency(data.assets.inventoryValue)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-base border-t">
                    <span>Total Aset</span>
                    <span className="text-green-600">{formatCurrency(data.assets.totalAssets)}</span>
                  </div>
                </div>
              </ReportSection>
            </div>

            <div className="space-y-4">
              <ReportSection title="Liabilitas">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Hutang Usaha</span>
                    <span className="font-semibold text-red-600">{formatCurrency(data.liabilities.accountsPayable)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-base border-t">
                    <span>Total Liabilitas</span>
                    <span className="text-red-600">{formatCurrency(data.liabilities.totalLiabilities)}</span>
                  </div>
                </div>
              </ReportSection>

              <ReportSection title="Ekuitas">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Laba Ditahan</span>
                    <span className="font-semibold">{formatCurrency(data.equity.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-base border-t">
                    <span>Total Ekuitas</span>
                    <span>{formatCurrency(data.equity.totalEquity)}</span>
                  </div>
                </div>
              </ReportSection>

              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex justify-between font-bold text-base">
                  <span>Liabilitas + Ekuitas</span>
                  <span>{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
