import { FormSection } from '@/shared/components/forms/form-section'

type ProductRow = {
  id: string
  name: string
  category: string
  type: string
  price: string
  stock: string
  status: string
}

export function ProductFormPreview({ product }: { product: ProductRow }) {
  return (
    <div className="grid gap-4">
      <FormSection title="Info dasar" description="Nama, kategori, jenis, dan status produk.">
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Nama: {product.name}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Kategori: {product.category}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Jenis: {product.type}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Status: {product.status}</div>
      </FormSection>
      <FormSection title="Harga & stok" description="Preview harga jual dan data stok saat ini.">
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Harga: {product.price}</div>
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">Stok: {product.stock}</div>
      </FormSection>
    </div>
  )
}
