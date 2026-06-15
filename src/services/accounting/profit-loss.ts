import { getTrialBalance } from '@/services/accounting/trial-balance'

export interface ProfitLossReport {
  revenues: { accountCode: string; accountName: string; amount: number }[]
  totalRevenue: number
  cogs: { accountCode: string; accountName: string; amount: number }[]
  totalCogs: number
  grossProfit: number
  expenses: { accountCode: string; accountName: string; amount: number }[]
  totalExpense: number
  netProfit: number
}

/**
 * Get profit & loss report for a tenant.
 * Revenue (4xxx) - COGS (5xxx) = Gross Profit
 * Gross Profit - Expense (6xxx) = Net Profit
 * Optionally filter by date range.
 */
export async function getProfitLoss(
  tenantId: string,
  startDate?: string,
  endDate?: string,
): Promise<ProfitLossReport> {
  const trialBalance = await getTrialBalance(tenantId, startDate, endDate)

  const revenues = trialBalance
    .filter((r) => r.type === 'revenue')
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }))

  const cogs = trialBalance
    .filter((r) => r.type === 'cogs')
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }))

  const expenses = trialBalance
    .filter((r) => r.type === 'expense')
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, amount: r.balance }))

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)
  const totalCogs = cogs.reduce((sum, c) => sum + c.amount, 0)
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const grossProfit = totalRevenue - totalCogs
  const netProfit = grossProfit - totalExpense

  return {
    revenues,
    totalRevenue,
    cogs,
    totalCogs,
    grossProfit,
    expenses,
    totalExpense,
    netProfit,
  }
}
