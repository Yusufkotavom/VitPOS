import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { ReportDateFilter, useReportDateParams } from '@/features/reports/components/report-date-filter'
import { useGeneralLedger } from '@/features/reports/hooks/use-general-ledger'
import { formatCurrency } from '@/lib/format-currency'
import { exportToCsv } from '@/shared/utils/export-csv'
import { useState } from 'react'

export function GeneralLedgerPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const params = useReportDateParams()
  const [accountCode, setAccountCode] = useState<string>('')
  const { accounts, accountsLoading, data, isLoading } = useGeneralLedger(accountCode || undefined, params)

  function handleExport() {
    if (!data) return
    const rows = data.rows.map((r, i) => ({
      id: `${i}`,
      tanggal: r.date,
      kodeJurnal: r.journalCode,
      deskripsi: r.description,
      debit: r.debit,
      kredit: r.credit,
      saldo: r.balance,
    }))
    exportToCsv(`general-ledger-${data.account.code}-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'tanggal', header: t('common.date') },
      { key: 'kodeJurnal', header: 'Kode Jurnal' },
      { key: 'deskripsi', header: t('common.description') },
      { key: 'debit', header: t('reports.debit') },
      { key: 'kredit', header: t('reports.credit') },
      { key: 'saldo', header: t('reports.balance') },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{t('reports.general_ledger')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.general_ledger_description')}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>{t('common.export')} CSV</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <label className="space-y-1.5 text-sm font-medium">
          {t('reports.select_account')}
          <Select value={accountCode} onValueChange={setAccountCode} disabled={accountsLoading}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder={t('reports.select_account_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <ReportDateFilter />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
      ) : !accountCode ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('reports.no_account_selected')}</p>
      ) : data ? (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2">{t('common.date')}</TableHead>
                    <TableHead className="py-2">{t('reports.journal_code')}</TableHead>
                    <TableHead className="py-2">{t('common.description')}</TableHead>
                    <TableHead className="py-2 text-right">{t('reports.debit')}</TableHead>
                    <TableHead className="py-2 text-right">{t('reports.credit')}</TableHead>
                    <TableHead className="py-2 text-right">{t('reports.balance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t('reports.no_transactions_for_account')}
                      </TableCell>
                    </TableRow>
                  )}
                  {data.rows.map((row, i) => (
                    <TableRow key={i} className="border-b">
                      <TableCell className="py-2 text-sm">{row.date}</TableCell>
                      <TableCell className="py-2 text-sm font-mono">{row.journalCode}</TableCell>
                      <TableCell className="py-2 text-sm">{row.description}</TableCell>
                      <TableCell className="py-2 text-sm text-right">{row.debit > 0 ? formatCurrency(row.debit) : ''}</TableCell>
                      <TableCell className="py-2 text-sm text-right">{row.credit > 0 ? formatCurrency(row.credit) : ''}</TableCell>
                      <TableCell className="py-2 text-sm text-right font-semibold">{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-card p-4 text-right">
            <span className="text-sm text-muted-foreground mr-3">{t('reports.ending_balance')}</span>
            <span className="text-lg font-bold">{formatCurrency(data.endingBalance)}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}
