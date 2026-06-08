import { formatCurrency } from '@/lib/format-currency'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'

export function ReceiptPrintLayout({ order }: { order: PosOrderSummary | null }) {
  if (!order) return null

  // Format date natively for print layout
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(order.date)

  return (
    <div className="hidden print:block print:w-[58mm] print:text-black print:font-mono print:text-xs">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-receipt-container, .print-receipt-container * {
              visibility: visible;
            }
            .print-receipt-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 58mm; /* Thermal printer width */
              margin: 0;
              padding: 0;
            }
            @page {
              size: 58mm auto;
              margin: 0;
            }
          }
        `}
      </style>

      <div className="print-receipt-container p-2">
        <div className="text-center mb-4">
          <h1 className="font-bold text-sm uppercase">KOTACOM POS</h1>
          <p className="text-[10px]">Jl. Contoh Alamat No. 123</p>
          <p className="text-[10px]">Telp: 08123456789</p>
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          <div className="flex justify-between">
            <span>{dateStr}</span>
            <span>Kasir: {order.cashierName}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>ID: {order.id.slice(0, 8)}</span>
            {order.customerName && <span>Pel: {order.customerName}</span>}
          </div>
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="mb-2">
              <div className="font-semibold">{item.name}</div>
              <div className="flex justify-between">
                <span>{item.qty} x {formatCurrency(item.price)}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Tunai/Bayar ({order.paymentMethod})</span>
            <span>{formatCurrency(order.amountPaid)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Kembali</span>
            <span>{formatCurrency(order.change)}</span>
          </div>
        </div>

        <div className="text-center mt-6">
          <p>Terima Kasih</p>
          <p className="text-[10px]">Barang yang sudah dibeli</p>
          <p className="text-[10px]">tidak dapat ditukar/dikembalikan</p>
        </div>
      </div>
    </div>
  )
}
