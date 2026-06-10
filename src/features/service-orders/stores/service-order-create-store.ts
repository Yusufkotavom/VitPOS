import { create } from 'zustand'

import { getWholesalePrice } from '@/features/products/lib/wholesale'
import type { WholesaleTier } from '@/services/local-db/schema'

export interface ServiceItem {
  productId: string
  name: string
  qty: number
  price: number
  subtotal: number
  wholesaleTiers?: WholesaleTier[]
}

interface ServiceOrderCreateState {
  customerName: string
  customerId: string | null
  description: string
  notes: string
  status: string
  estimatedCompletion?: string
  hasWarranty: boolean
  warrantyValue: string
  warrantyUnit: 'hari' | 'bulan' | 'tahun'
  items: ServiceItem[]

  setCustomer: (name: string, id: string | null) => void
  setDescription: (desc: string) => void
  setNotes: (notes: string) => void
  setStatus: (status: string) => void
  setEstimatedCompletion: (date?: string) => void
  setHasWarranty: (value: boolean) => void
  setWarrantyValue: (value: string) => void
  setWarrantyUnit: (value: 'hari' | 'bulan' | 'tahun') => void
  addItem: (item: { productId: string; name: string; price: number; wholesaleTiers?: WholesaleTier[] }) => void
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
  hasWarranty: false,
  warrantyValue: '',
  warrantyUnit: 'hari',
  items: [],

  setCustomer: (name, id) => set({ customerName: name, customerId: id }),
  setDescription: (desc) => set({ description: desc }),
  setNotes: (notes) => set({ notes }),
  setStatus: (status) => set({ status }),
  setEstimatedCompletion: (date) => set({ estimatedCompletion: date }),
  setHasWarranty: (value) => set({ hasWarranty: value }),
  setWarrantyValue: (value) => set({ warrantyValue: value }),
  setWarrantyUnit: (value) => set({ warrantyUnit: value }),

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.productId)
      if (existing) {
        const newQty = existing.qty + 1
        const newPrice = getWholesalePrice(existing.price, existing.wholesaleTiers, newQty)
        return {
          items: state.items.map((i) =>
            i.productId === product.productId ? { ...i, qty: newQty, price: newPrice, subtotal: newQty * newPrice } : i,
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
        i.productId === productId
          ? { ...i, qty, price: getWholesalePrice(i.price, i.wholesaleTiers, qty), subtotal: qty * getWholesalePrice(i.price, i.wholesaleTiers, qty) }
          : i,
      ),
    }))
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }))
  },

  clear: () => set({ customerName: 'Umum', customerId: null, description: '', notes: '', status: 'Baru', estimatedCompletion: undefined, hasWarranty: false, warrantyValue: '', warrantyUnit: 'hari', items: [] }),
}))
