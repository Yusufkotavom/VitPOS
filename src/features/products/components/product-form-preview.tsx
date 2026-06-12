import { useTranslation } from 'react-i18next'
import { formatCurrency } from '@/lib/format-currency'
import { FormSection } from '@/shared/components/forms/form-section'
import type { LocalProduct } from '@/services/local-db/schema'

export function ProductFormPreview({ product }: { product: LocalProduct }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-4">
      <FormSection title={t('products.basic_info')} description={t('products.basic_info_description')}>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">{t('products.preview_name', { name: product.name })}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">{t('products.preview_category', { category: product.category })}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">{t('products.preview_type', { type: product.type })}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">{t('products.preview_status', { status: product.status })}</div>
      </FormSection>
      <FormSection title={t('products.price_and_stock')} description={t('products.price_and_stock_preview')}>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">{t('products.preview_price', { price: formatCurrency(product.price) })}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">{t('products.preview_stock', { stock: product.type === 'Jasa' ? '-' : `${product.stock} pcs` })}</div>
      </FormSection>
    </div>
  )
}
