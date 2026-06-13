import { PageShell } from '@/shared/components/layout/page-shell'
import { Link } from 'react-router-dom'
import { Building2, FileText, MessageSquare, User, ChevronRight, CreditCard, RefreshCw, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TenantSwitcher } from '@/features/auth/components/tenant-switcher'

const settingsItems = [
  { to: '/settings/company', label: 'Profil Usaha', description: 'Ikon, logo, nama, alamat, dan legalitas usaha', icon: Building2 },
  { to: '/settings/profile', label: 'Profil Pengguna', description: 'Atur nama, kata sandi, dan keamanan akun', icon: User },
  { to: '/settings/invoice', label: 'Invoice & Struk', description: 'Format cetak struk dan faktur pajak', icon: FileText },
  { to: '/settings/templates', label: 'Template WhatsApp', description: 'Pesan otomatis pengingat dan tagihan', icon: MessageSquare },
  { to: '/cash/payment-methods', label: 'Metode Pembayaran', description: 'Kelola channel bayar untuk POS dan invoice', icon: CreditCard },
  { to: '/settings/billing', label: 'Langganan & Tagihan', description: 'Paket aktif, masa berlaku, dan pembayaran langganan', icon: CreditCard },
  { to: '/sync', label: 'Sinkronisasi Data', description: 'Pantau antrian sync, konflik, dan status cloud', icon: RefreshCw },
  { to: '/platform-admin', label: 'Platform Admin', description: 'Akses pengaturan platform untuk admin', icon: Shield },
]

export function SettingsPage() {
  return (
    <PageShell title="Pengaturan" description="Kelola preferensi sistem dan profil usaha Anda.">
      <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Pindah Tenant</p>
            <p className="text-xs text-muted-foreground">Pilih usaha aktif tanpa keluar dari aplikasi.</p>
          </div>
          <TenantSwitcher
            trigger={
              <Button variant="outline" className="justify-between sm:min-w-56">
                Pilih / pindah tenant
                <ChevronRight className="size-4" />
              </Button>
            }
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {settingsItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
