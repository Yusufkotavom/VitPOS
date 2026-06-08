export type PosProduct = {
  id: string
  sku: string
  barcode?: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  isFavorite: boolean
}

export type PosCartItem = {
  productId: string
  name: string
  price: number
  qty: number
  subtotal: number
  note?: string
}

export type PosPaymentMethod = string
