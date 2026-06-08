import { useLiveQuery } from 'dexie-react-hooks'
import { paymentMethodRepository } from '@/services/local-db/repository'

export function usePaymentMethods() {
  return useLiveQuery(() => paymentMethodRepository.list(), [], [])
}
