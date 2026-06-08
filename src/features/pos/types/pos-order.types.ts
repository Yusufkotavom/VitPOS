import { type PosCartItem, type PosPaymentMethod } from './pos.types'

export type PosOrderSummary = {
  id: string
  date: Date
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: PosPaymentMethod
  amountPaid: number
  change: number
  items: PosCartItem[]
  customerName?: string
  cashierName: string
}

