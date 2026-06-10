import type { WholesaleTier } from '@/services/local-db/schema'

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
  wholesaleTiers?: WholesaleTier[]
}

export type PosCartItem = {
  productId: string
  name: string
  price: number
  qty: number
  subtotal: number
  note?: string
  wholesaleTiers?: WholesaleTier[]
}

export type PosPaymentMethod = string
