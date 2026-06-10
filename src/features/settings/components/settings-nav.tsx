import { NavLink } from 'react-router-dom'
import { Building2, CreditCard, FileText, MessageSquare, User } from 'lucide-react'

const settingTabs = [
  { to: '/settings', label: 'Usaha', icon: Building2 },
  { to: '/settings/profile', label: 'Profil', icon: User },
  { to: '/settings/invoice', label: 'Invoice', icon: FileText },
  { to: '/settings/billing', label: 'Langganan', icon: CreditCard },
  { to: '/settings/templates', label: 'Template WA', icon: MessageSquare },
] as const

export function SettingsNav({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ''}`}>
      {settingTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/settings'}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <tab.icon className="size-4" />
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
