import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { ReportMetricCard } from '@/features/reports/components/report-section'
import { ReportCorrelationNav } from '@/features/reports/components/report-correlation-nav'
import { useBalanceSheet } from '@/features/reports/hooks/use-balance-sheet'
import { FilterToolbar } from '@/shared/components/data-table/filter-toolbar'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'

export function BalanceSheetPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useReportDateParams()
  const { data, isLoading } = useBalanceSheet(params)
  const [searchQuery, setSearchQuery] = useState('')

  function handleExport() {
    if (!data) return
    const rows = [
      { id: '1', akun: 'ASET', nilai: '' },
      ...data.assets.map((a, i) => ({ id: `a${i}`, akun: `  ${a.accountName}`, nilai: String(a.balance) })),
      { id: 'ta', akun: t('reports.total_assets'), nilai: String(data.totalAssets) },
      { id: '', akun: '', nilai: '' },
      { id: '2', akun: 'LIABILITAS', nilai: '' },
      ...data.liabilities.map((l, i) => ({ id: `l${i}`, akun: `  ${l.accountName}`, nilai: String(l.balance) })),
      { id: 'tl', akun: t('reports.total_liabilities'), nilai: String(data.totalLiabilities) },
      { id: '', akun: '', nilai: '' },
      { id: '3', akun: 'EKUITAS', nilai: '' },
      ...data.equities.map((e, i) => ({ id: `e${i}`, akun: `  ${e.accountName}`, nilai: String(e.balance) })),
      { id: 'te', akun: t('reports.total_equity'), nilai: String(data.totalEquity) },
      { id: '', akun: '', nilai: '' },
      { id: '4', akun: t('reports.total_liabilities_equity'), nilai: String(data.totalLiabilitiesEquity) },
    ]
    exportToCsv(
      `balance-sheet-${params.to ?? 'current'}.csv`,
      [
        { key: 'akun', header: t('reports.account') },
        { key: 'nilai', header: t('reports.value') },
      ],
      rows,
    )
  }

  const query = searchQuery.toLowerCase().trim()

  const assets = (data?.assets ?? []).filter(
    (a) => !query || a.accountName.toLowerCase().includes(query) || a.accountCode.toLowerCase().includes(query),
  )
  const liabilities = (data?.liabilities ?? []).filter(
    (l) => !query || l.accountName.toLowerCase().includes(query) || l.accountCode.toLowerCase().includes(query),
  )
  const equities = (data?.equities ?? []).filter(
    (e) => !query || e.accountName.toLowerCase().includes(query) || e.accountCode.toLowerCase().includes(query),
  )

  function getLedgerLink(accountCode: string) {
    const searchParams = new URLSearchParams()
    searchParams.set('accountCode', accountCode)
    if (params.from) searchParams.set('from', params.from)
    if (params.to) searchParams.set('to', params.to)
    return `/reports/general-ledger?${searchParams.toString()}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('reports.balance_sheet_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.balance_sheet_description')}</p>
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
          { to: '/reports/profit-loss', label: 'Laba Rugi', hint: 'Kinerja laba periode berjalan' },
          { to: '/reports/general-ledger', label: 'Buku Besar', hint: 'Mutasi akun neraca' },
          { to: '/reports/payments?tab=receivables', label: 'Piutang Usaha', hint: 'Rincian piutang belum lunas' },
          { to: '/reports/inventory', label: 'Stok & Inventori', hint: 'Rincian persediaan fisik' },
        ]}
      />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetricCard
              label={t('reports.total_assets')}
              value={formatCurrency(data.totalAssets)}
              tone="positive"
            />
            <ReportMetricCard
              label={t('reports.total_liabilities')}
              value={formatCurrency(data.totalLiabilities)}
              tone="negative"
            />
            <ReportMetricCard label={t('reports.total_equity')} value={formatCurrency(data.totalEquity)} />
          </div>

          <FilterToolbar
            placeholder="Cari akun aset, liabilitas, atau ekuitas..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {t('reports.assets_section')}
                    </TableCell>
                  </TableRow>
                  {assets.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>
                        {query ? 'Tidak ada akun aset yang cocok' : t('reports.no_asset_data')}
                      </TableCell>
                    </TableRow>
                  )}
                  {assets.map((a) => (
                    <TableRow key={a.accountCode} className="group border-b">
                      <TableCell className="py-2">
                        <Link
                          to={getLedgerLink(a.accountCode)}
                          className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
                          title="Buka Buku Besar akun ini"
                        >
                          <span className="font-mono text-xs text-muted-foreground">{a.accountCode}</span>
                          <span>{a.accountName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold">{formatCurrency(a.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-bold">
                    <TableCell className="py-2">{t('reports.total_assets')}</TableCell>
                    <TableCell className="py-2 text-right text-green-600">
                      {formatCurrency(data.totalAssets)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {t('reports.liabilities_section')}
                    </TableCell>
                  </TableRow>
                  {liabilities.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>
                        {query ? 'Tidak ada akun liabilitas yang cocok' : t('reports.no_liability_data')}
                      </TableCell>
                    </TableRow>
                  )}
                  {liabilities.map((l) => (
                    <TableRow key={l.accountCode} className="group border-b">
                      <TableCell className="py-2">
                        <Link
                          to={getLedgerLink(l.accountCode)}
                          className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
                          title="Buka Buku Besar akun ini"
                        >
                          <span className="font-mono text-xs text-muted-foreground">{l.accountCode}</span>
                          <span>{l.accountName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold text-red-600">
                        {formatCurrency(l.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-bold">
                    <TableCell className="py-2">{t('reports.total_liabilities')}</TableCell>
                    <TableCell className="py-2 text-right text-red-600">
                      {formatCurrency(data.totalLiabilities)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-b bg-muted/50">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {t('reports.equity_section')}
                    </TableCell>
                  </TableRow>
                  {equities.length === 0 && (
                    <TableRow className="border-b">
                      <TableCell className="py-2 text-muted-foreground" colSpan={2}>
                        {query ? 'Tidak ada akun ekuitas yang cocok' : t('reports.no_equity_data')}
                      </TableCell>
                    </TableRow>
                  )}
                  {equities.map((e) => (
                    <TableRow key={e.accountCode} className="group border-b">
                      <TableCell className="py-2">
                        <Link
                          to={getLedgerLink(e.accountCode)}
                          className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
                          title="Buka Buku Besar akun ini"
                        >
                          <span className="font-mono text-xs text-muted-foreground">{e.accountCode}</span>
                          <span>{e.accountName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold">{formatCurrency(e.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-bold">
                    <TableCell className="py-2">{t('reports.total_equity')}</TableCell>
                    <TableCell className="py-2 text-right">{formatCurrency(data.totalEquity)}</TableCell>
                  </TableRow>

                  <TableRow className="border-t-2 font-bold">
                    <TableCell className="py-2">{t('reports.total_liabilities_equity')}</TableCell>
                    <TableCell className="py-2 text-right">
                      {formatCurrency(data.totalLiabilitiesEquity)}
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
