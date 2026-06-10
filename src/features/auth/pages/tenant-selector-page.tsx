import { useEffect, useState } from 'react'
import { ArrowRight, Building2, Store } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { localDb } from '@/services/local-db/client'
import type { LocalTenant } from '@/services/local-db/schema'

type TenantOption = LocalTenant & {
  role: string
  branches: number
}

export function TenantSelectorPage() {
  const navigate = useNavigate()
  const { currentUser, setActiveTenant } = useAuthStore()
  const [tenants, setTenants] = useState<TenantOption[]>([])

  useEffect(() => {
    async function loadTenants() {
      if (!currentUser) return

      let members = await localDb.tenantMembers.where('userId').equals(currentUser.id).toArray()

      if (members.length === 0 && currentUser.email === 'owner@usaha.co.id') {
        const mockTenantId = 'mock-tenant-id'
        const now = new Date().toISOString()
        
        const mockTenant = {
          id: mockTenantId,
          name: 'Toko Sumber Rejeki',
          type: 'Retail',
          phone: '',
          planCode: 'Pro',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }

        const mockMember = {
          id: crypto.randomUUID(),
          tenantId: mockTenantId,
          userId: currentUser.id,
          role: 'owner',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }

        await localDb.tenants.add(mockTenant)
        await localDb.tenantMembers.add(mockMember)
        
        members = [mockMember]
      }

      const tenantList: TenantOption[] = []
      for (const member of members) {
        const tenant = await localDb.tenants.get(member.tenantId)
        if (tenant) {
          tenantList.push({
            ...tenant,
            role: member.role,
            branches: 1,
          })
        }
      }

      setTenants(tenantList)
    }

    loadTenants()
  }, [currentUser])

  function handleSelect(tenant: LocalTenant, role: string) {
    localStorage.removeItem('vitpos-initial-sync-done')
    setActiveTenant(tenant, role)
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border bg-background px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">Pilih Usaha</h1>
                <p className="text-sm text-muted-foreground">Masuk ke tenant yang aktif, lalu lanjut ke dashboard operasional.</p>
              </div>
            </div>
            <Badge variant="secondary">Tenant Aktif</Badge>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden transition-colors hover:border-primary/30">
              <CardHeader className="gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Store aria-hidden="true" />
                  </div>
                  <Badge variant="secondary">{tenant.planCode}</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle>{tenant.name}</CardTitle>
                  <CardDescription>{tenant.type}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                    <dt className="text-muted-foreground">Cabang</dt>
                    <dd className="font-medium">{tenant.branches}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                    <dt className="text-muted-foreground">Status sinkron</dt>
                    <dd className="font-medium">Data sudah aman</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Pilih tenant untuk buka kasir, stok, dan invoice.</p>
                <Button onClick={() => handleSelect(tenant, tenant.role)} className="w-full sm:w-auto">
                  Buka Usaha
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/onboarding">Tambah usaha baru</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
