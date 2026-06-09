import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { readCsvFile } from '@/shared/utils/import-csv'
import { validateImportRows, executeImport, type ImportProductRow } from '@/features/products/lib/import-products'
import type { LocalProduct } from '@/services/local-db/schema'

type Stage = 'upload' | 'preview' | 'done'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingProducts: LocalProduct[]
  onComplete: () => void
}

export function ProductImportDialog({ open, onOpenChange, existingProducts, onComplete }: Props) {
  const [stage, setStage] = useState<Stage>('upload')
  const [rows, setRows] = useState<ImportProductRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; failed: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const validRows = rows.filter(r => r.valid)
  const invalidRows = rows.filter(r => !r.valid)
  const createCount = validRows.filter(r => r.action === 'create').length
  const updateCount = validRows.filter(r => r.action === 'update').length

  function reset() {
    setStage('upload')
    setRows([])
    setFileName('')
    setResult(null)
    setLoading(false)
  }

  function handleClose(open: boolean) {
    if (!open) {
      if (stage === 'done') onComplete()
      reset()
    }
    onOpenChange(open)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const parsed = await readCsvFile(file)
      if (parsed.length === 0) {
        toast.error('File CSV kosong atau format tidak valid')
        setLoading(false)
        return
      }
      const existingIds = new Set(existingProducts.map(p => p.id))
      const validated = validateImportRows(parsed, existingIds)
      setRows(validated)
      setFileName(file.name)
      setStage('preview')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membaca file')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await executeImport(validRows, existingProducts)
      setResult(res)
      setStage('done')
      if (res.created + res.updated > 0) {
        toast.success(`${res.created + res.updated} produk berhasil diimpor`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengimpor produk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] flex flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Produk dari CSV</DialogTitle>
          <DialogDescription>
            {stage === 'upload' && 'Pilih file CSV hasil export atau edit manual. Baris dengan ID yang sudah ada akan diperbarui.'}
            {stage === 'preview' && `File: ${fileName} — ${rows.length} baris ditemukan`}
            {stage === 'done' && 'Import selesai'}
          </DialogDescription>
        </DialogHeader>

        {stage === 'upload' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Upload className="size-8" />
              <div className="text-center">
                <p className="font-medium">Klik untuk pilih file CSV</p>
                <p className="text-xs">atau drag & drop file ke sini</p>
              </div>
            </button>
            {loading && <p className="text-sm text-muted-foreground">Memproses file...</p>}
          </div>
        )}

        {stage === 'preview' && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3 text-green-500" />
                {validRows.length} valid
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3" />
                  {invalidRows.length} error
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <FileText className="size-3" />
                {createCount} baru
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileText className="size-3" />
                {updateCount} update
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/70 text-left">
                  <tr>
                    <th className="px-2 py-1.5 w-8">#</th>
                    <th className="px-2 py-1.5">Nama</th>
                    <th className="px-2 py-1.5">Jenis</th>
                    <th className="px-2 py-1.5">Harga</th>
                    <th className="px-2 py-1.5">Status</th>
                    <th className="px-2 py-1.5">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map(row => (
                    <tr key={row.rowIndex} className={`border-t ${!row.valid ? 'bg-destructive/5' : ''}`}>
                      <td className="px-2 py-1.5 text-muted-foreground">{row.rowIndex}</td>
                      <td className="px-2 py-1.5 font-medium max-w-[120px] truncate">{row.name || <span className="text-destructive italic">kosong</span>}</td>
                      <td className="px-2 py-1.5">{row.type || '-'}</td>
                      <td className="px-2 py-1.5">{row.price || '-'}</td>
                      <td className="px-2 py-1.5">{row.status || '-'}</td>
                      <td className="px-2 py-1.5">
                        {row.valid ? (
                          <span className={`text-xs font-medium ${row.action === 'update' ? 'text-blue-500' : 'text-green-600'}`}>
                            {row.action === 'update' ? 'Update' : 'Baru'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive" title={row.errors.join(', ')}>
                            <AlertCircle className="size-3 shrink-0" />
                            <span className="truncate max-w-[100px]">{row.errors[0]}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className="px-2 py-2 text-center text-xs text-muted-foreground border-t">
                  +{rows.length - 50} baris lainnya tidak ditampilkan
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={reset}>Batal</Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={loading || validRows.length === 0}
              >
                {loading ? 'Mengimpor...' : `Import ${validRows.length} Produk`}
              </Button>
            </div>
          </>
        )}

        {stage === 'done' && result && (
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">Produk Baru</p>
              </div>
              <div className="flex flex-col items-center rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-muted-foreground">Diperbarui</p>
              </div>
              <div className="flex flex-col items-center rounded-xl border p-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Gagal</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => { handleClose(false) }}>
              Selesai
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
