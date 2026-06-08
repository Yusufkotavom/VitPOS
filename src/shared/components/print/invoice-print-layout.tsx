import { useLiveQuery } from 'dexie-react-hooks'
import { formatCurrency } from '@/lib/format-currency'
import { localDb } from '@/services/local-db/client'
import { type LocalSalesOrder, type LocalServiceOrder } from '@/services/local-db/schema'

export function InvoicePrintLayout({
  order,
  type = 'sale',
}: {
  order: LocalSalesOrder | LocalServiceOrder | null
  type?: 'sale' | 'service'
}) {
  const settings = useLiveQuery(() => localDb.settings.toArray(), []) ?? []
  
  if (!order) return null

  const companyName = settings.find(s => s.id === 'company-name')?.value || 'KOTACOM Business'
  const companyPhone = settings.find(s => s.id === 'company-phone')?.value || ''
  const companyAddress = settings.find(s => s.id === 'company-address')?.value || ''
  const companyTax = settings.find(s => s.id === 'company-tax-number')?.value || ''
  const invoiceTerm = settings.find(s => s.id === 'invoice-term')?.value || 'Syarat & Ketentuan berlaku.'

  const isSale = type === 'sale'
  const saleOrder = order as LocalSalesOrder
  const serviceOrder = order as LocalServiceOrder

  const dateStr = order.date
  const code = order.code
  const customerName = order.customerName
  const status = order.status

  const items = isSale
    ? saleOrder.items?.map(i => ({ name: i.name, qty: i.qty, price: i.unitPrice, subtotal: i.subtotal, note: '' })) || []
    : [{ name: serviceOrder.description, qty: 1, price: serviceOrder.cost, subtotal: serviceOrder.cost, note: '' }]

  const subtotal = isSale ? saleOrder.subtotal : serviceOrder.cost
  const discount = isSale ? saleOrder.discountTotal : 0
  const grandTotal = isSale ? saleOrder.grandTotal : serviceOrder.cost
  const paidTotal = isSale ? saleOrder.paidTotal : (status === 'Diambil' || status === 'Selesai' ? serviceOrder.cost : 0)
  const dueTotal = Math.max(grandTotal - paidTotal, 0)

  return (
    <div className="hidden print:block print:w-[210mm] print:min-h-[297mm] print:bg-white print:text-black print:p-8 print:text-sm">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-invoice-container, .print-invoice-container * {
              visibility: visible;
            }
            .print-invoice-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20mm;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
          }
        `}
      </style>

      <div className="print-invoice-container font-sans">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 uppercase">{companyName}</h1>
            <p className="text-gray-500 whitespace-pre-wrap max-w-sm mt-1">{companyAddress}</p>
            {companyPhone && <p className="text-gray-500 text-xs mt-1">Telp: {companyPhone}</p>}
            {companyTax && <p className="text-gray-500 text-xs">NPWP/NIB: {companyTax}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
            <p className="font-mono text-gray-600 mt-1">{code}</p>
            <div className="mt-3 inline-block bg-gray-100 rounded px-2.5 py-1 text-xs font-semibold uppercase text-gray-800 border">
              Status: {status}
            </div>
          </div>
        </div>

        {/* Info Transaksi */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tujuan Tagihan</h3>
            <p className="font-semibold text-gray-800 text-base">{customerName}</p>
            <p className="text-gray-500 text-xs mt-1">Pelanggan Umum</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex justify-between text-xs md:justify-end gap-4">
              <span className="text-gray-400 font-medium">Tanggal Invoice:</span>
              <span className="text-gray-800 font-semibold">{dateStr}</span>
            </div>
            <div className="flex justify-between text-xs md:justify-end gap-4">
              <span className="text-gray-400 font-medium">Tipe Layanan:</span>
              <span className="text-gray-800 font-semibold">{isSale ? 'Penjualan' : 'Layanan Servis'}</span>
            </div>
          </div>
        </div>

        {/* Tabel Items */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 pr-4">Deskripsi Produk/Layanan</th>
              <th className="py-3 px-4 text-right">Jumlah</th>
              <th className="py-3 px-4 text-right">Harga Satuan</th>
              <th className="py-3 pl-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4 pr-4">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
                </td>
                <td className="py-4 px-4 text-right">{item.qty}</td>
                <td className="py-4 px-4 text-right">{formatCurrency(item.price)}</td>
                <td className="py-4 pl-4 text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total & Summary */}
        <div className="flex justify-between items-start gap-8 mb-12">
          {/* Notes/Terms */}
          <div className="flex-1 border rounded-lg p-4 bg-gray-50">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan / Syarat Ketentuan</h4>
            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{invoiceTerm}</p>
          </div>

          {/* Money Breakdown */}
          <div className="w-80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold text-sm text-gray-800">
              <span>Total Akhir</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Telah Dibayar</span>
              <span className="font-medium text-emerald-600">{formatCurrency(paidTotal)}</span>
            </div>
            {dueTotal > 0 && (
              <div className="flex justify-between text-red-600 font-semibold border-t border-dashed pt-1">
                <span>Sisa Tagihan (Piutang)</span>
                <span>{formatCurrency(dueTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t pt-6">
          <p>Terima kasih atas kepercayaan Anda bekerja sama dengan kami.</p>
        </div>
      </div>
    </div>
  )
}
