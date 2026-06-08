import { Button } from '@/components/ui/button'
import { useCash } from '@/features/cash/hooks/use-cash'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

function tone(status: string) {
  if (status === 'Tercatat') return 'success'
  if (status === 'Pending Sinkron') return 'info'
  return 'warning'
}

export function CashPage() {
  const cash = useCash()

  return (
    <PageShell title="Kas & Bank" description="Pemasukan, pengeluaran, kategori kas, metode bayar, dan mutasi." actions={<Button>Tambah Transaksi</Button>}>
      <ContentCard title="Mutasi Kas" description="Catat pemasukan dan pengeluaran manual bisnis.">
        <DataTable
          data={cash}
          columns={[
            { key: 'ref', header: 'Ref' },
            { key: 'date', header: 'Tanggal' },
            { key: 'account', header: 'Akun Kas' },
            { key: 'category', header: 'Kategori' },
            { key: 'income', header: 'Masuk' },
            { key: 'expense', header: 'Keluar' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={tone(row.status)} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.ref}</p>
              <p className="text-sm text-muted-foreground">{row.account} · {row.category}</p>
              <div className="flex items-center justify-between text-sm"><span>Masuk {row.income}</span><span>Keluar {row.expense}</span></div>
              <StatusBadge label={row.status} tone={tone(row.status)} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
