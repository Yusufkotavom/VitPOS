export type PlatformAdminTenant = {
  id: string
  tenantName: string
  ownerName: string
  city: string
  packageName: string
  subscriptionStatus: 'Aktif' | 'Uji Coba' | 'Tertunda' | 'Nonaktif'
  monthlyFee: number
  storageUsedGb: number
  storageLimitGb: number
  syncStatus: 'Data sudah aman di cloud' | 'Data menunggu sinkron' | 'Butuh pemeriksaan' | 'Coba sinkron ulang'
  lastSyncAt: string
}

export const platformAdminTenants: PlatformAdminTenant[] = [
  {
    id: 'tenant-1',
    tenantName: 'Toko Sumber Rezeki',
    ownerName: 'Ibu Ratna',
    city: 'Bandung',
    packageName: 'Pro Retail',
    subscriptionStatus: 'Aktif',
    monthlyFee: 1490000,
    storageUsedGb: 42,
    storageLimitGb: 80,
    syncStatus: 'Data sudah aman di cloud',
    lastSyncAt: '08 Jun 2026 09:10',
  },
  {
    id: 'tenant-2',
    tenantName: 'Bengkel Maju Motor',
    ownerName: 'Pak Dimas',
    city: 'Surabaya',
    packageName: 'Bisnis Plus',
    subscriptionStatus: 'Aktif',
    monthlyFee: 1250000,
    storageUsedGb: 33,
    storageLimitGb: 70,
    syncStatus: 'Data menunggu sinkron',
    lastSyncAt: '08 Jun 2026 08:35',
  },
  {
    id: 'tenant-3',
    tenantName: 'Kopi Senja Nusantara',
    ownerName: 'Mbak Laras',
    city: 'Yogyakarta',
    packageName: 'Starter',
    subscriptionStatus: 'Uji Coba',
    monthlyFee: 0,
    storageUsedGb: 18,
    storageLimitGb: 30,
    syncStatus: 'Data sudah aman di cloud',
    lastSyncAt: '08 Jun 2026 09:20',
  },
  {
    id: 'tenant-4',
    tenantName: 'Distributor Berkah Jaya',
    ownerName: 'Pak Yusuf',
    city: 'Jakarta',
    packageName: 'Enterprise',
    subscriptionStatus: 'Tertunda',
    monthlyFee: 2700000,
    storageUsedGb: 42,
    storageLimitGb: 80,
    syncStatus: 'Butuh pemeriksaan',
    lastSyncAt: '07 Jun 2026 22:45',
  },
]
