import type {
  JobLineKind,
  JobLinePriceMode,
  LocalJobLine,
  LocalProduct,
  LocalServiceOrder,
} from '@/services/local-db/schema'

export type JobLineDraft = {
  source: LocalJobLine['source']
  kind: JobLineKind
  productId?: string
  name: string
  unit: string
  qty: number
  priceMode: JobLinePriceMode
  unitPrice: number
  width?: number
  height?: number
  costPrice?: number
  note?: string
  trackStock: boolean
}

export function computeJobLineSubtotal(line: Pick<JobLineDraft, 'priceMode' | 'qty' | 'unitPrice' | 'width' | 'height'>): number {
  const qty = Number.isFinite(line.qty) ? line.qty : 0
  const price = Number.isFinite(line.unitPrice) ? line.unitPrice : 0

  if (line.priceMode === 'area') {
    const width = Number.isFinite(line.width) ? Number(line.width) : 0
    const height = Number.isFinite(line.height) ? Number(line.height) : 0
    return Math.round(qty * width * height * price)
  }

  return Math.round(qty * price)
}

export function createJobLine(draft: Partial<JobLineDraft> & Pick<JobLineDraft, 'name'>): LocalJobLine {
  const base: JobLineDraft = {
    source: draft.source ?? 'custom',
    kind: draft.kind ?? 'service',
    productId: draft.productId,
    name: draft.name,
    unit: draft.unit ?? 'pcs',
    qty: draft.qty ?? 1,
    priceMode: draft.priceMode ?? 'unit',
    unitPrice: draft.unitPrice ?? 0,
    width: draft.width,
    height: draft.height,
    costPrice: draft.costPrice,
    note: draft.note,
    trackStock: draft.trackStock ?? false,
  }

  return {
    id: draft.productId ? `line-${draft.productId}` : `line-${crypto.randomUUID()}`,
    source: base.source,
    kind: base.kind,
    productId: base.productId,
    name: base.name.trim(),
    unit: base.unit,
    qty: base.qty,
    priceMode: base.priceMode,
    unitPrice: base.unitPrice,
    width: base.width,
    height: base.height,
    costPrice: base.costPrice,
    note: base.note,
    trackStock: base.trackStock,
    subtotal: computeJobLineSubtotal(base),
  }
}

export function jobLineFromProduct(product: LocalProduct, qty = 1): LocalJobLine {
  const isService = product.type === 'Jasa'
  const tracksStock = !isService && product.manageStock !== false

  return createJobLine({
    source: 'catalog',
    kind: isService ? 'service' : 'product',
    productId: product.id,
    name: product.name,
    unit: product.unit ?? (isService ? 'unit' : 'pcs'),
    qty,
    priceMode: 'unit',
    unitPrice: product.price,
    costPrice: product.costPrice,
    trackStock: tracksStock,
  })
}

export function jobLineToLegacyItem(line: LocalJobLine) {
  return {
    productId: line.productId ?? line.id,
    name: line.name,
    qty: line.qty,
    price: line.unitPrice,
    costPrice: line.costPrice,
    subtotal: line.subtotal,
  }
}

export function sumJobLines(lines: LocalJobLine[]): number {
  return lines.reduce((total, line) => total + line.subtotal, 0)
}

export function sumJobLineCost(lines: LocalJobLine[]): number {
  return lines.reduce((total, line) => total + (line.costPrice ?? 0) * line.qty, 0)
}

/**
 * Only catalog products that actually manage stock may move inventory.
 * Catalog services and free-form custom lines never touch stock.
 */
export function isStockTrackedLine(line: LocalJobLine): boolean {
  return line.source === 'catalog' && line.kind === 'product' && line.trackStock
}

export function normalizeJobLines(order: Pick<LocalServiceOrder, 'lines' | 'items'>): LocalJobLine[] {
  if (order.lines && order.lines.length > 0) return order.lines

  return (order.items ?? []).map((item) =>
    createJobLine({
      source: 'catalog',
      kind: 'product',
      productId: item.productId,
      name: item.name,
      unit: 'pcs',
      qty: item.qty,
      unitPrice: item.price,
      costPrice: item.costPrice,
      trackStock: true,
    }),
  )
}

export function validateJobLines(lines: LocalJobLine[]): string | null {
  if (lines.length === 0) return 'Tambahkan minimal satu item pekerjaan'

  const emptyName = lines.find((line) => !line.name.trim())
  if (emptyName) return 'Nama item tidak boleh kosong'

  const invalidQty = lines.find((line) => !Number.isFinite(line.qty) || line.qty <= 0)
  if (invalidQty) return 'Jumlah item harus lebih dari 0'

  const invalidPrice = lines.find((line) => !Number.isFinite(line.unitPrice) || line.unitPrice < 0)
  if (invalidPrice) return 'Harga item tidak valid'

  const invalidArea = lines.find(
    (line) => line.priceMode === 'area' && (!line.width || !line.height || line.width <= 0 || line.height <= 0),
  )
  if (invalidArea) return 'Ukuran panjang dan lebar wajib diisi untuk item berbasis area'

  return null
}
