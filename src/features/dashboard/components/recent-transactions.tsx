import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function RecentTransactions() {
  const { dashboardTransactions } = useDashboardStats()

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px]">ID Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardTransactions.map((transaction) => (
                <TableRow key={transaction.code} className="hover:bg-muted/10">
                  <TableCell className="font-medium text-primary">{transaction.code}</TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell className="text-right font-semibold">{transaction.total}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={transaction.status?.toLowerCase() === 'lunas' ? 'default' : 'secondary'} className="font-normal capitalize">
                      {transaction.status || 'Draft'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {dashboardTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Belum ada transaksi hari ini
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
