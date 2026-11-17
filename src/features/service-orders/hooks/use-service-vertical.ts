import { useLiveQuery } from '@/shared/hooks/use-live-query'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import { resolveServiceVertical, type ServiceVerticalConfig } from '@/features/service-orders/lib/vertical-config'

export function useServiceVertical(): ServiceVerticalConfig {
  const settings = useLiveQuery(
    async () => {
      const tenantId = resolveTenantId()
      const rows = await localDb.settings.where('tenantId').equals(tenantId).toArray()
      return rows
        .filter((row) => row.setting === 'business_vertical' || row.setting === 'business_mode')
        .map((row) => ({ setting: row.setting, value: row.value }))
    },
    [],
    [],
  )

  const verticalId = settings.find((row) => row.setting === 'business_vertical')?.value
  const modeId = settings.find((row) => row.setting === 'business_mode')?.value

  return resolveServiceVertical({ verticalId, modeId })
}
