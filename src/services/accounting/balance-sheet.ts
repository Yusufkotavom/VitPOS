import { getTrialBalance } from '@/services/accounting/trial-balance'

export interface BalanceSheetReport {
  assets: { accountCode: string; accountName: string; balance: number }[]
  totalAssets: number
  liabilities: { accountCode: string; accountName: string; balance: number }[]
  totalLiabilities: number
  equities: { accountCode: string; accountName: string; balance: number }[]
  totalEquity: number
  totalLiabilitiesEquity: number
}

/**
 * Get balance sheet for a tenant.
 * Assets (1xxx) = Liabilities (2xxx) + Equity (3xxx).
 * Optionally filter by date range.
 */
export async function getBalanceSheet(
  tenantId: string,
  startDate?: string,
  endDate?: string,
): Promise<BalanceSheetReport> {
  const trialBalance = await getTrialBalance(tenantId, startDate, endDate)

  const assets = trialBalance
    .filter((r) => r.type === 'asset')
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, balance: r.balance }))

  const liabilities = trialBalance
    .filter((r) => r.type === 'liability')
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, balance: r.balance }))

  const equities = trialBalance
    .filter((r) => r.type === 'equity')
    .map((r) => ({ accountCode: r.accountCode, accountName: r.accountName, balance: r.balance }))

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0)
  const totalEquity = equities.reduce((sum, e) => sum + e.balance, 0)

  return {
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equities,
    totalEquity,
    totalLiabilitiesEquity: totalLiabilities + totalEquity,
  }
}
