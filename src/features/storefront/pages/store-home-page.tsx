import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, Package, ClipboardList, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format-currency'
import { getStore, getStoreProducts } from '@/features/storefront/api/storefront.api'

export function StoreHomePage() {
  const { slug } = useParams<{ slug: string }>()

  const {
    data: store,
    isLoading: storeLoading,
    isError: storeError,
  } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: () => getStore(slug!),
    enabled: !!slug,
    retry: false,
  })

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['public-store-products', slug],
    queryFn: () => getStoreProducts(slug!),
    enabled: !!slug && !!store,
  })

  const isLoading = storeLoading || productsLoading

  if (storeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat toko...</p>
        </div>
      </div>
    )
  }

  if (storeError || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold text-gray-800">Toko tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Alamat toko ini tidak valid atau sudah tidak aktif.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-4">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-16 w-16 rounded-2xl object-cover shadow"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow">
                <Store className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{store.name}</h1>
              {store.description && (
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                  {store.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                {store.address && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">{store.address}</span>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-5">
            <Button asChild className="w-full sm:w-auto" variant="outline">
              <Link to={`/store/${slug}/track`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Lacak Pesanan Saya
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-800">Produk Tersedia</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Belum ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden rounded-2xl border-0 shadow-sm">
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-800">
                    {product.name}
                  </p>
                  {product.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p>
                  )}
                  <p className="mt-1.5 text-sm font-bold text-primary">
                    {formatCurrency(product.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          Didukung oleh{' '}
          <span className="font-medium text-primary">VitPOS</span>
        </p>
      </div>
    </div>
  )
}
