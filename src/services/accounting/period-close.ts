import { getTrialBalance } from '@/services/accounting/trial-balance'
import { createJournalEntry } from '@/services/accounting/journal.service'

/**
 * Close the period: transfer Laba Berjalan (3-3000) balance to Laba Ditahan (3-2000).
 *
 * If net profit > 0:
 *   Dr. Laba Berjalan 3-3000   Rp X
 *       Cr. Laba Ditahan 3-2000     Rp X
 *
 * If net loss (negative):
 *   Dr. Laba Ditahan 3-2000    Rp X
 *       Cr. Laba Berjalan 3-3000    Rp X
 */
export async function closePeriod(tenantId: string, periodEndDate: string): Promise<void> {
  const trialBalance = await getTrialBalance(tenantId)

  // Find Laba Berjalan (3-3000) balance
  const labaBerjalan = trialBalance.find((r) => r.accountCode === '3-3000')

  if (!labaBerjalan) {
    throw new Error('Laba Berjalan (3-3000) account not found')
  }

  const balance = labaBerjalan.balance

  // If balance is 0 or very close to 0, nothing to close
  if (Math.abs(balance) < 0.01) {
    return
  }

  if (balance > 0) {
    // Net profit — close to retained earnings
    await createJournalEntry(tenantId, {
      referenceType: 'period_close',
      referenceId: `close-${periodEndDate}`,
      description: `Penutupan laba periode ${periodEndDate}`,
      date: periodEndDate,
      lines: [
        { accountCode: '3-3000', debit: balance, credit: 0 },
        { accountCode: '3-2000', debit: 0, credit: balance },
      ],
    })
  } else {
    // Net loss — reverse
    const loss = Math.abs(balance)
    await createJournalEntry(tenantId, {
      referenceType: 'period_close',
      referenceId: `close-${periodEndDate}`,
      description: `Penutupan rugi periode ${periodEndDate}`,
      date: periodEndDate,
      lines: [
        { accountCode: '3-2000', debit: loss, credit: 0 },
        { accountCode: '3-3000', debit: 0, credit: loss },
      ],
    })
  }
}