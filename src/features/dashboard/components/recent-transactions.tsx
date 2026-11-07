import { useTranslation } from 'react-i18next'
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function RecentTransactions() {
  const { t } = useTranslation()
  const { dashboardTransactions } = useDashboardStats()

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t('dashboard.recent_transactions')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px]">{t('dashboard.order_id')}</TableHead>
                <TableHead>{t('common.customer')}</TableHead>
                <TableHead className="text-right">{t('common.total')}</TableHead>
                <TableHead className="text-right w-[100px]">{t('common.status')}</TableHead>
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
                    {t('dashboard.no_transactions_today')}
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
