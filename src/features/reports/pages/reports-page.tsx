import { Link } from 'react-router-dom'
import { TrendingUp, CreditCard, Boxes, Scale, ReceiptText } from 'lucide-react'

import { PageShell } from '@/shared/components/layout/page-shell'
import { ReportsSummaryCards } from '@/features/reports/components/reports-summary-cards'
import { useReportRows } from '@/features/reports/hooks/use-report-rows'

const REPORT_CARDS = [
  {
    to: '/reports/profit-loss',
    title: 'Laba Rugi',
    description: 'Pendapatan, HPP, beban, laba bersih',
    icon: TrendingUp,
  },
  {
    to: '/reports/balance-sheet',
    title: 'Neraca',
    description: 'Aset, liabilitas, ekuitas',
    icon: Scale,
  },
  {
    to: '/reports/sales',
    title: 'Penjualan',
    description: 'Omzet, tren grafik, top produk',
    icon: ReceiptText,
  },
  {
    to: '/reports/payments',
    title: 'Pembayaran',
    description: 'Metode bayar, cash flow, piutang',
    icon: CreditCard,
  },
  {
    to: '/reports/inventory',
    title: 'Stok',
    description: 'Valuasi, pergerakan, stok rendah',
    icon: Boxes,
  },
]

export function ReportsPage() {
  const { data: reportRows = [] } = useReportRows()

  return (
    <PageShell
      title="Laporan"
      description="Keuangan, laba rugi, neraca, penjualan, pembayaran, dan persediaan."
    >
      <ReportsSummaryCards reports={reportRows} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground">{card.title}</p>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
