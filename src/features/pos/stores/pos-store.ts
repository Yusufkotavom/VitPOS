import { create } from 'zustand'

import { type PosCartItem, type PosPaymentMethod, type PosProduct } from '@/features/pos/types/pos.types'

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
  setCustomer: (id: string | null, name: string | null) => void
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
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  addItem: (product) =>
    set((state) => {
      const existing = state.cartItems.find((item) => item.productId === product.id)
      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.productId === product.id
              ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
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
          },
        ],
      }
    }),
  updateItem: (productId, updates) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.productId === productId) {
          const price = updates.price ?? item.price
          const qty = updates.qty ?? item.qty
          return { ...item, ...updates, price, qty, subtotal: price * qty }
        }
        return item
      }),
    })),
  increaseQty: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.productId === productId ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price } : item,
      ),
    })),
  decreaseQty: (productId) =>
    set((state) => ({
      cartItems: state.cartItems
        .map((item) =>
          item.productId === productId ? { ...item, qty: item.qty - 1, subtotal: (item.qty - 1) * item.price } : item,
        )
        .filter((item) => item.qty > 0),
    })),
  removeItem: (productId) => set((state) => ({ cartItems: state.cartItems.filter((item) => item.productId !== productId) })),
  clearCart: () => set({ cartItems: [], discount: 0, paidAmount: 0, paymentMethod: 'tunai', customerId: null, customerName: null }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setPaidAmount: (paidAmount) => set({ paidAmount }),
  setDiscount: (discount) => set({ discount }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setViewMode: (viewMode) => set({ viewMode }),
}))

export function selectPosTotals(state: PosStore) {
  const subtotal = state.cartItems.reduce((total, item) => total + item.subtotal, 0)
  const total = Math.max(subtotal - state.discount, 0)
  const change = Math.max(state.paidAmount - total, 0)
  const itemCount = state.cartItems.reduce((total, item) => total + item.qty, 0)

  return { subtotal, total, change, itemCount }
}

