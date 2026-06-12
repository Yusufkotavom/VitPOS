import { CheckCircle2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DEFAULT_SETUP_CHECKLIST = [
  'Tambah 5 produk atau jasa terlaris',
  'Atur harga jual dan modal',
  'Catat transaksi pertama',
  'Cek stok minimum',
  'Buka ringkasan hari ini',
]

export function PostSetupChecklist({ items = DEFAULT_SETUP_CHECKLIST }: { items?: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist setelah setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
