import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportSection, ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useInventoryReport } from '@/features/reports/hooks/use-inventory-report'
import { DataTable } from '@/shared/components/data-table/data-table'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
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

type ValuationRow = {
  id: string
  name: string
  sku: string
  stock: number
  unitCost: number
  value: number
  minimumStock: number
  isLow: boolean
}

type MovementSummaryRow = {
  id: string
  type: string
  typeLabel: string
  totalQty: number
  count: number
}

type MovementRow = {
  id: string
  date: string
  productName: string
  type: string
  typeLabel: string
  qty: number
  notes: string
}

export function InventoryReportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useInventoryReport(params)
  const [valuationSearch, setValuationSearch] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'safe'>('all')
  const [movementSearch, setMovementSearch] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState('all')

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

  const movementSummaryRows: MovementSummaryRow[] = (data?.movementSummary ?? []).map((m) => ({
    id: m.type,
    type: m.type,
    typeLabel: MOVEMENT_LABELS[m.type] ?? m.type,
    totalQty: m.totalQty,
    count: m.count,
  }))

  const valuationRows: ValuationRow[] = (data?.valuation ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku ?? '-',
    stock: v.stock,
    unitCost: v.unitCost,
    value: v.value,
    minimumStock: v.minimumStock,
    isLow: v.isLow,
  }))

  const filteredValuation = valuationRows.filter((v) => {
    if (stockStatusFilter === 'low' && !v.isLow) return false
    if (stockStatusFilter === 'safe' && v.isLow) return false
    if (!valuationSearch) return true
    const q = valuationSearch.toLowerCase()
    return v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q)
  })

  const movementRows: MovementRow[] = (data?.movementDetail ?? []).map((m) => ({
    id: m.id,
    date: new Date(m.createdAt).toLocaleDateString('id-ID'),
    productName: m.productName,
    type: m.type,
    typeLabel: MOVEMENT_LABELS[m.type] ?? m.type,
    qty: m.qty,
    notes: m.notes ?? m.referenceType ?? '-',
  }))

  const filteredMovements = movementRows.filter((m) => {
    const matchesType = movementTypeFilter === 'all' || m.type === movementTypeFilter
    const matchesSearch = !movementSearch || m.productName.toLowerCase().includes(movementSearch.toLowerCase())
    return matchesType && matchesSearch
  })

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
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            {t('common.export')} CSV
          </Button>
        </div>
      </div>

      <ReportDateFilter />

      {/* Cross-report correlation navigation with date sync */}
      <ReportCorrelationNav
        links={[
          { to: '/reports/sales', label: 'Laporan Penjualan', hint: 'Korelasi produk terlaris & HPP' },
          { to: '/reports/profit-loss', label: 'Laba Rugi', hint: 'Beban Pokok Penjualan (HPP)' },
          { to: '/reports/balance-sheet', label: 'Neraca', hint: 'Posisi persediaan barang dagang di aset' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard label={t('reports.total_sku')} value={String(data.summary.totalSkus)} />
            <ReportMetricCard label={t('reports.inventory_value')} value={formatCurrency(data.summary.totalValue)} />
            <ReportMetricCard
              label={t('reports.low_stock_count')}
              value={String(data.summary.lowStockCount)}
              tone={data.summary.lowStockCount > 0 ? 'negative' : 'neutral'}
            />
          </div>

          {movementSummaryRows.length > 0 && (
            <ReportSection title={t('reports.stock_movements')}>
              <DataTable<MovementSummaryRow>
                columns={[
                  {
                    key: 'typeLabel',
                    header: t('reports.movement_type'),
                    sortable: true,
                    render: (row) => <Badge variant="outline">{row.typeLabel}</Badge>,
                  },
                  {
                    key: 'totalQty',
                    header: t('reports.movement_total_qty'),
                    sortable: true,
                    render: (row) => (
                      <span className={`font-medium ${row.totalQty < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {row.totalQty > 0 ? '+' : ''}
                        {row.totalQty}
                      </span>
                    ),
                  },
                  {
                    key: 'count',
                    header: t('reports.movement_count'),
                    sortable: true,
                  },
                ]}
                data={movementSummaryRows}
                emptyTitle="Belum ada pergerakan stok"
              />
            </ReportSection>
          )}

          <ReportSection title={t('reports.inventory_valuation')}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <FilterToolbar
                  placeholder="Cari nama produk atau SKU..."
                  searchQuery={valuationSearch}
                  onSearchChange={setValuationSearch}
                />
              </div>
              <Select
                value={stockStatusFilter}
                onValueChange={(val) => setStockStatusFilter(val as 'all' | 'low' | 'safe')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status stok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="low">Stok Menipis / Kritis</SelectItem>
                  <SelectItem value="safe">Stok Aman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DataTable<ValuationRow>
              columns={[
                { key: 'name', header: t('common.name'), sortable: true },
                { key: 'sku', header: 'SKU', sortable: true },
                {
                  key: 'stock',
                  header: t('products.available_stock'),
                  sortable: true,
                },
                {
                  key: 'unitCost',
                  header: 'HPP',
                  sortable: true,
                  render: (row) => formatCurrency(row.unitCost),
                },
                {
                  key: 'value',
                  header: t('reports.value'),
                  sortable: true,
                  render: (row) => <span className="font-semibold">{formatCurrency(row.value)}</span>,
                },
                {
                  key: 'isLow',
                  header: t('common.status'),
                  sortable: true,
                  render: (row) =>
                    row.isLow ? (
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {t('reports.low_stock_count')}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {t('products.stock_status_safe')}
                      </span>
                    ),
                },
              ]}
              data={filteredValuation}
              emptyTitle="Tidak ada produk ditemukan"
            />
          </ReportSection>

          {movementRows.length > 0 && (
            <ReportSection title={t('reports.movement_log')}>
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <FilterToolbar
                    placeholder="Cari nama produk..."
                    searchQuery={movementSearch}
                    onSearchChange={setMovementSearch}
                  />
                </div>
                <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DataTable<MovementRow>
                columns={[
                  { key: 'date', header: t('common.date'), sortable: true },
                  { key: 'productName', header: t('common.name'), sortable: true },
                  {
                    key: 'typeLabel',
                    header: t('reports.movement_type'),
                    sortable: true,
                    render: (row) => <Badge variant="outline">{row.typeLabel}</Badge>,
                  },
                  {
                    key: 'qty',
                    header: t('reports.movement_qty'),
                    sortable: true,
                    render: (row) => (
                      <span className={`font-medium ${row.qty < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {row.qty > 0 ? '+' : ''}
                        {row.qty}
                      </span>
                    ),
                  },
                  { key: 'notes', header: t('reports.movement_notes') },
                ]}
                data={filteredMovements}
                emptyTitle="Tidak ada mutasi stok ditemukan"
              />
            </ReportSection>
          )}
        </>
      ) : null}
    </div>
  )
}
