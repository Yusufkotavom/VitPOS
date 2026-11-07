import { Link } from 'react-router-dom'
import { Building2, MessageCircle } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/40 py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground">KOTACOM</span>
              <span className="text-xs text-muted-foreground ml-2">Business Suite</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
            <a href="#solusi" className="hover:text-foreground transition-colors">
              Solusi Jasa
            </a>
            <a href="#fitur" className="hover:text-foreground transition-colors">
              Fitur
            </a>
            <a href="#harga" className="hover:text-foreground transition-colors">
              Harga Paket
            </a>
            <Link to="/help" className="hover:text-foreground transition-colors font-medium text-primary">
              Pusat Panduan
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Masuk Kasir
            </Link>
            <Link to="/register" className="hover:text-foreground transition-colors">
              Daftar Toko
            </Link>
          </div>

          <div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20KOTACOM%2C%20saya%20tertarik%20dengan%20sistem%20bisnis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 transition-colors"
            >
              <MessageCircle className="size-3.5 text-emerald-500" />
              <span>WhatsApp CS: 0812-3456-7890</span>
            </a>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} KOTACOM Business Suite. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibangun dengan teknologi Offline-First untuk kemajuan UMKM Indonesia
          </p>
        </div>
      </div>
    </footer>
  )
}
