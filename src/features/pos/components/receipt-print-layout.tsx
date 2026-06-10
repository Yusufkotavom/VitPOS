import { useLiveQuery } from '@/services/local-db/reactivity'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import { formatCurrency } from '@/lib/format-currency'
import { localDb } from '@/services/local-db/client'
import { type PosOrderSummary } from '@/features/pos/types/pos-order.types'

export function ReceiptPrintLayout({ order }: { order: PosOrderSummary | null }) {
  const activeTenantId = useAuthStore((state) => state.activeTenant?.id)
  const settings = useLiveQuery(
    () => activeTenantId ? localDb.settings.where('tenantId').equals(activeTenantId).toArray() : [],
    [activeTenantId],
  ) ?? []

  if (!order) return null

  const companyName = settings.find(s => s.id === 'company-name')?.value || 'KOTACOM POS'
  const companyPhone = settings.find(s => s.id === 'company-phone')?.value || ''
  const companyAddress = settings.find(s => s.id === 'company-address')?.value || ''
  const receiptHeader = settings.find(s => s.id === 'receipt-header')?.value || ''
  const receiptFooter = settings.find(s => s.id === 'receipt-footer')?.value || 'Terima kasih atas kunjungan Anda'

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
          <h1 className="font-bold text-sm uppercase">{companyName}</h1>
          {companyAddress && <p className="text-[10px] whitespace-pre-wrap">{companyAddress}</p>}
          {companyPhone && <p className="text-[10px]">Telp: {companyPhone}</p>}
          {receiptHeader && <p className="text-[10px] italic border-t border-dashed mt-1 pt-1">{receiptHeader}</p>}
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          <div className="flex justify-between">
            <span>{dateStr}</span>
            <span>Kasir: {order.cashierName}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>ID: {order.code}</span>
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
              {item.note && <div className="text-[10px] text-gray-700 pl-2">*{item.note}</div>}
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
            <span>Bayar ({order.paymentMethod})</span>
            <span>{formatCurrency(order.amountPaid)}</span>
          </div>
          {order.amountPaid < order.total ? (
            <div className="flex justify-between text-red-600 font-semibold">
              <span>Kurang (DP)</span>
              <span>{formatCurrency(order.total - order.amountPaid)}</span>
            </div>
          ) : (
            <div className="flex justify-between font-semibold">
              <span>Kembali</span>
              <span>{formatCurrency(order.change)}</span>
            </div>
          )}
        </div>

        <div className="text-center mt-6 border-t border-dashed pt-2">
          <p className="whitespace-pre-wrap">{receiptFooter}</p>
        </div>
      </div>
    </div>
  )
}
