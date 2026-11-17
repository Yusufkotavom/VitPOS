import {
  Banknote,
  CreditCard,
  Landmark,
  QrCode,
  Smartphone,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

type PaymentMethodDisplay = {
  icon: LucideIcon
  tone: string
}

const displayMap: Record<string, PaymentMethodDisplay> = {
  tunai: { icon: Banknote, tone: 'text-emerald-600' },
  cash: { icon: Banknote, tone: 'text-emerald-600' },
  qris: { icon: QrCode, tone: 'text-indigo-600' },
  kartu: { icon: CreditCard, tone: 'text-sky-600' },
  card: { icon: CreditCard, tone: 'text-sky-600' },
  transfer: { icon: Landmark, tone: 'text-blue-600' },
  bank: { icon: Landmark, tone: 'text-blue-600' },
  ewallet: { icon: Smartphone, tone: 'text-violet-600' },
  'e-wallet': { icon: Smartphone, tone: 'text-violet-600' },
  piutang: { icon: Wallet, tone: 'text-amber-600' },
  kredit: { icon: Wallet, tone: 'text-amber-600' },
}

export function getPaymentMethodDisplay(methodId: string, methodName?: string): PaymentMethodDisplay {
  const candidates = [methodId, methodName]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase().replace(/\s+/g, ''))

  for (const candidate of candidates) {
    if (displayMap[candidate]) return displayMap[candidate]
    const partial = Object.keys(displayMap).find((key) => candidate.includes(key))
    if (partial) return displayMap[partial]
  }

  return { icon: Wallet, tone: 'text-muted-foreground' }
}

export function buildQuickCashOptions(total: number): number[] {
  if (total <= 0) return []

  const rounded = [5000, 10000, 20000, 50000, 100000]
  const exact = Math.ceil(total)
  const nextRound = rounded
    .map((step) => Math.ceil(total / step) * step)
    .filter((value) => value > total)

  const options = [...new Set([exact, ...nextRound])]
  return options.slice(0, 4)
}
