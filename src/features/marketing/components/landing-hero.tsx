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
  Monitor,
  Smartphone,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PREVIEWS = [
  {
    id: 'pos',
    label: 'Kasir POS Kilat',
    icon: ShoppingBag,
    desktopImage: '/images/landing/pos-desktop.png',
    mobileImage: '/images/landing/pos-mobile.png',
    badge: '3-5 Tap Checkout • Multi-Payment • Struk Thermal',
    description: 'Antarmuka kasir cepat dengan pencarian barcode, katalog sparepart & jasa, kalkulasi otomatis, split payment, dan cetak struk nota instan.',
  },
  {
    id: 'service',
    label: 'Tiket & Service Order',
    icon: Wrench,
    desktopImage: '/images/landing/service-orders-desktop.png',
    mobileImage: '/images/landing/service-orders-mobile.png',
    badge: 'Tiket QR Code • Status Timeline • Garansi Toko',
    description: 'Catat keluhan, pemakaian suku cadang, teknisi yang bertugas, dan pantau status servis dari diterima hingga diambil pelanggan.',
  },
  {
    id: 'reports',
    label: 'Laporan Penjualan & Service',
    icon: BarChart3,
    desktopImage: '/images/landing/sales-reports-desktop.png',
    mobileImage: '/images/landing/sales-reports-mobile.png',
    badge: 'Omzet POS + Service • Tab Transaksi • Export CSV',
    description: 'Analisis omzet gabungan penjualan barang ritel dan jasa servis dalam satu laporan terpadu realtime dengan chart dinamis.',
  },
  {
    id: 'inventory',
    label: 'Stok & Sparepart',
    icon: Boxes,
    desktopImage: '/images/landing/products-inventory-desktop.png',
    mobileImage: '/images/landing/products-inventory-mobile.png',
    badge: 'Peringatan Stok Tipis • Riwayat Mutasi • Multi-Gudang',
    description: 'Kendalikan persediaan suku cadang LCD, baterai, SSD, RAM, tinta printer, dan kertas dengan alert stok menipis otomatis.',
  },
  {
    id: 'storefront',
    label: 'Toko Online & Lacak Servis',
    icon: Globe,
    desktopImage: '/images/landing/storefront-desktop.png',
    mobileImage: '/images/landing/storefront-mobile.png',
    badge: 'Katalog Publik • Order WA • Lacak Status Mandiri',
    description: 'Etalase online untuk pelanggan memesan barang dan memindai QR nota untuk cek status pengerjaan servis secara mandiri.',
  },
]

export function LandingHero() {
  const [activeTab, setActiveTab] = useState(PREVIEWS[0].id)
  const [viewMode, setViewMode] = useState<'record' | 'desktop' | 'mobile'>('record')
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
          Lengkap dengan simulasi transaksi nyata, tiket servis ber-QR, lacak live oleh pelanggan,
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
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-base gap-2 border-primary/30 text-primary hover:bg-primary/5">
            <Link to="/login">
              <Sparkles className="size-4" />
              Coba Akun Demo Langsung
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto h-12 px-5 text-base">
            <Link to="/help">
              Panduan Alur
            </Link>
          </Button>
        </div>

        {/* Key value checklist */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Simulasi data nyata siap pakai</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Tetap berfungsi saat internet mati</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Pelanggan lacak servis tanpa login</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Struk thermal 58/80mm & Invoice A4</span>
          </div>
        </div>

        {/* Interactive Showcase Box with Mode Switcher & Module Pills */}
        <div className="pt-8 max-w-5xl mx-auto space-y-4">
          {/* Top Switcher: Record vs Desktop vs Mobile */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-muted/80 backdrop-blur rounded-2xl w-fit mx-auto border shadow-sm">
            <button
              onClick={() => setViewMode('record')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'record'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Play className="size-3.5 fill-current" />
              <span>Rekaman Interaktif (Live Demo)</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'desktop'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="size-3.5" />
              <span>Tampilan Desktop</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Tampilan HP (Mobile)</span>
            </button>
          </div>

          {/* Module Selection Pills (Active in Desktop & Mobile modes) */}
          {viewMode !== 'record' && (
            <div className="flex flex-wrap items-center justify-center gap-2 pb-1 animate-in fade-in duration-300">
              {PREVIEWS.map((tab) => {
                const Icon = tab.icon
                const isActive = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border'
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Showcase Display Container */}
          <div className="relative rounded-2xl border bg-card p-3 sm:p-5 shadow-2xl transition-all">
            {/* Window bar mockup */}
            <div className="flex items-center justify-between border-b pb-3 mb-3 px-2">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-muted-foreground hidden sm:inline">
                  https://vitpos.devk.my.id — {viewMode === 'record' ? 'Demo Alur Kasir & Servis Nyata' : activePreview.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {viewMode === 'record' ? 'Simulasi Rekaman Nyata • Kasir, Servis, Laporan' : activePreview.badge}
                </Badge>
              </div>
            </div>

            {/* Content Area Based on Mode */}
            {viewMode === 'record' ? (
              /* Video Walkthrough Player */
              <div className="relative overflow-hidden rounded-xl border bg-black aspect-[16/9] shadow-inner group">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  poster="/images/landing/pos-desktop.png"
                >
                  <source src="/images/landing/demo-walkthrough.mp4" type="video/mp4" />
                  <source src="/images/landing/demo-walkthrough.webm" type="video/webm" />
                  <img
                    src="/images/landing/demo-walkthrough.gif"
                    alt="Rekaman Demo Interaktif VitPOS"
                    className="w-full h-full object-cover"
                  />
                </video>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs flex items-center gap-2 pointer-events-none">
                  <span className="size-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-semibold">LIVE SCREEN RECORD</span>
                  <span className="text-white/60">• Alur Transaksi & Tiket Servis Nyata</span>
                </div>
              </div>
            ) : viewMode === 'desktop' ? (
              /* Desktop Screenshot */
              <div className="relative group overflow-hidden rounded-xl border bg-muted/40 aspect-[16/10] sm:aspect-[16/9]">
                <img
                  src={activePreview.desktopImage}
                  alt={`Screenshot Desktop ${activePreview.label} VitPOS`}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="text-left text-white space-y-1">
                    <p className="font-semibold text-sm sm:text-base flex items-center gap-1.5">
                      <Maximize2 className="size-4" />
                      Tampilan Desktop: {activePreview.label}
                    </p>
                    <p className="text-xs text-white/80 max-w-2xl">
                      {activePreview.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile / Smartphone Phone Frame View */
              <div className="py-6 flex flex-col items-center justify-center bg-muted/20 rounded-xl">
                <div className="relative w-[290px] sm:w-[320px] aspect-[9/19.5] rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-900 p-1.5 shadow-2xl overflow-hidden ring-1 ring-border">
                  {/* Dynamic Island / Speaker notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                    <div className="size-2 rounded-full bg-slate-950/80 mr-2" />
                    <div className="size-1 rounded-full bg-blue-500/50" />
                  </div>
                  {/* Mobile Screen Image */}
                  <div className="w-full h-full rounded-[2rem] overflow-hidden bg-background">
                    <img
                      src={activePreview.mobileImage}
                      alt={`Screenshot Mobile HP ${activePreview.label} VitPOS`}
                      className="w-full h-full object-cover object-top"
                      loading="eager"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 font-medium">
                  📱 Tampilan smartphone responsif: alur ringkas, card list teratur, dan navigasi cepat.
                </p>
              </div>
            )}

            {/* Caption bar underneath */}
            <div className="pt-3.5 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground text-left">
              <p>
                💡 <strong className="text-foreground">{viewMode === 'record' ? 'Rekaman Demo Interaktif' : activePreview.label}:</strong>{' '}
                {viewMode === 'record'
                  ? 'Melihat langsung kecepatan input barcode, pencarian sparepart, perhitungan kembalian, dan update status tiket pengerjaan teknisi.'
                  : activePreview.description}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Link to="/login">
                    <Sparkles className="size-3 text-primary" />
                    Buka Akun Demo
                  </Link>
                </Button>
                <Button asChild size="sm" className="h-7 text-xs gap-1">
                  <Link to="/register">
                    Coba Gratis
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
