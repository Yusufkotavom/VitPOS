export type PdfDocumentType = 'invoice' | 'service' | 'receipt' | 'payment'

export type InvoiceThemeName = 'klasik' | 'korporat' | 'modern' | 'eksekutif'

export const invoiceThemeOptions: { value: InvoiceThemeName; label: string; description: string }[] = [
  { value: 'klasik', label: 'Klasik', description: 'Biru profesional, bersih, dan rapi' },
  { value: 'korporat', label: 'Korporat', description: 'Navyl gelap dengan aksen emas elegan' },
  { value: 'modern', label: 'Modern', description: 'Minimalis dengan aksen teal' },
  { value: 'eksekutif', label: 'Eksekutif', description: 'Burgundy mewah dengan nuansa hangat' },
]

export type PdfCompanySettings = {
  companyName: string
  companyPhone: string
  companyAddress: string
  companyTax: string
  receiptHeader: string
  receiptFooter: string
  invoiceTerm: string
  invoiceTheme: InvoiceThemeName
  invoiceLogo?: string
}

export type PdfLineItem = {
  name: string
  qty: number
  price: number
  subtotal: number
}

export type PdfCustomer = {
  name: string
  phone?: string
}

export type PdfSummary = {
  subtotal: number
  discount: number
  grandTotal: number
  paidTotal: number
  change?: number
  status: string
}

export type PdfPaymentRow = {
  method: string
  amount: number
  date: string
}

export type PdfWarrantyInfo = {
  value: number
  unit: string
  isExpired: boolean
  endDate: string
}

export type PdfInvoiceData = {
  type: 'invoice'
  code: string
  date: string
  customer: PdfCustomer
  items: PdfLineItem[]
  summary: PdfSummary
  notes: string
  payments?: PdfPaymentRow[]
}

export type PdfServiceData = {
  type: 'service'
  code: string
  date: string
  customer: PdfCustomer
  device: string
  problem: string
  cost: number
  summary: PdfSummary
  items?: PdfLineItem[]
  warranty?: PdfWarrantyInfo
  payments?: PdfPaymentRow[]
}

export type PdfReceiptData = {
  type: 'receipt'
  code: string
  date: string
  cashierName: string
  customer: PdfCustomer
  items: PdfLineItem[]
  summary: PdfSummary
  paymentMethod: string
}

export type PdfPaymentData = {
  type: 'payment'
  ref: string
  date: string
  customer: PdfCustomer
  invoiceCode: string
  method: string
  amount: number
  invoiceTotal: number
  status: string
}

export type PdfData = PdfInvoiceData | PdfServiceData | PdfReceiptData | PdfPaymentData

export const labels = {
  invoice: 'INVOICE',
  service: 'SERVICE ORDER',
  receipt: 'STRUK',
  payment: 'BUKTI PEMBAYARAN',
  date: 'Tanggal',
  status: 'Status',
  customer: 'Pelanggan',
  item: 'Item',
  qty: 'Qty',
  price: 'Harga',
  subtotal: 'Subtotal',
  total: 'Total',
  paidAmount: 'Dibayar',
  remainingAmount: 'Sisa',
  discount: 'Diskon',
  paid: 'Lunas',
  unpaid: 'Belum Bayar',
  partial: 'Sebagian',
  companyDetails: 'Detail Perusahaan',
  thankYou: 'Terima kasih atas kepercayaan Anda.',
  notes: 'Catatan',
  paymentMethod: 'Pembayaran',
  cashier: 'Kasir',
  device: 'Perangkat',
  problem: 'Kerusakan',
  cost: 'Biaya',
  change: 'Kembali',
}
