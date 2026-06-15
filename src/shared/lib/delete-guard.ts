import { localDb } from '@/services/local-db/client'

export type DeleteGuardResult = {
  allowed: boolean
  reason?: string
}

/**
 * Cek apakah payment method bisa dihapus.
 * Tidak bisa jika sudah dipakai di tabel payments atau cash.
 */
export async function canDeletePaymentMethod(
  methodName: string,
  tenantId: string,
): Promise<DeleteGuardResult> {
  const paymentCount = await localDb.payments
    .where('method')
    .equals(methodName)
    .count()
  if (paymentCount > 0) {
    return {
      allowed: false,
      reason: `${paymentCount} pembayaran masih menggunakan metode ini`,
    }
  }

  const cashCount = await localDb.cash
    .where('[tenantId+account]')
    .equals([tenantId, methodName])
    .count()
  if (cashCount > 0) {
    return {
      allowed: false,
      reason: `${cashCount} transaksi kas masih menggunakan metode ini`,
    }
  }

  return { allowed: true }
}

/**
 * Cek apakah cash category bisa dihapus.
 * Tidak bisa jika sudah dipakai di tabel cash.
 */
export async function canDeleteCashCategory(
  categoryName: string,
  _tenantId: string,
): Promise<DeleteGuardResult> {
  const cashCount = await localDb.cash
    .where('category')
    .equals(categoryName)
    .count()
  if (cashCount > 0) {
    return {
      allowed: false,
      reason: `${cashCount} transaksi kas menggunakan kategori ini`,
    }
  }

  return { allowed: true }
}

/**
 * Cek apakah produk bisa dihapus.
 * Tidak bisa jika sudah dipakai di penjualan, pembelian, retur, stok, atau produksi.
 */
export async function canDeleteProduct(
  productId: string,
  tenantId: string,
): Promise<DeleteGuardResult> {
  const soCount = await localDb.salesOrderItems
    .where('productId')
    .equals(productId)
    .count()
  if (soCount > 0) {
    return {
      allowed: false,
      reason: `${soCount} item penjualan masih menggunakan produk ini`,
    }
  }

  const poCount = await localDb.purchaseItems
    .where('productId')
    .equals(productId)
    .count()
  if (poCount > 0) {
    return {
      allowed: false,
      reason: `${poCount} item pembelian masih menggunakan produk ini`,
    }
  }

  const retCount = await localDb.returnItems
    .where('productId')
    .equals(productId)
    .count()
  if (retCount > 0) {
    return {
      allowed: false,
      reason: `${retCount} item retur masih menggunakan produk ini`,
    }
  }

  const smCount = await localDb.stockMovements
    .where('[tenantId+productId]')
    .equals([tenantId, productId])
    .count()
  if (smCount > 0) {
    return {
      allowed: false,
      reason: `${smCount} pergerakan stok masih menggunakan produk ini`,
    }
  }

  const pbCount = await localDb.productionBatches
    .where('[tenantId+productId]')
    .equals([tenantId, productId])
    .count()
  if (pbCount > 0) {
    return {
      allowed: false,
      reason: `${pbCount} batch produksi masih menggunakan produk ini`,
    }
  }

  return { allowed: true }
}
