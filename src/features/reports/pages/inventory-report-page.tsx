import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
  const { t } = useTranslation()
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
      status: v.isLow ? t('reports.low_stock_count') : t('products.stock_status_safe'),
    }))
    exportToCsv(`${t('reports.inventory_title')}-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'produk', header: t('common.name') },
      { key: 'sku', header: 'SKU' },
      { key: 'stok', header: t('products.available_stock') },
      { key: 'hpp', header: 'HPP' },
      { key: 'nilai', header: 'Nilai' },
      { key: 'stokMinimum', header: 'Stok Min' },
      { key: 'status', header: t('common.status') },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('reports.inventory_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.inventory_description')}</p>
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
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard label={t('reports.total_sku')} value={String(data.summary.totalSkus)} />
            <ReportMetricCard label={t('reports.inventory_value')} value={formatCurrency(data.summary.totalValue)} />
            <ReportMetricCard label={t('reports.low_stock_count')} value={String(data.summary.lowStockCount)} tone={data.summary.lowStockCount > 0 ? 'negative' : 'neutral'} />
          </div>

          <ReportSection title={t('reports.stock_movements')}>
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b text-left text-muted-foreground">
                    <TableHead className="pb-2 font-medium">{t('reports.movement_type')}</TableHead>
                    <TableHead className="pb-2 font-medium text-right">{t('reports.movement_total_qty')}</TableHead>
                    <TableHead className="pb-2 font-medium text-right">{t('reports.movement_count')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.movementSummary.map((m) => (
                    <TableRow key={m.type} className="border-b last:border-0">
                      <TableCell className="py-2">
                        <Badge variant="outline">{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">{m.totalQty}</TableCell>
                      <TableCell className="py-2 text-right">{m.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ReportSection>

          <ReportSection title={t('reports.inventory_valuation')}>
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b text-left text-muted-foreground">
                    <TableHead className="pb-2 font-medium">{t('common.name')}</TableHead>
                    <TableHead className="pb-2 font-medium">SKU</TableHead>
                    <TableHead className="pb-2 font-medium text-right">{t('products.available_stock')}</TableHead>
                    <TableHead className="pb-2 font-medium text-right">HPP</TableHead>
                    <TableHead className="pb-2 font-medium text-right">{t('reports.value')}</TableHead>
                    <TableHead className="pb-2 font-medium text-center">{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.valuation.slice(0, 100).map((v) => (
                    <TableRow key={v.id} className="border-b last:border-0">
                      <TableCell className="py-2 font-medium">{v.name}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{v.sku ?? '-'}</TableCell>
                      <TableCell className="py-2 text-right">{v.stock}</TableCell>
                      <TableCell className="py-2 text-right">{formatCurrency(v.unitCost)}</TableCell>
                      <TableCell className="py-2 text-right font-semibold">{formatCurrency(v.value)}</TableCell>
                      <TableCell className="py-2 text-center">
                        {v.isLow ? (
                          <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{t('reports.low_stock_count')}</span>
                        ) : (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t('products.stock_status_safe')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ReportSection>

          {data.movementDetail.length > 0 && (
            <ReportSection title={t('reports.movement_log')}>
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b text-left text-muted-foreground">
                      <TableHead className="pb-2 font-medium">{t('common.date')}</TableHead>
                      <TableHead className="pb-2 font-medium">{t('common.name')}</TableHead>
                      <TableHead className="pb-2 font-medium">{t('reports.movement_type')}</TableHead>
                      <TableHead className="pb-2 font-medium text-right">{t('reports.movement_qty')}</TableHead>
                      <TableHead className="pb-2 font-medium">{t('reports.movement_notes')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.movementDetail.map((m) => (
                      <TableRow key={m.id} className="border-b last:border-0">
                        <TableCell className="py-2 text-muted-foreground">{new Date(m.createdAt).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="py-2 font-medium">{m.productName}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline">{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                        </TableCell>
                        <TableCell className={`py-2 text-right font-medium ${m.qty < 0 ? 'text-red-600' : 'text-green-600'}`}>{m.qty > 0 ? '+' : ''}{m.qty}</TableCell>
                        <TableCell className="py-2 text-muted-foreground">{m.notes ?? m.referenceType ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ReportSection>
          )}
        </>
      ) : null}
    </div>
  )
}
