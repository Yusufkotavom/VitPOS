import { Link } from 'react-router-dom'
import { sidebarNavigation, type NavigationItem } from '@/app/navigation'
import { cn } from '@/lib/utils'

const GROUP_COLORS: Record<string, { bg: string; text: string; iconBg: string }> = {
  'Utama': { bg: 'hover:bg-blue-50', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  'Penjualan': { bg: 'hover:bg-emerald-50', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  'Katalog & Stok': { bg: 'hover:bg-orange-50', text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40' },
  'Relasi Bisnis': { bg: 'hover:bg-indigo-50', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  'Keuangan & Laporan': { bg: 'hover:bg-purple-50', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
  'Sistem': { bg: 'hover:bg-slate-50', text: 'text-slate-600 dark:text-slate-400', iconBg: 'bg-slate-100 dark:bg-slate-800' },
}

const DEFAULT_COLORS = { bg: 'hover:bg-muted/50', text: 'text-primary', iconBg: 'bg-primary/10' }

export function DashboardMenuGrid() {
  return (
    <div className="flex flex-col gap-5">
      {sidebarNavigation.map((group) => {
        // Gabungkan item utama dan anak-anaknya ke dalam 1 baris
        const flatItems = group.items.reduce((acc, item) => {
          if (item.to !== '/') acc.push(item)
          if (item.items) acc.push(...item.items)
          return acc
        }, [] as NavigationItem[])

        if (flatItems.length === 0) return null
        
        const colors = GROUP_COLORS[group.group] || DEFAULT_COLORS

        return (
          <section key={group.group} className="space-y-2.5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.group}</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {flatItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-start gap-1.5 rounded-xl border bg-card p-2 text-center text-card-foreground shadow-sm transition-all active:scale-95',
                    colors.bg
                  )}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", colors.iconBg, colors.text)}>
                    <item.icon className="size-4.5" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight sm:text-[11px] line-clamp-2">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
