import { useLiveQuery } from '@/services/local-db/reactivity'

import { buildDashboardStats } from '@/features/dashboard/hooks/dashboard-stats'
import { salesOrderRepository, inventoryRepository, customerRepository } from '@/services/local-db/repository'

export function useDashboardStats() {
  return useLiveQuery(async () => {
    const [sales, inventory, customers] = await Promise.all([
      salesOrderRepository.list(),
      inventoryRepository.list(),
      customerRepository.list(),
    ])

    return buildDashboardStats({ sales, inventory, customers })
  }, [], {
    dashboardStats: [
      { label: 'Pendapatan Hari Ini', value: 'Rp 0', tone: 'text-emerald-600' },
      { label: 'Laba Kotor', value: 'Rp 0', tone: 'text-sky-600' },
      { label: 'Piutang Aktif', value: 'Rp 0', tone: 'text-amber-600' },
      { label: 'Stok Kritis', value: '0 item', tone: 'text-rose-600' },
    ],
    dashboardTransactions: [],
    dashboardAlerts: [],
  })
}
