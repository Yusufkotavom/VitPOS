import { useLiveQuery } from '@/services/local-db/reactivity'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import type { PdfCompanySettings } from './types'

export function usePdfSettings(): PdfCompanySettings {
  const activeTenantId = useAuthStore((state) => state.activeTenant?.id)
  const settings = useLiveQuery(
    () => activeTenantId ? localDb.settings.where('tenantId').equals(activeTenantId).toArray() : [],
    [activeTenantId],
  ) ?? []

  return {
    companyName: settings.find(s => s.id === 'company-name')?.value || 'KOTACOM POS',
    companyPhone: settings.find(s => s.id === 'company-phone')?.value || '',
    companyAddress: settings.find(s => s.id === 'company-address')?.value || '',
    companyTax: settings.find(s => s.id === 'company-tax-number')?.value || '',
    receiptHeader: settings.find(s => s.id === 'receipt-header')?.value || '',
    receiptFooter: settings.find(s => s.id === 'receipt-footer')?.value || 'Terima kasih atas kunjungan Anda',
    invoiceTerm: settings.find(s => s.id === 'invoice-term')?.value || 'Syarat & Ketentuan berlaku.',
  }
}
