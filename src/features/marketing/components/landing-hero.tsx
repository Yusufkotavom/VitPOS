import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Wrench,
  BarChart3,
  Boxes,
  Globe,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PREVIEWS = [
  {
    id: 'pos',
    label: 'Kasir POS Kilat',
    icon: ShoppingBag,
    image: '/images/landing/pos-screen.png',
    badge: '3-5 Tap Checkout • Multi-Payment • Struk Thermal',
    description: 'Antarmuka kasir cepat dengan pencarian barcode, kalkulasi otomatis, split payment, dan cetak struk nota instan.',
  },
  {
    id: 'service',
    label: 'Tiket & Service Order',
    icon: Wrench,
    image: '/images/landing/service-orders.png',
    badge: 'Tiket QR Code • Status Timeline • Garansi Toko',
    description: 'Catat keluhan, pemakaian suku cadang, teknisi yang bertugas, dan pantau status servis dari diterima hingga diambil.',
  },
  {
    id: 'reports',
    label: 'Laporan Penjualan & Service',
    icon: BarChart3,
    image: '/images/landing/sales-reports.png',
    badge: 'Omzet POS + Service • Tab Transaksi • Export CSV',
    description: 'Analisis omzet gabungan penjualan barang dan jasa servis dalam satu laporan terpadu realtime.',
  },
  {
    id: 'inventory',
    label: 'Stok & Sparepart',
    icon: Boxes,
    image: '/images/landing/products-inventory.png',
    badge: 'Peringatan Stok Tipis • Riwayat Mutasi • Multi-Gudang',
    description: 'Kendalikan persediaan suku cadang LCD, baterai, tinta printer, dan kertas dengan alert stok otomatis.',
  },
  {
    id: 'storefront',
    label: 'Toko Online & Lacak Servis',
    icon: Globe,
    image: '/images/landing/storefront.png',
    badge: 'Katalog Publik • Order WA • Lacak Status Mandiri',
    description: 'Etalase online untuk pelanggan memesan barang dan memindai QR nota untuk cek status pengerjaan servis secara live.',
  },
]

export function LandingHero() {
  const [activeTab, setActiveTab] = useState(PREVIEWS[0].id)
  const activePreview = PREVIEWS.find((p) => p.id === activeTab) ?? PREVIEWS[0]

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Top announcement badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10">
          <Sparkles className="size-3.5 text-primary" />
          <span>Sistem Bisnis No. 1 Khusus Usaha Jasa & Servis</span>
          <span className="text-muted-foreground">|</span>
          <span className="font-normal text-muted-foreground">Offline-First Hybrid</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-6xl max-w-4xl mx-auto leading-[1.15]">
          Bukan Sekadar Kasir.{' '}
          <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Pusat Kendali Servis, Cetak & Keuangan
          </span>{' '}
          Toko Anda.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
          Dirancang khusus untuk <strong>Toko Servis HP, Laptop, Komputer, dan Percetakan Digital</strong>.
          Lengkap dengan kasir kilat, tiket servis ber-QR, lacak pesanan live oleh pelanggan,
          manajemen sparepart, hingga laporan laba rugi otomatis.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto h-12 px-7 text-base shadow-md gap-2">
            <Link to="/register">
              Mulai Coba Gratis 14 Hari
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-base">
            <Link to="/help">
              Pelajari Panduan Alur
            </Link>
          </Button>
        </div>

        {/* Key value checklist */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Tetap berfungsi saat internet mati</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Pelanggan lacak status via web tanpa login</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Cetak struk thermal 58/80mm & invoice A4</span>
          </div>
        </div>

        {/* Interactive Real Screenshot Preview Window */}
        <div className="pt-8 max-w-5xl mx-auto space-y-4">
          {/* Interactive Navigation Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
            {PREVIEWS.map((tab) => {
              const Icon = tab.icon
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Browser Window Frame with Real Screenshot */}
          <div className="relative rounded-2xl border bg-card p-2 sm:p-4 shadow-2xl transition-all">
            {/* Window bar mockup */}
            <div className="flex items-center justify-between border-b pb-3 mb-3 px-2">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-muted-foreground hidden sm:inline">
                  https://vitpos.devk.my.id — {activePreview.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activePreview.badge}
                </Badge>
              </div>
            </div>

            {/* Real Application Screenshot Image */}
            <div className="relative group overflow-hidden rounded-xl border bg-muted/40 aspect-[16/10] sm:aspect-[16/9]">
              <img
                src={activePreview.image}
                alt={`Screenshot ${activePreview.label} VitPOS`}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="text-left text-white space-y-1">
                  <p className="font-semibold text-sm sm:text-base flex items-center gap-1.5">
                    <Maximize2 className="size-4" />
                    Tampilan Nyata {activePreview.label}
                  </p>
                  <p className="text-xs text-white/80 max-w-2xl">
                    {activePreview.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Caption bar underneath */}
            <div className="pt-3 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground text-left">
              <p>
                💡 <strong className="text-foreground">{activePreview.label}:</strong> {activePreview.description}
              </p>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0">
                <Link to="/register">
                  Coba Fitur Ini
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
