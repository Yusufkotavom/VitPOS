import { TriangleAlert, Wallet, ReceiptText, type LucideIcon } from 'lucide-react'

import { formatCurrency } from '@/lib/format-currency'

type DashboardSale = {
  code?: string
  customerName?: string
  grandTotal?: unknown
  status?: string
}

type DashboardInventoryItem = {
  status?: string
}

type DashboardCustomer = {
  receivable?: unknown
}

type DashboardStatsInput = {
  sales: DashboardSale[]
  inventory: DashboardInventoryItem[]
  customers: DashboardCustomer[]
}

export type DashboardStat = {
  label: string
  value: string
  tone: string
}

export type DashboardTransaction = {
  code: string | undefined
  customer: string | undefined
  total: string
  status: string | undefined
}

export type DashboardAlert = {
  title: string
  description: string
  icon: LucideIcon
  tone: string
}

function toSafeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function buildDashboardStats({ sales, inventory, customers }: DashboardStatsInput) {
  const pendapatan = sales.reduce((acc, sale) => acc + toSafeNumber(sale.grandTotal), 0)
  const piutang = customers.reduce((acc, customer) => acc + toSafeNumber(customer.receivable), 0)
  const kritisCount = inventory.filter((item) => item.status === 'Stok Rendah' || item.status === 'Habis').length

  const dashboardStats: DashboardStat[] = [
    { label: 'Pendapatan Hari Ini', value: formatCurrency(pendapatan), tone: 'text-emerald-600' },
    { label: 'Laba Kotor', value: formatCurrency(pendapatan * 0.3), tone: 'text-sky-600' },
    { label: 'Piutang Aktif', value: formatCurrency(piutang), tone: 'text-amber-600' },
    { label: 'Stok Kritis', value: `${kritisCount} item`, tone: 'text-rose-600' },
  ]

  const dashboardTransactions: DashboardTransaction[] = sales.slice(0, 5).map((sale) => ({
    code: sale.code,
    customer: sale.customerName,
    total: formatCurrency(sale.grandTotal),
    status: sale.status,
  }))

  const dashboardAlerts: DashboardAlert[] = [
    { title: 'Stok Kritis', description: `${kritisCount} item perlu restock`, icon: TriangleAlert, tone: 'text-amber-500' },
    { title: 'Arus Kas', description: `Masuk ${formatCurrency(pendapatan)}`, icon: Wallet, tone: 'text-sky-600' },
    { title: 'Piutang & Hutang', description: 'Perlu follow up hari ini', icon: ReceiptText, tone: 'text-rose-600' },
  ]

  return {
    dashboardStats,
    dashboardTransactions,
    dashboardAlerts,
  }
}
