import { create } from 'zustand'

export interface ServiceItem {
  productId: string
  name: string
  qty: number
  price: number
  subtotal: number
}

interface ServiceOrderCreateState {
  customerName: string
  customerId: string | null
  description: string
  notes: string
  status: string
  estimatedCompletion?: string
  items: ServiceItem[]

  setCustomer: (name: string, id: string | null) => void
  setDescription: (desc: string) => void
  setNotes: (notes: string) => void
  setStatus: (status: string) => void
  setEstimatedCompletion: (date?: string) => void
  addItem: (item: { productId: string; name: string; price: number }) => void
  updateItemQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

export const useServiceOrderCreateStore = create<ServiceOrderCreateState>((set) => ({
  customerName: 'Umum',
  customerId: null,
  description: '',
  notes: '',
  status: 'Baru',
  estimatedCompletion: undefined,
  items: [],

  setCustomer: (name, id) => set({ customerName: name, customerId: id }),
  setDescription: (desc) => set({ description: desc }),
  setNotes: (notes) => set({ notes }),
  setStatus: (status) => set({ status }),
  setEstimatedCompletion: (date) => set({ estimatedCompletion: date }),

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.productId)
      if (existing) {
        const qty = existing.qty + 1
        return {
          items: state.items.map((i) =>
            i.productId === product.productId ? { ...i, qty, subtotal: qty * i.price } : i,
          ),
        }
      }
      return {
        items: [...state.items, { ...product, qty: 1, subtotal: product.price }],
      }
    })
  },

  updateItemQty: (productId, qty) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, qty, subtotal: qty * i.price } : i,
      ),
    }))
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }))
  },

  clear: () => set({ customerName: 'Umum', customerId: null, description: '', notes: '', status: 'Baru', estimatedCompletion: undefined, items: [] }),
}))
