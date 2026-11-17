import { productRepository } from '@/services/local-db/repository'
import { requireActiveTenantId } from '@/features/auth/stores/auth-store'
import { createProductId } from '@/features/catalog/lib/entity-id'
import type { LocalJobLine, LocalProduct } from '@/services/local-db/schema'

export async function saveJobLineAsCatalogService(line: LocalJobLine, category = 'Jasa Servis'): Promise<LocalProduct> {
  const tenantId = requireActiveTenantId()

  const product: LocalProduct = {
    id: createProductId(),
    tenantId,
    name: line.name.trim(),
    category,
    type: 'Jasa',
    price: line.unitPrice,
    costPrice: line.costPrice,
    stock: 0,
    manageStock: false,
    unit: line.unit || 'unit',
    status: 'Aktif',
    syncStatus: 'pending',
    version: 1,
    updatedAt: new Date().toISOString(),
  }

  await productRepository.upsert(product)
  return product
}
