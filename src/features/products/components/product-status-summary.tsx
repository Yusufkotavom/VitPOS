type ProductRow = {
  id: string
  name: string
  category: string
  type: string
  price: string
  stock: string
  status: string
}

function parseStock(stock: string) {
  const match = stock.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export function ProductStatusSummary({ products }: { products: ProductRow[] }) {
  const activeCount = products.filter((product) => product.status === 'Aktif').length
  const serviceCount = products.filter((product) => product.type === 'Jasa').length
  const lowStockCount = products.filter((product) => product.type !== 'Jasa' && parseStock(product.stock) <= 10).length

  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Produk aktif</p>
        <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Produk jasa</p>
        <p className="mt-2 text-2xl font-semibold">{serviceCount}</p>
      </article>
      <article className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Stok rendah</p>
        <p className="mt-2 text-2xl font-semibold">{lowStockCount}</p>
      </article>
    </section>
  )
}
