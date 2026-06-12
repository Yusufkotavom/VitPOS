import { useTranslation } from 'react-i18next'
import type { LocalProduct } from '@/services/local-db/schema'

export function ProductStatusSummary({ products }: { products: LocalProduct[] }) {
  const { t } = useTranslation()
  const activeCount = products.filter((product) => product.status === 'Aktif').length
  const serviceCount = products.filter((product) => product.type === 'Jasa').length
  const lowStockCount = products.filter((product) => product.type !== 'Jasa' && product.stock <= 10).length

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">{t('common.active')}</p>
        <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">{t('products.type_service')}</p>
        <p className="mt-2 text-2xl font-semibold">{serviceCount}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">{t('products.low_stock')}</p>
        <p className="mt-2 text-2xl font-semibold">{lowStockCount}</p>
      </article>
    </section>
  )
}
