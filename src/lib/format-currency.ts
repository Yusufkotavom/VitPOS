export function formatCurrency(value: unknown) {
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value
  const safeValue = typeof numValue === 'number' && Number.isFinite(numValue) ? numValue : 0

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safeValue).replace(/\u00a0/g, ' ')
}

export function formatNumber(value: unknown) {
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value
  const safeValue = typeof numValue === 'number' && Number.isFinite(numValue) ? numValue : 0

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(safeValue)
}
