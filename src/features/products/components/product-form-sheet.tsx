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
import { createProductId } from '@/features/catalog/lib/entity-id'
import { resolveTenantId } from '@/features/auth/stores/auth-store'
import { parseDigits } from '@/features/catalog/lib/formatters'
import { useCategories } from '@/features/products/hooks/use-categories'
import { productRepository } from '@/services/local-db/repository'
import { FormSection } from '@/shared/components/forms/form-section'

export function ProductFormSheet() {
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Umum')
  const [costPrice, setCostPrice] = useState('0')
  const [price, setPrice] = useState('0')
  const [stock, setStock] = useState('0')
  const categoryOptions = ['Umum', ...categories.filter((row) => row.status === 'Aktif').map((row) => row.name)]

  async function saveProduct() {
    if (!name.trim()) return

    await productRepository.upsert({
      id: createProductId(),
      tenantId: resolveTenantId(),
      name: name.trim(),
      category: category.trim() || 'Umum',
      type: 'Produk Fisik',
      costPrice: parseDigits(costPrice),
      price: parseDigits(price),
      stock: parseDigits(stock),
      status: 'Aktif',
      syncStatus: 'pending',
      version: 1,
      updatedAt: new Date().toISOString(),
    })

    setName('')
    setCategory('Umum')
    setCostPrice('0')
    setPrice('0')
    setStock('0')
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
            <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              {Array.from(new Set(categoryOptions)).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </FormSection>
          <FormSection title="Harga & stok" description="Modal/HPP, harga jual, dan stok awal.">
            <Input inputMode="numeric" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} placeholder="Modal / HPP" />
            <Input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Harga" />
            <Input inputMode="numeric" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Stok" />
          </FormSection>
          <Button onClick={saveProduct} disabled={!name.trim()}>Simpan Produk</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
