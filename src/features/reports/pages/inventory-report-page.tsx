import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { useInventoryReport } from '@/features/reports/hooks/use-inventory-report'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

const MOVEMENT_LABELS: Record<string, string> = {
  sale: 'Penjualan',
  purchase: 'Pembelian',
  return: 'Retur',
  adjustment: 'Penyesuaian',
  transfer_in: 'Transfer Masuk',
  transfer_out: 'Transfer Keluar',
  damage_lost: 'Rusak/Hilang',
  production: 'Produksi',
}

export function InventoryReportPage() {
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useInventoryReport(params)

  function handleExport() {
    if (!data) return
    const rows = data.valuation.map((v) => ({
      id: v.id,
      produk: v.name,
      sku: v.sku ?? '-',
      stok: v.stock,
      hpp: v.unitCost,
      nilai: v.value,
      stokMinimum: v.minimumStock,
      status: v.isLow ? 'Stok Rendah' : 'Aman',
    }))
    exportToCsv(`laporan-stok-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'produk', header: 'Produk' },
      { key: 'sku', header: 'SKU' },
      { key: 'stok', header: 'Stok' },
      { key: 'hpp', header: 'HPP' },
      { key: 'nilai', header: 'Nilai' },
      { key: 'stokMinimum', header: 'Stok Min' },
      { key: 'status', header: 'Status' },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Laporan Stok</h1>
          <p className="text-sm text-muted-foreground">Valuasi inventory, pergerakan stok, dan peringatan stok rendah</p>
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
            <ReportMetricCard label="Total SKU" value={String(data.summary.totalSkus)} />
            <ReportMetricCard label="Nilai Inventory" value={formatCurrency(data.summary.totalValue)} />
            <ReportMetricCard label="Stok Rendah" value={String(data.summary.lowStockCount)} tone={data.summary.lowStockCount > 0 ? 'negative' : 'neutral'} />
          </div>

          <ReportSection title="Pergerakan Stok">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Tipe</th>
                    <th className="pb-2 font-medium text-right">Total Qty</th>
                    <th className="pb-2 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movementSummary.map((m) => (
                    <tr key={m.type} className="border-b last:border-0">
                      <td className="py-2 font-medium">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                      <td className="py-2 text-right">{m.totalQty}</td>
                      <td className="py-2 text-right">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>

          <ReportSection title="Valuasi Inventory">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Produk</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium text-right">Stok</th>
                    <th className="pb-2 font-medium text-right">HPP</th>
                    <th className="pb-2 font-medium text-right">Nilai</th>
                    <th className="pb-2 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.valuation.slice(0, 100).map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{v.name}</td>
                      <td className="py-2 text-muted-foreground">{v.sku ?? '-'}</td>
                      <td className="py-2 text-right">{v.stock}</td>
                      <td className="py-2 text-right">{formatCurrency(v.unitCost)}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(v.value)}</td>
                      <td className="py-2 text-center">
                        {v.isLow ? (
                          <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Rendah</span>
                        ) : (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Aman</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {data.movementDetail.length > 0 && (
            <ReportSection title="Log Pergerakan (200 terakhir)">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Tanggal</th>
                      <th className="pb-2 font-medium">Produk</th>
                      <th className="pb-2 font-medium">Tipe</th>
                      <th className="pb-2 font-medium text-right">Qty</th>
                      <th className="pb-2 font-medium">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.movementDetail.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground">{new Date(m.createdAt).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 font-medium">{m.productName}</td>
                        <td className="py-2">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                        <td className={`py-2 text-right font-medium ${m.qty < 0 ? 'text-red-600' : 'text-green-600'}`}>{m.qty > 0 ? '+' : ''}{m.qty}</td>
                        <td className="py-2 text-muted-foreground">{m.notes ?? m.referenceType ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          )}
        </>
      ) : null}
    </div>
  )
}
