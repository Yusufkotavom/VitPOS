import { type PosCartItem, type PosPaymentMethod } from './pos.types'

export type PosOrderSummary = {
  id: string
  code: string
  date: Date
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: PosPaymentMethod
  amountPaid: number
  change: number
  items: PosCartItem[]
  customerId?: string | null
  customerName?: string
  cashierName: string
}

