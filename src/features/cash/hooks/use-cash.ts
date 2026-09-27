import { useEffect } from 'react'
import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { cashRepository } from '@/services/local-db/repository'
import { syncMissingPurchaseCashRecords } from '@/features/purchases/services/purchase-payment.service'

export function useCash() {
  useEffect(() => {
    syncMissingPurchaseCashRecords()
  }, [])

  return useLiveQuery(() => cashRepository.list(), [], [])
}
