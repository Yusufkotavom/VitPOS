import { ArrowRight, Building2, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import { tenantOptions } from '@/features/auth/mocks/auth.mock'
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
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-2xl border bg-background p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Pilih Usaha</h1>
              <p className="text-sm text-muted-foreground">Pilih tenant untuk masuk ke dashboard operasional.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {tenantOptions.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Store />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {tenant.plan}
                  </span>
                </div>
                <CardTitle>{tenant.name}</CardTitle>
                <CardDescription>{tenant.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Cabang</dt>
                    <dd className="font-medium">{tenant.branches}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Status sinkron</dt>
                    <dd className="font-medium">Data sudah aman di cloud</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
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
