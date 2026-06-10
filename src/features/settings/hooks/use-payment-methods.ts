import { useLiveQuery } from '@/services/local-db/reactivity'
import { paymentMethodRepository } from '@/services/local-db/repository'

export function usePaymentMethods() {
  return useLiveQuery(() => paymentMethodRepository.list(), [], [])
}
