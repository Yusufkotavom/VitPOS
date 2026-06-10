import { ChartNoAxesCombined } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function RevenueExpensePanel() {
  const Icon = ChartNoAxesCombined

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col">
          <CardTitle className="text-lg">Pendapatan vs Pengeluaran</CardTitle>
          <CardDescription>Grafik arus kas bulan ini</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 grid h-64 place-items-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
          Area chart dashboard
        </div>
      </CardContent>
    </Card>
  )
}
