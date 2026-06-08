import { PaymentMethodCrudActions } from '@/features/settings/components/payment-method-crud-actions'
import { usePaymentMethods } from '@/features/settings/hooks/use-payment-methods'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'

export function PaymentMethodsPage() {
  const paymentMethods = usePaymentMethods()

  return (
    <PageShell title="Metode Pembayaran" description="Daftar channel pembayaran aktif untuk POS dan Invoice." actions={<PaymentMethodCrudActions />}>
      <ContentCard title="Daftar Metode" description="Tentukan tipe kas/bank yang dapat digunakan.">
        <DataTable
          data={paymentMethods || []}
          columns={[
            { key: 'name', header: 'Nama' },
            { key: 'provider', header: 'Provider' },
            { key: 'type', header: 'Tipe' },
            { key: 'accountNumber', header: 'Nomor Rekening/Akun' },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge label={row.status} tone={row.status === 'Aktif' ? 'success' : 'neutral'} /> },
            { key: 'actions', header: 'Aksi', render: (row) => <PaymentMethodCrudActions paymentMethod={row} /> },
          ]}
          mobileRender={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.provider} - {row.type}</p>
                </div>
                <StatusBadge label={row.status} tone={row.status === 'Aktif' ? 'success' : 'neutral'} />
              </div>
              <PaymentMethodCrudActions paymentMethod={row} />
            </div>
          )}
        />
      </ContentCard>
    </PageShell>
  )
}
