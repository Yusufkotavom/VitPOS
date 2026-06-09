import { Link } from 'react-router-dom'
import { Calculator, Package, Users, FileText, Wallet, Settings, LayoutDashboard, ShoppingCart } from 'lucide-react'

const MENU_ITEMS = [
  { label: 'Kasir POS', icon: Calculator, href: '/pos', color: 'bg-orange-100 text-orange-600' },
  { label: 'Produk', icon: Package, href: '/products', color: 'bg-blue-100 text-blue-600' },
  { label: 'Pelanggan', icon: Users, href: '/customers', color: 'bg-green-100 text-green-600' },
  { label: 'Pesanan', icon: ShoppingCart, href: '/sales-orders', color: 'bg-purple-100 text-purple-600' },
  { label: 'Kas & Bank', icon: Wallet, href: '/cash', color: 'bg-teal-100 text-teal-600' },
  { label: 'Laporan', icon: FileText, href: '/reports', color: 'bg-rose-100 text-rose-600' },
  { label: 'Pengaturan', icon: Settings, href: '/settings', color: 'bg-slate-100 text-slate-600' },
  { label: 'Lainnya', icon: LayoutDashboard, href: '/', color: 'bg-gray-100 text-gray-600' },
]

export function QuickActions() {
  return (
    <article className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="group flex flex-col items-center gap-2 text-center transition-transform active:scale-95"
          >
            <div className={`flex size-14 items-center justify-center rounded-2xl transition-all group-hover:shadow-md ${item.color}`}>
              <item.icon className="size-6" />
            </div>
            <span className="text-[11px] font-medium leading-tight text-foreground/80 group-hover:text-foreground">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </article>
  )
}
