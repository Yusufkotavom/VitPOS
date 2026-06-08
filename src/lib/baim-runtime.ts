export const baimRuntime = {
  userId: '11111111-1111-4111-8111-111111111111',
  userEmail: 'baim@kotacom.id',
  userName: 'Baim Yusuf',
  tenantId: '22222222-2222-4222-8222-222222222222',
  tenantName: 'Toko Baim Jaya',
  branchId: '33333333-3333-4333-8333-333333333333',
  branchName: 'Cabang Utama',
  warehouseId: '44444444-4444-4444-8444-444444444444',
  categoryId: '55555555-5555-4555-8555-555555555555',
  productId: '66666666-6666-4666-8666-666666666666',
  customerId: '77777777-7777-4777-8777-777777777777',
  salesOrderId: '88888888-8888-4888-8888-888888888888',
  salesOrderItemId: '99999999-9999-4999-8999-999999999999',
  paymentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  stockMovementId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  deviceId: 'kasir-baim-web',
} as const

export function buildBaimTenantQuery() {
  return {
    tenantId: baimRuntime.tenantId,
    branchId: baimRuntime.branchId,
  }
}
