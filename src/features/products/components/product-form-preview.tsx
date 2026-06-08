import { formatCurrency } from '@/lib/format-currency'
import { FormSection } from '@/shared/components/forms/form-section'
import type { LocalProduct } from '@/services/local-db/schema'

export function ProductFormPreview({ product }: { product: LocalProduct }) {
  return (
    <div className="grid gap-4">
      <FormSection title="Info dasar" description="Nama, kategori, jenis, dan status produk.">
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Nama: {product.name}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Kategori: {product.category}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Jenis: {product.type}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Status: {product.status}</div>
      </FormSection>
      <FormSection title="Harga & stok" description="Preview harga jual dan data stok saat ini.">
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Harga: {formatCurrency(product.price)}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Stok: {product.type === 'Jasa' ? '-' : `${product.stock} pcs`}</div>
      </FormSection>
    </div>
  )
}
