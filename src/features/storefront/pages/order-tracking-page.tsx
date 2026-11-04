import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Search, ArrowLeft, ClipboardList, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format-currency'
import { getStore, trackOrders, type TrackedOrder } from '@/features/storefront/api/storefront.api'

type StatusTone = 'green' | 'yellow' | 'red' | 'gray'

function getStatusStyle(status: string): { tone: StatusTone; label: string } {
  const s = status?.toLowerCase() ?? ''
  if (s === 'paid' || s === 'lunas') return { tone: 'green', label: 'Lunas' }
  if (s === 'partial' || s === 'sebagian') return { tone: 'yellow', label: 'Sebagian' }
  if (s === 'unpaid' || s === 'belum bayar' || s === 'pending') return { tone: 'red', label: 'Belum Bayar' }
  if (s === 'cancelled' || s === 'batal') return { tone: 'gray', label: 'Batal' }
  if (s === 'draft') return { tone: 'gray', label: 'Draft' }
  return { tone: 'gray', label: status }
}

const badgeClass: Record<StatusTone, string> = {
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const { tone, label } = getStatusStyle(order.status)
  const identifier = order.code ?? order.orderNumber ?? order.id

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">#{identifier}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(order.date)}</p>
        </div>
        <Badge
          className={`shrink-0 border text-xs font-medium ${badgeClass[tone]}`}
          variant="outline"
        >
          {label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 border-t pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Pesanan</span>
          <span className="font-medium text-gray-900">{formatCurrency(order.grandTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sudah Dibayar</span>
          <span className="font-medium text-green-600">{formatCurrency(order.paidTotal)}</span>
        </div>
        {order.grandTotal - order.paidTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sisa</span>
            <span className="font-medium text-red-600">
              {formatCurrency(order.grandTotal - order.paidTotal)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function OrderTrackingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [phone, setPhone] = useState('')
  const [submittedPhone, setSubmittedPhone] = useState('')

  const { data: store } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: () => getStore(slug!),
    enabled: !!slug,
    retry: false,
  })

  const {
    data: orders,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['public-track-orders', slug, submittedPhone],
    queryFn: () => trackOrders(slug!, submittedPhone),
    enabled: !!slug && !!submittedPhone,
    retry: false,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (!trimmed) return
    setSubmittedPhone(trimmed)
  }

  const hasSearched = !!submittedPhone
  const showEmpty = hasSearched && !isLoading && !isError && (!orders || orders.length === 0)
  const showOrders = hasSearched && !isLoading && orders && orders.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to={`/store/${slug}`} aria-label="Kembali ke toko">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">Lacak Pesanan</h1>
                {store && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <Store className="h-3 w-3 shrink-0" />
                    {store.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="mx-auto max-w-lg px-4 py-6">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm">
          <label htmlFor="phone-input" className="mb-1.5 block text-sm font-medium text-gray-700">
            Nomor HP / WhatsApp
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            Masukkan nomor yang digunakan saat memesan
          </p>
          <div className="flex gap-2">
            <Input
              id="phone-input"
              type="tel"
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
              autoComplete="tel"
            />
            <Button
              type="submit"
              disabled={!phone.trim() || isFetching}
              className="shrink-0"
            >
              {isFetching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Lacak</span>
            </Button>
          </div>
        </form>

        {/* Results */}
        <div className="mt-4">
          {isLoading && (
            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed bg-white">
              <div className="text-center">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Mencari pesanan...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
              <p className="text-sm font-medium text-red-600">Gagal mencari pesanan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Periksa koneksi internet dan coba lagi.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void refetch()}
              >
                Coba lagi
              </Button>
            </div>
          )}

          {showEmpty && (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
              <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-gray-700">Belum ada pesanan ditemukan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tidak ada pesanan untuk nomor <span className="font-medium">{submittedPhone}</span>.
                Pastikan nomor sudah benar.
              </p>
            </div>
          )}

          {showOrders && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {orders.length} pesanan ditemukan untuk{' '}
                <span className="font-medium text-gray-700">{submittedPhone}</span>
              </p>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          Didukung oleh <span className="font-medium text-primary">VitPOS</span>
        </p>
      </div>
    </div>
  )
}
