import { useEffect } from 'react'
import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { purchaseRepository } from '@/services/local-db/repository'
import { syncMissingPurchaseStockAndJournals } from '@/features/purchases/services/purchase-receiving.service'
import { syncMissingPurchaseCashRecords } from '@/features/purchases/services/purchase-payment.service'

export function usePurchases() {
  useEffect(() => {
    syncMissingPurchaseStockAndJournals()
    syncMissingPurchaseCashRecords()
  }, [])

  return useLiveQuery(() => purchaseRepository.list(), [], [])
}
