import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { paymentMethodRepository } from '@/services/local-db/repository'

export function usePaymentMethods() {
  return useLiveQuery(() => paymentMethodRepository.list(), [], [])
}
