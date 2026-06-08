import { Button } from '@/components/ui/button'
import { HeldSaleBanner } from '@/features/pos/components/held-sale-banner'
import { PosSummaryStrip } from '@/features/pos/components/pos-summary-strip'
import { useSyncStore } from '@/features/sync/stores/sync-store'
import { CartPanel } from '@/features/pos/components/cart-panel'
import { CategoryTabs } from '@/features/pos/components/category-tabs'
import { PaymentSummary } from '@/features/pos/components/payment-summary'
import { ProductGrid } from '@/features/pos/components/product-grid'
import { ProductSearch } from '@/features/pos/components/product-search'
import { selectPosTotals, usePosStore } from '@/features/pos/stores/pos-store'
import { formatCurrency } from '@/lib/format-currency'
import { ContentCard } from '@/shared/components/display/content-card'
import { PageShell } from '@/shared/components/layout/page-shell'
import { SyncStatusBadge } from '@/shared/components/sync/sync-status-badge'

export function PosPage() {
  const syncSummary = useSyncStore()
  const totals = selectPosTotals(usePosStore())
  const hasItems = totals.itemCount > 0

  return (
    <PageShell
      title="POS"
      description="Layar kasir cepat, touch friendly, siap untuk flow 3–5 tap."
      actions={
        <>
          <SyncStatusBadge summary={syncSummary} />
          <Button variant="outline" disabled={!hasItems}>Simpan Draft</Button>
          <Button disabled={!hasItems}>Bayar {hasItems ? formatCurrency(totals.total) : ''}</Button>
        </>
      }
    >
      <PosSummaryStrip itemCount={totals.itemCount} subtotal={totals.subtotal} total={totals.total} />
      <HeldSaleBanner visible={hasItems && syncSummary.pendingCount > 0} />
      <div className="grid gap-4 pb-24 xl:grid-cols-[minmax(0,1fr)_400px] xl:pb-0">
        <ContentCard
          title="Katalog Produk"
          description="Cari cepat, pilih kategori, lalu tap produk untuk tambah ke keranjang."
          className="min-w-0"
        >
          <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b bg-background/95 px-5 py-4 backdrop-blur xl:static xl:-mx-0 xl:-mt-0 xl:border-0 xl:bg-transparent xl:p-0">
              <div className="flex flex-col gap-3">
                <ProductSearch />
                <CategoryTabs />
              </div>
            </div>
            <ProductGrid />
          </div>
        </ContentCard>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-20 xl:h-fit">
          <ContentCard title="Keranjang" description={`${totals.itemCount} item di transaksi aktif`}>
            <CartPanel />
          </ContentCard>
          <ContentCard title="Pembayaran" description="Pilih metode bayar dan cek total transaksi.">
            <PaymentSummary />
          </ContentCard>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 shadow-lg backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-screen-sm items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Total bayar</p>
            <p className="truncate text-lg font-semibold">{formatCurrency(totals.total)}</p>
          </div>
          <Button className="h-11 min-w-32" disabled={!hasItems}>Bayar</Button>
        </div>
      </div>
    </PageShell>
  )
}
