export type ProductRow = {
  id: string
  name: string
  category: string
  type: string
  price: string
  stock: string
  status: string
}

export const productRows: ProductRow[] = [
  {
    id: '1',
    name: 'Kabel Type-C Fast Charging',
    category: 'Aksesoris',
    type: 'Produk Fisik',
    price: 'Rp 45.000',
    stock: '24 pcs',
    status: 'Aktif',
  },
  {
    id: '2',
    name: 'Jasa Ganti LCD',
    category: 'Service HP',
    type: 'Jasa',
    price: 'Rp 350.000',
    stock: '-',
    status: 'Aktif',
  },
]
