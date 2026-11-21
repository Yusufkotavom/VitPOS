import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Barcode, Printer, Tag } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format-currency'
import type { LocalProduct } from '@/services/local-db/schema'

export type ProductBarcodeLabelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: LocalProduct
  storeName?: string
}

type ProductLabelSize = '40x30' | '50x30' | '33x15' | '58mm'

export function ProductBarcodeLabelDialog({
  open,
  onOpenChange,
  product,
  storeName = 'KOTACOM POS',
}: ProductBarcodeLabelDialogProps) {
  const [size, setSize] = useState<ProductLabelSize>('40x30')
  const [copies, setCopies] = useState(1)
  const [showPrice, setShowPrice] = useState(true)
  const [showStore, setShowStore] = useState(true)
  const [showSku, setShowSku] = useState(true)

  const svgRef = useRef<SVGSVGElement>(null)

  const barcodeValue = product.barcode || product.sku || product.id.slice(0, 12).toUpperCase()

  useEffect(() => {
    if (!open || !barcodeValue) return
    const timer = setTimeout(() => {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, barcodeValue, {
            format: 'CODE128',
            width: size === '33x15' ? 1.0 : size === '40x30' ? 1.3 : 1.5,
            height: size === '33x15' ? 18 : size === '40x30' ? 28 : 34,
            displayValue: false,
            margin: 0,
          })
        } catch {
          // ignore barcode formatting error
        }
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [open, barcodeValue, size])

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=450,height=400')
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Izinkan popup pada browser Anda.')
      return
    }

    const svgHtml = svgRef.current ? svgRef.current.outerHTML : ''

    const widthMm =
      size === '33x15'
        ? '33mm'
        : size === '40x30'
          ? '40mm'
          : size === '58mm'
            ? '54mm'
            : '50mm'
    const heightMm =
      size === '33x15'
        ? '15mm'
        : size === '40x30'
          ? '30mm'
          : size === '58mm'
            ? 'auto'
            : '30mm'

    const singleLabelHtml = `
      <div class="label-wrapper">
        ${showStore ? `<div class="store-name">${storeName}</div>` : ''}
        <div class="product-name">${product.name}</div>
        <div class="barcode-box">${svgHtml}</div>
        <div class="barcode-text">${barcodeValue}</div>
        <div class="footer-row">
          ${showSku && product.sku ? `<span class="sku-text">SKU: ${product.sku}</span>` : '<span></span>'}
          ${showPrice ? `<span class="price-text">${formatCurrency(product.price)}</span>` : ''}
        </div>
      </div>
    `

    const allLabelsHtml = Array.from({ length: copies }, () => singleLabelHtml).join('\n')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Label - ${product.name}</title>
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
            background: #fff;
            color: #000;
          }
          .label-wrapper {
            width: ${widthMm};
            height: ${heightMm};
            padding: ${size === '33x15' ? '1.5mm 2mm' : '2mm 2.5mm'};
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            overflow: hidden;
            text-align: center;
          }
          .store-name {
            font-size: ${size === '33x15' ? '6px' : '7.5px'};
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.1;
          }
          .product-name {
            font-size: ${size === '33x15' ? '7px' : '9px'};
            font-weight: 800;
            line-height: 1.15;
            max-height: ${size === '33x15' ? '14px' : '22px'};
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .barcode-box {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: ${size === '33x15' ? '1px 0' : '2px 0'};
          }
          .barcode-box svg {
            width: 95%;
            height: auto;
            max-height: ${size === '33x15' ? '16px' : size === '40x30' ? '26px' : '32px'};
          }
          .barcode-text {
            font-family: monospace;
            font-size: ${size === '33x15' ? '6.5px' : '8px'};
            font-weight: 600;
            letter-spacing: 0.8px;
            line-height: 1;
          }
          .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-top: 1px;
          }
          .sku-text {
            font-size: ${size === '33x15' ? '6px' : '7.5px'};
            color: #444;
            font-family: monospace;
          }
          .price-text {
            font-size: ${size === '33x15' ? '8px' : '10.5px'};
            font-weight: 900;
          }
        </style>
      </head>
      <body>
        ${allLabelsHtml}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Barcode className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Cetak Stiker Barcode Produk
              </DialogTitle>
              <DialogDescription className="text-xs">
                Format stiker barcode untuk rak pajangan atau kemasan produk.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preview Box */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-4">
            <span className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preview Stiker Label
            </span>
            <div
              className={`flex flex-col justify-between rounded-lg border bg-white p-3 text-black shadow-sm dark:bg-card dark:text-card-foreground ${
                size === '33x15'
                  ? 'w-[200px] h-[95px] text-[10px]'
                  : size === '40x30'
                    ? 'w-[230px] h-[160px] text-xs'
                    : 'w-[260px] h-[170px] text-xs'
              }`}
            >
              {showStore && (
                <div className="text-center font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  {storeName}
                </div>
              )}
              <div className="text-center font-bold line-clamp-2 leading-tight">
                {product.name}
              </div>
              <div className="flex justify-center py-1">
                <svg ref={svgRef} className="max-h-9 w-4/5" />
              </div>
              <div className="text-center font-mono text-[11px] tracking-wider font-semibold">
                {barcodeValue}
              </div>
              <div className="flex items-baseline justify-between border-t border-muted/50 pt-1 text-[11px]">
                {showSku && product.sku ? (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                ) : (
                  <span />
                )}
                {showPrice && (
                  <span className="font-extrabold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pengaturan Label */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ukuran Label Stiker</Label>
              <Select
                value={size}
                onValueChange={(val) => setSize(val as ProductLabelSize)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="40x30">40 x 30 mm (Standar Rak)</SelectItem>
                  <SelectItem value="50x30">50 x 30 mm (Label Luas)</SelectItem>
                  <SelectItem value="33x15">33 x 15 mm (Mini Aksesoris)</SelectItem>
                  <SelectItem value="58mm">58 mm (Continuous Roll)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Jumlah Cetak (Lembar)</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setCopies(product.stock > 0 ? product.stock : 1)}
                  title="Sesuaikan dengan jumlah stok saat ini"
                >
                  <Tag className="mr-1 size-3" />
                  Stok ({product.stock})
                </Button>
              </div>
            </div>
          </div>

          {/* Opsi Konten Label */}
          <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">Tampilkan di Label:</span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="size-3.5 rounded"
                />
                Harga Jual
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStore}
                  onChange={(e) => setShowStore(e.target.checked)}
                  className="size-3.5 rounded"
                />
                Nama Toko
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="size-3.5 rounded"
                />
                Kode SKU
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="size-4" />
            Cetak ({copies} Label)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
