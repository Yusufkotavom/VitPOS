import { PageShell } from '@/shared/components/layout/page-shell'
import { Link } from 'react-router-dom'
import { Building2, FileText, MessageSquare, User, ChevronRight } from 'lucide-react'

const settingsItems = [
  { to: '/settings/company', label: 'Profil Usaha', description: 'Ikon, logo, nama, alamat, dan legalitas usaha', icon: Building2 },
  { to: '/settings/profile', label: 'Profil Pengguna', description: 'Atur nama, kata sandi, dan keamanan akun', icon: User },
  { to: '/settings/invoice', label: 'Invoice & Struk', description: 'Format cetak struk dan faktur pajak', icon: FileText },
  { to: '/settings/templates', label: 'Template WhatsApp', description: 'Pesan otomatis pengingat dan tagihan', icon: MessageSquare },
]

export function SettingsPage() {
  return (
    <PageShell title="Pengaturan" description="Kelola preferensi sistem dan profil usaha Anda.">
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
