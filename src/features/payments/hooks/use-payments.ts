import { useLiveQuery } from '@/services/local-db/reactivity'

import { paymentRepository } from '@/services/local-db/repository'

export function usePayments() {
  return useLiveQuery(() => paymentRepository.list(), [], [])
}
