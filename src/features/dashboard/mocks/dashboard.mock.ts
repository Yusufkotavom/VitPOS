import { ChartNoAxesCombined, Package, ReceiptText, TriangleAlert, Wallet, type LucideIcon } from 'lucide-react'

import { formatCurrency } from '@/lib/format-currency'

export const dashboardStats = [
  { label: 'Pendapatan Hari Ini', value: formatCurrency(3250000), tone: 'text-emerald-600' },
  { label: 'Laba Kotor', value: formatCurrency(1180000), tone: 'text-sky-600' },
  { label: 'Piutang Aktif', value: formatCurrency(2450000), tone: 'text-amber-600' },
  { label: 'Stok Kritis', value: '12 item', tone: 'text-rose-600' },
]

export const dashboardTransactions = [
  { code: 'SO-240608-001', customer: 'Budi Santoso', total: formatCurrency(450000), status: 'Lunas' },
  { code: 'SO-240608-002', customer: 'Toko Maju Jaya', total: formatCurrency(875000), status: 'Sebagian' },
  { code: 'SO-240608-003', customer: 'Sari Printing', total: formatCurrency(1200000), status: 'Piutang' },
]

export const dashboardAlerts: Array<{ title: string; description: string; icon: LucideIcon; tone: string }> = [
  { title: 'Stok Kritis', description: '12 item perlu restock', icon: TriangleAlert, tone: 'text-amber-500' },
  { title: 'Arus Kas', description: `Masuk ${formatCurrency(5200000)}`, icon: Wallet, tone: 'text-sky-600' },
  { title: 'Piutang & Hutang', description: 'Perlu follow up hari ini', icon: ReceiptText, tone: 'text-rose-600' },
  { title: 'Sync Status', description: '7 data menunggu sinkron', icon: Package, tone: 'text-emerald-600' },
]

export const dashboardChart = {
  title: 'Pendapatan vs Pengeluaran',
  description: 'Placeholder chart foundation',
  icon: ChartNoAxesCombined,
}
