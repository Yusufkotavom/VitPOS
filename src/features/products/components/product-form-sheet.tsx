import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { productRepository } from '@/services/local-db/repository'
import { FormSection } from '@/shared/components/forms/form-section'

export function ProductFormSheet() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Umum')
  const [price, setPrice] = useState('Rp 0')
  const [stock, setStock] = useState('0 pcs')

  async function saveProduct() {
    if (!name.trim()) return

    await productRepository.upsert({
      id: `product-${crypto.randomUUID()}`,
      name: name.trim(),
      category: category.trim() || 'Umum',
      type: 'Produk Fisik',
      price: price.trim() || 'Rp 0',
      stock: stock.trim() || '0 pcs',
      status: 'Aktif',
    })

    setName('')
    setCategory('Umum')
    setPrice('Rp 0')
    setStock('0 pcs')
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Tambah Produk</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Form Produk</SheetTitle>
          <SheetDescription>Tambah produk lokal dan masukkan ke queue sinkron otomatis.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
          <FormSection title="Info dasar" description="Nama, kategori, jenis, dan status produk.">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama produk" />
            <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Kategori" />
          </FormSection>
          <FormSection title="Harga & stok" description="Harga jual dan stok awal.">
            <Input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Harga" />
            <Input value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Stok" />
          </FormSection>
          <Button onClick={saveProduct} disabled={!name.trim()}>Simpan Produk</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
