import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <article className="rounded-2xl border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Aksi Cepat</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button className="h-20 justify-start">Buka POS</Button>
        <Button variant="outline" className="h-20 justify-start">Tambah Produk</Button>
        <Button variant="outline" className="h-20 justify-start">Tambah Pelanggan</Button>
        <Button variant="outline" className="h-20 justify-start">Catat Pengeluaran</Button>
      </div>
    </article>
  )
}
