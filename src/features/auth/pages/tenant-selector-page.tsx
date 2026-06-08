import { ArrowRight, Building2, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import { tenantOptions } from '@/features/auth/mocks/auth.mock'
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

export function TenantSelectorPage() {
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
          {tenantOptions.map((tenant, index) => (
            <Card key={tenant.id} className="overflow-hidden transition-colors hover:border-primary/30">
              <CardHeader className="gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Store aria-hidden="true" />
                  </div>
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>{tenant.plan}</Badge>
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
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/">
                    Buka Usaha
                    <ArrowRight data-icon="inline-end" />
                  </Link>
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
