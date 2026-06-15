import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

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
    exportToCsv(`buku-besar-${data.account.code}-${params.from ?? 'awal'}-${params.to ?? 'akhir'}.csv`, [
      { key: 'tanggal', header: 'Tanggal' },
      { key: 'kodeJurnal', header: 'Kode Jurnal' },
      { key: 'deskripsi', header: 'Deskripsi' },
      { key: 'debit', header: 'Debit' },
      { key: 'kredit', header: 'Kredit' },
      { key: 'saldo', header: 'Saldo' },
    ], rows)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Buku Besar</h1>
          <p className="text-sm text-muted-foreground">Riwayat transaksi per akun — berdasarkan jurnal akuntansi</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>Export CSV</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <label className="space-y-1.5 text-sm font-medium">
          Pilih Akun
          <Select value={accountCode} onValueChange={setAccountCode} disabled={accountsLoading}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Pilih akun..." />
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
        <p className="text-sm text-muted-foreground py-8 text-center">Memuat data...</p>
      ) : !accountCode ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Pilih akun untuk melihat buku besar</p>
      ) : data ? (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2">Tanggal</TableHead>
                    <TableHead className="py-2">Kode Jurnal</TableHead>
                    <TableHead className="py-2">Deskripsi</TableHead>
                    <TableHead className="py-2 text-right">Debit</TableHead>
                    <TableHead className="py-2 text-right">Kredit</TableHead>
                    <TableHead className="py-2 text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Belum ada transaksi untuk akun ini
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
            <span className="text-sm text-muted-foreground mr-3">Saldo Akhir:</span>
            <span className="text-lg font-bold">{formatCurrency(data.endingBalance)}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}
