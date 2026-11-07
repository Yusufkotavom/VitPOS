import { Link } from 'react-router-dom'
import { Building2, Sparkles, BookOpen, LogIn, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function LandingNavbar() {
  const { currentUser } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Building2 className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground leading-none">KOTACOM</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
              Business Suite
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#solusi" className="hover:text-foreground transition-colors">
            Solusi Servis & Print
          </a>
          <a href="#fitur" className="hover:text-foreground transition-colors">
            Fitur Unggulan
          </a>
          <a href="#harga" className="hover:text-foreground transition-colors">
            Harga Paket
          </a>
          <Link to="/help" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <BookOpen className="size-3.5 text-primary" />
            Panduan & Bantuan
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <Button asChild size="sm" className="gap-2">
              <Link to="/dashboard">
                Buka Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
                <Link to="/login">
                  <LogIn className="size-3.5" />
                  Masuk
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5 shadow-xs">
                <Link to="/register">
                  <Sparkles className="size-3.5 text-amber-300" />
                  Coba Gratis 14 Hari
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
