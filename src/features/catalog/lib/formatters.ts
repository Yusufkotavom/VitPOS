export function formatRupiahFromNumber(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatUnits(value: number, suffix: string) {
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)} ${suffix}`
}

export function parseDigits(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}
