import { BadgeDollarSign, Boxes, ClipboardList, ReceiptText, Scale, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ReportsSummaryCards } from '@/features/reports/components/reports-summary-cards'
import { getReportPreset } from '@/features/reports/config/report-presets'
import { useReportRows } from '@/features/reports/hooks/use-report-rows'
import { PageShell } from '@/shared/components/layout/page-shell'

const REPORT_CARD_ICONS = {
  Ringkasan: ClipboardList,
  Penjualan: ReceiptText,
  'Laba Rugi': TrendingUp,
  Neraca: Scale,
  Stok: Boxes,
  Kas: Wallet,
  Piutang: BadgeDollarSign,
} as const

export function ReportsPage() {
  const { data: reportRows = [] } = useReportRows()
  const reportPreset = getReportPreset('atk_printing_combo')

  return (
    <PageShell
      title="Laporan"
      description="Ringkasan owner, penjualan, stok, kas, dan piutang untuk usaha harian."
    >
      <ReportsSummaryCards reports={reportRows} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reportPreset.cards.map((card) => {
          const Icon = REPORT_CARD_ICONS[card.title as keyof typeof REPORT_CARD_ICONS]

          return (
            <Link
              key={card.title}
              to={card.to}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground">{card.title}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </PageShell>
  )
}
