import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  Phone,
  Package,
  ClipboardList,
  Store,
  Plus,
  Minus,
  Search,
  ShoppingBag,
  ArrowRight,
  X,
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format-currency'
import {
  getStore,
  getStoreProducts,
  type CheckoutResponse,
  type StoreProduct,
} from '@/features/storefront/api/storefront.api'
import { StorefrontCartDrawer } from '@/features/storefront/components/storefront-cart-drawer'
import { StorefrontSuccessDialog } from '@/features/storefront/components/storefront-success-dialog'

export function StoreHomePage() {
  const { slug } = useParams<{ slug: string }>()

  const [cart, setCart] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined' || !slug) return {}
    try {
      const saved = localStorage.getItem(`storefront-cart-${slug}`)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [successOrder, setSuccessOrder] = useState<CheckoutResponse | null>(null)

  // Save cart to localStorage
  useEffect(() => {
    if (slug) {
      try {
        localStorage.setItem(`storefront-cart-${slug}`, JSON.stringify(cart))
      } catch {
        // localStorage unavailable
      }
    }
  }, [cart, slug])

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

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase().trim()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)),
    )
  }, [products, searchQuery])

  // Cart item lines
  const cartItems = useMemo(() => {
    const list: Array<{ product: StoreProduct; qty: number }> = []
    for (const [prodId, qty] of Object.entries(cart)) {
      if (qty > 0) {
        const product = products.find((p) => p.id === prodId)
        if (product) {
          list.push({ product, qty })
        }
      }
    }
    return list
  }, [cart, products])

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.qty,
    0,
  )

  function updateQty(productId: string, nextQty: number) {
    setCart((prev) => {
      const copy = { ...prev }
      if (nextQty <= 0) {
        delete copy[productId]
      } else {
        copy[productId] = nextQty
      }
      return copy
    })
  }

  function removeItem(productId: string) {
    setCart((prev) => {
      const copy = { ...prev }
      delete copy[productId]
      return copy
    })
  }

  function clearCart() {
    setCart({})
    if (slug) {
      localStorage.removeItem(`storefront-cart-${slug}`)
    }
  }

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
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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

          {/* CTA & Tracking */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button asChild className="w-full sm:w-auto" variant="outline" size="sm">
              <Link to={`/store/${slug}/track`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Lacak Pesanan Saya
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Product Catalog Section */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">Produk & Menu</h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 rounded-xl bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-gray-700">
              {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk tersedia'}
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Coba gunakan kata kunci pencarian yang lain.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredProducts.map((product) => {
              const qty = cart[product.id] || 0
              const price = Number(product.price) || 0

              return (
                <Card
                  key={product.id}
                  className={`overflow-hidden rounded-2xl border bg-white transition-all shadow-sm ${
                    qty > 0 ? 'border-primary ring-1 ring-primary/30 shadow-md' : 'hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p>
                      )}
                      <p className="mt-1 text-sm font-bold text-primary">
                        {formatCurrency(price)}
                      </p>
                    </div>

                    <div className="mt-3">
                      {qty === 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 rounded-xl text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                          onClick={() => updateQty(product.id, 1)}
                        >
                          <Plus className="mr-1 size-3.5" />
                          Tambah
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl border bg-primary/5 p-1">
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, qty - 1)}
                            className="flex size-7 items-center justify-center rounded-lg bg-white shadow-xs hover:bg-gray-50 active:scale-95 transition-all text-gray-800"
                            aria-label="Kurang satu"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="text-xs font-bold text-primary px-2">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(product.id, qty + 1)}
                            className="flex size-7 items-center justify-center rounded-lg bg-white shadow-xs hover:bg-gray-50 active:scale-95 transition-all text-gray-800"
                            aria-label="Tambah satu"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
          <div className="mx-auto max-w-3xl pointer-events-auto">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-5 py-3.5 text-white shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                  <ShoppingBag className="size-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white shadow">
                    {totalItems}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-300">{totalItems} Produk Dipilih</p>
                  <p className="text-base font-bold text-white">{formatCurrency(totalPrice)}</p>
                </div>
              </div>

              <Button
                size="sm"
                className="rounded-xl px-4 h-10 font-semibold bg-primary hover:bg-primary/90 text-white shadow"
                onClick={() => setIsCartOpen(true)}
              >
                Checkout
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      <StorefrontCartDrawer
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        slug={slug!}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemoveItem={removeItem}
        onCheckoutSuccess={(res) => {
          clearCart()
          setSuccessOrder(res)
        }}
      />

      {/* Success Dialog with WhatsApp redirect button */}
      <StorefrontSuccessDialog
        open={!!successOrder}
        onOpenChange={(open) => {
          if (!open) setSuccessOrder(null)
        }}
        orderData={successOrder}
        slug={slug!}
        onContinueShopping={() => setSuccessOrder(null)}
      />

      {/* Footer */}
      <div className="pb-8 text-center mt-6">
        <p className="text-xs text-muted-foreground">
          Didukung oleh <span className="font-medium text-primary">VitPOS</span>
        </p>
      </div>
    </div>
  )
}
