import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Barcode, Printer, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime } from '@/lib/date'
import type { LocalServiceOrder } from '@/services/local-db/schema'

export type ServiceOrderLabelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: LocalServiceOrder
  storeName?: string
  customerPhone?: string
}

type LabelSize = '50x30' | '40x30' | '58mm'

export function ServiceOrderLabelDialog({
  open,
  onOpenChange,
  order,
  storeName = 'KOTACOM POS',
  customerPhone = '',
}: ServiceOrderLabelDialogProps) {
  const [size, setSize] = useState<LabelSize>('50x30')
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!open || !order.code) return
    const timer = setTimeout(() => {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, order.code, {
            format: 'CODE128',
            width: size === '40x30' ? 1.2 : 1.5,
            height: size === '40x30' ? 26 : 32,
            displayValue: false,
            margin: 0,
          })
        } catch {
          // fallback if code format fails
        }
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [open, order.code, size])

  const deviceText =
    [order.deviceBrand, order.deviceModel].filter(Boolean).join(' ') ||
    order.jobCategory ||
    order.description ||
    'Perangkat'

  const problemText = order.complaint || order.description || '-'
  const dateFormatted = formatDateTime(order.date)

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=450,height=400')
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Izinkan popup pada browser Anda.')
      return
    }

    const svgHtml = svgRef.current ? svgRef.current.outerHTML : ''

    const widthMm = size === '40x30' ? '40mm' : size === '58mm' ? '54mm' : '50mm'
    const heightMm = size === '40x30' ? '30mm' : size === '58mm' ? 'auto' : '30mm'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label Servis - ${order.code}</title>
        <style>
          @page {
            size: ${widthMm} ${heightMm};
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            width: ${widthMm};
            margin: 0 auto;
            padding: 2mm 2.5mm;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          .label-box {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .store-header {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7pt;
            font-weight: 700;
            border-bottom: 0.5pt solid #000;
            padding-bottom: 1mm;
            margin-bottom: 1mm;
          }
          .barcode-wrap {
            margin: 0.5mm 0;
          }
          .barcode-wrap svg {
            max-width: 100%;
            height: auto;
          }
          .order-code {
            font-size: 11pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin-top: -1mm;
            margin-bottom: 1mm;
          }
          .details {
            width: 100%;
            font-size: 6.5pt;
            text-align: left;
            line-height: 1.25;
            border-top: 0.5pt solid #000;
            padding-top: 1mm;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5mm;
          }
          .row-full {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 0.5mm;
          }
          .bold {
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="store-header">
            <span>${storeName}</span>
            <span>${dateFormatted.split(',')[0] || dateFormatted}</span>
          </div>

          <div class="barcode-wrap">
            ${svgHtml}
          </div>

          <div class="order-code">${order.code}</div>

          <div class="details">
            <div class="row">
              <span class="bold">${order.customerName}</span>
              <span>${customerPhone || ''}</span>
            </div>
            <div class="row-full">
              <span class="bold">Unit:</span> ${deviceText}
            </div>
            <div class="row-full">
              <span class="bold">Klh:</span> ${problemText}
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 750);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Barcode className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Cetak Stiker Label Unit Servis
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ditempel langsung pada fisik unit (laptop, printer, HP) agar tidak tertukar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Pengaturan Ukuran Kertas Stiker */}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="label-size" className="text-xs font-medium">
              Ukuran Kertas Stiker:
            </Label>
            <Select value={size} onValueChange={(val) => setSize(val as LabelSize)}>
              <SelectTrigger id="label-size" className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50x30">50 × 30 mm (Standar)</SelectItem>
                <SelectItem value="40x30">40 × 30 mm (Mini)</SelectItem>
                <SelectItem value="58mm">58 mm (Struk Stiker)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pratinjau Stiker */}
          <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Pratinjau Fisik Stiker Label
            </p>

            <div
              className={`rounded-lg border-2 border-dashed border-gray-400 bg-white p-3 text-black shadow-sm transition-all flex flex-col justify-between ${
                size === '40x30'
                  ? 'w-[200px] h-[150px]'
                  : size === '58mm'
                    ? 'w-[240px] h-[175px]'
                    : 'w-[230px] h-[160px]'
              }`}
            >
              {/* Header Toko */}
              <div className="flex items-center justify-between border-b border-black pb-1 text-[9px] font-bold">
                <span className="truncate max-w-[120px]">{storeName}</span>
                <span className="text-[8px] font-normal text-gray-700">
                  {dateFormatted.split(',')[0]}
                </span>
              </div>

              {/* Barcode & Nomor Order */}
              <div className="my-1 flex flex-col items-center justify-center">
                <svg ref={svgRef} className="max-w-full h-8" />
                <div className="text-xs font-black tracking-wider text-black">
                  {order.code}
                </div>
              </div>

              {/* Info Pelanggan & Unit */}
              <div className="border-t border-black pt-1 text-[8px] leading-tight text-black">
                <div className="flex justify-between font-bold">
                  <span className="truncate">{order.customerName}</span>
                  <span>{customerPhone || ''}</span>
                </div>
                <div className="truncate mt-0.5">
                  <span className="font-semibold">Unit: </span>
                  {deviceText}
                </div>
                <div className="truncate text-gray-700">
                  <span className="font-semibold">Klh: </span>
                  {problemText}
                </div>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              💡 Rekomendasi printer: Printer Thermal Label Xprinter, Blueprint, Panda, atau Zebra.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="mr-1.5 size-3.5" />
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="mr-1.5 size-4" />
            Cetak Label Stiker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
