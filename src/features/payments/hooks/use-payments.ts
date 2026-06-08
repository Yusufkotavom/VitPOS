import { useLiveQuery } from 'dexie-react-hooks'

import { paymentRepository } from '@/services/local-db/repository'

export function usePayments() {
  return useLiveQuery(() => paymentRepository.list(), [], [])
}
