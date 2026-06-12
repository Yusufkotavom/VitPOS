import { useLiveQuery } from '@/shared/hooks/use-live-query'

import { paymentRepository } from '@/services/local-db/repository'

export function usePayments() {
  return useLiveQuery(() => paymentRepository.list(), [], [])
}
