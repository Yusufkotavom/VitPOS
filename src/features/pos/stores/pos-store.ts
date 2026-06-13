import { create } from 'zustand'

import { type PosCartItem, type PosPaymentMethod, type PosProduct } from '@/features/pos/types/pos.types'
import { getWholesalePrice } from '@/features/products/lib/wholesale'

type PosStore = {
  searchQuery: string
  selectedCategory: string
  cartItems: PosCartItem[]
  paymentMethod: PosPaymentMethod
  discount: number
  paidAmount: number
  customerId: string | null
  customerName: string | null
  viewMode: 'grid' | 'list'
  orderNote: string
  setSearchQuery: (value: string) => void
  setSelectedCategory: (value: string) => void
  addItem: (product: PosProduct) => void
  updateItem: (productId: string, updates: Partial<PosCartItem>) => void
  increaseQty: (productId: string) => void
  decreaseQty: (productId: string) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  setPaymentMethod: (value: PosPaymentMethod) => void
  setPaidAmount: (value: number) => void
  setDiscount: (value: number) => void
  setOrderNote: (value: string) => void
  setCustomer: (id: string | null, name: string | null) => void
  setCart: (items: PosCartItem[]) => void
  setViewMode: (value: 'grid' | 'list') => void
}

export const usePosStore = create<PosStore>((set) => ({
  searchQuery: '',
  selectedCategory: 'Semua',
  cartItems: [],
  paymentMethod: 'tunai',
  discount: 0,
  paidAmount: 0,
  customerId: null,
  customerName: null,
  viewMode: 'grid',
  orderNote: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  addItem: (product) =>
    set((state) => {
      const existing = state.cartItems.find((item) => item.productId === product.id)
      if (existing) {
        const newQty = existing.qty + 1
        const newPrice = getWholesalePrice(existing.price, existing.wholesaleTiers, newQty)
        return {
          cartItems: state.cartItems.map((item) =>
            item.productId === product.id
              ? { ...item, qty: newQty, price: newPrice, subtotal: newQty * newPrice }
              : item,
          ),
        }
      }

      return {
        cartItems: [
          ...state.cartItems,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            subtotal: product.price,
            wholesaleTiers: product.wholesaleTiers,
          },
        ],
      }
    }),
  updateItem: (productId, updates) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.productId === productId) {
          const qty = updates.qty ?? item.qty
          const price = updates.price ?? getWholesalePrice(item.price, item.wholesaleTiers, qty)
          return { ...item, ...updates, price, qty, subtotal: price * qty }
        }
        return item
      }),
    })),
  increaseQty: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.productId !== productId) return item
        const newQty = item.qty + 1
        const newPrice = getWholesalePrice(item.price, item.wholesaleTiers, newQty)
        return { ...item, qty: newQty, price: newPrice, subtotal: newQty * newPrice }
      }),
    })),
  decreaseQty: (productId) =>
    set((state) => ({
      cartItems: state.cartItems
        .map((item) => {
          if (item.productId !== productId) return item
          const newQty = item.qty - 1
          const newPrice = getWholesalePrice(item.price, item.wholesaleTiers, newQty)
          return { ...item, qty: newQty, price: newPrice, subtotal: newQty * newPrice }
        })
        .filter((item) => item.qty > 0),
    })),
  removeItem: (productId) => set((state) => ({ cartItems: state.cartItems.filter((item) => item.productId !== productId) })),
  clearCart: () => set({ cartItems: [], discount: 0, paidAmount: 0, paymentMethod: 'tunai', customerId: null, customerName: null, orderNote: '' }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setPaidAmount: (paidAmount) => set({ paidAmount }),
  setDiscount: (discount) => set({ discount }),
  setOrderNote: (orderNote) => set({ orderNote }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setCart: (items) => set({ cartItems: items }),
  setViewMode: (viewMode) => set({ viewMode }),
}))

export function selectPosTotals(state: PosStore) {
  const subtotal = state.cartItems.reduce((total, item) => total + item.subtotal, 0)
  const total = Math.max(subtotal - state.discount, 0)
  const change = Math.max(state.paidAmount - total, 0)
  const itemCount = state.cartItems.reduce((total, item) => total + item.qty, 0)

  return { subtotal, total, change, itemCount }
}

