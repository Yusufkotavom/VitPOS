import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function LandingHero() {
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
          <span className="bg-linear-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
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

        {/* Interactive Feature Visual Preview Mockup */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="relative rounded-2xl border bg-card p-3 sm:p-5 shadow-2xl transition-all">
            {/* Window bar mockup */}
            <div className="flex items-center justify-between border-b pb-3 mb-4 px-2">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-muted-foreground hidden sm:inline">
                  https://vitpos.devk.my.id — KOTACOM Business Suite
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mode Kasir Aktif
                </Badge>
              </div>
            </div>

            {/* Dashboard mini grid mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Card 1: Kasir POS */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Kasir POS Kilat</span>
                  <Printer className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Print Warna A4 (15 lbr)</span>
                    <span>Rp 30.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kertas HVS 70gsm (1 rim)</span>
                    <span>Rp 55.000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-foreground text-sm">
                    <span>Total Pembayaran</span>
                    <span className="text-primary">Rp 85.000</span>
                  </div>
                </div>
                <div className="rounded-lg bg-background p-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" /> Struk Thermal 58mm Otomatis
                </div>
              </div>

              {/* Card 2: Tiket Servis HP & PC */}
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Tiket Servis Ber-QR</span>
                  <Wrench className="size-4 text-primary" />
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground text-sm">SRV-202611-008</p>
                  <p className="text-muted-foreground">iPhone 11 128GB — Ganti LCD + Baterai</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]">
                      Sedang Dikerjakan
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">DP: Rp 200.000</span>
                  </div>
                </div>
                <div className="rounded-lg bg-background p-2 text-[11px] text-primary font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="size-3.5" /> Scan QR untuk Lacak
                  </span>
                  <span className="text-[10px] text-muted-foreground">Garansi 30 Hari</span>
                </div>
              </div>

              {/* Card 3: Portal Lacak Mandiri Pelanggan */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Lacak Mandiri Pelanggan</span>
                  <Clock className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="text-[11px]">Pelanggan scan QR / buka link di HP:</p>
                  <div className="rounded bg-background p-2 text-xs font-mono border">
                    status: <strong className="text-emerald-600">SELESAI SIAP DIAMBIL</strong>
                  </div>
                  <p className="text-[11px]">Sisa tagihan: <strong>Rp 150.000</strong></p>
                </div>
                <div className="rounded-lg bg-background p-2 text-[11px] text-blue-600 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> 80% Kurangi Chat Tanya Status
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
