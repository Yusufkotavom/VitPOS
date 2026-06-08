import { CloudUpload } from 'lucide-react'

export function HeldSaleBanner({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
      <div className="flex items-center gap-3">
        <CloudUpload />
        <div>
          <p className="font-semibold">Draft transaksi siap disimpan lokal</p>
          <p>Jika koneksi putus, order tetap masuk antrean sinkron.</p>
        </div>
      </div>
    </div>
  )
}
