import { baimRuntime } from '@/lib/baim-runtime'

export const tenantOptions = [
  { id: baimRuntime.tenantId, name: baimRuntime.tenantName, type: 'Retail', plan: 'Pro', branches: 1 },
  { id: 'tenant-2', name: 'Sari Printing', type: 'Percetakan', plan: 'Starter', branches: 1 },
  { id: 'tenant-3', name: 'Service HP Barokah', type: 'Service HP', plan: 'Trial', branches: 1 },
]

export const onboardingSteps = [
  'Profil usaha',
  'Jenis usaha',
  'Cabang pertama',
  'Gudang pertama',
  'Metode pembayaran',
  'Import produk',
]
