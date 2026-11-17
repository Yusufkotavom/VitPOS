import { create } from 'zustand'

import {
  computeJobLineSubtotal,
  createJobLine,
  jobLineFromProduct,
  sumJobLines,
} from '@/features/service-orders/lib/job-lines'
import type { JobPriority, LocalJobLine, LocalProduct } from '@/services/local-db/schema'
import type { JobLinePriceMode } from '@/services/local-db/schema'

export type { LocalJobLine as ServiceItem }

export type ServiceIntakeState = {
  customerName: string
  customerId: string | null
  description: string
  notes: string
  complaint: string
  diagnosis: string
  jobCategory: string
  deviceType: string
  deviceBrand: string
  deviceModel: string
  deviceSerial: string
  accessories: string
  priority: JobPriority
  technicianName: string
  details: Record<string, string>
  status: string
  estimatedCompletion?: string
  discount: number
  hasWarranty: boolean
  warrantyValue: string
  warrantyUnit: 'hari' | 'bulan' | 'tahun'
  lines: LocalJobLine[]

  setCustomer: (name: string, id: string | null) => void
  setDescription: (desc: string) => void
  setNotes: (notes: string) => void
  setComplaint: (value: string) => void
  setDiagnosis: (value: string) => void
  setJobCategory: (value: string) => void
  setDeviceField: (field: 'deviceType' | 'deviceBrand' | 'deviceModel' | 'deviceSerial' | 'accessories', value: string) => void
  setPriority: (value: JobPriority) => void
  setTechnicianName: (value: string) => void
  setDetail: (key: string, value: string) => void
  setStatus: (status: string) => void
  setEstimatedCompletion: (date?: string) => void
  setDiscount: (value: number) => void
  setHasWarranty: (value: boolean) => void
  setWarrantyValue: (value: string) => void
  setWarrantyUnit: (value: 'hari' | 'bulan' | 'tahun') => void

  addProduct: (product: LocalProduct) => void
  addCustomLine: (draft?: Partial<LocalJobLine>) => void
  updateLine: (lineId: string, changes: Partial<LocalJobLine>) => void
  updateLineQty: (lineId: string, qty: number) => void
  removeLine: (lineId: string) => void

  clear: () => void
  subtotal: () => number
  total: () => number
}

const initialState = {
  customerName: 'Umum',
  customerId: null as string | null,
  description: '',
  notes: '',
  complaint: '',
  diagnosis: '',
  jobCategory: '',
  deviceType: '',
  deviceBrand: '',
  deviceModel: '',
  deviceSerial: '',
  accessories: '',
  priority: 'Normal' as JobPriority,
  technicianName: '',
  details: {} as Record<string, string>,
  status: 'Diterima',
  estimatedCompletion: undefined as string | undefined,
  discount: 0,
  hasWarranty: false,
  warrantyValue: '',
  warrantyUnit: 'hari' as const,
  lines: [] as LocalJobLine[],
}

function recalcLine(line: LocalJobLine, changes: Partial<LocalJobLine>): LocalJobLine {
  const next = { ...line, ...changes }
  return {
    ...next,
    subtotal: computeJobLineSubtotal({
      priceMode: next.priceMode,
      qty: next.qty,
      unitPrice: next.unitPrice,
      width: next.width,
      height: next.height,
    }),
  }
}

export const useServiceOrderCreateStore = create<ServiceIntakeState>((set, get) => ({
  ...initialState,

  setCustomer: (name, id) => set({ customerName: name, customerId: id }),
  setDescription: (description) => set({ description }),
  setNotes: (notes) => set({ notes }),
  setComplaint: (complaint) => set({ complaint, description: complaint }),
  setDiagnosis: (diagnosis) => set({ diagnosis }),
  setJobCategory: (jobCategory) => set({ jobCategory }),
  setDeviceField: (field, value) => set({ [field]: value } as Partial<ServiceIntakeState>),
  setPriority: (priority) => set({ priority }),
  setTechnicianName: (technicianName) => set({ technicianName }),
  setDetail: (key, value) =>
    set((state) => ({ details: { ...state.details, [key]: value } })),
  setStatus: (status) => set({ status }),
  setEstimatedCompletion: (estimatedCompletion) => set({ estimatedCompletion }),
  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
  setHasWarranty: (hasWarranty) => set({ hasWarranty }),
  setWarrantyValue: (warrantyValue) => set({ warrantyValue }),
  setWarrantyUnit: (warrantyUnit) => set({ warrantyUnit }),

  addProduct: (product) =>
    set((state) => {
      const isService = product.type === 'Jasa'
      const existing = !isService
        ? state.lines.find((line) => line.source === 'catalog' && line.productId === product.id)
        : undefined

      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.id === existing.id ? recalcLine(line, { qty: line.qty + 1 }) : line,
          ),
        }
      }

      return { lines: [...state.lines, jobLineFromProduct(product)] }
    }),

  addCustomLine: (draft) =>
    set((state) => ({
      lines: [
        ...state.lines,
        createJobLine({
          source: 'custom',
          kind: draft?.kind ?? 'service',
          name: draft?.name ?? '',
          unit: draft?.unit ?? 'pcs',
          qty: draft?.qty ?? 1,
          priceMode: (draft?.priceMode as JobLinePriceMode) ?? 'unit',
          unitPrice: draft?.unitPrice ?? 0,
          costPrice: draft?.costPrice ?? 0,
          width: draft?.width,
          height: draft?.height,
          trackStock: false,
        }),
      ],
    })),

  updateLine: (lineId, changes) =>
    set((state) => ({
      lines: state.lines.map((line) => (line.id === lineId ? recalcLine(line, changes) : line)),
    })),

  updateLineQty: (lineId, qty) =>
    set((state) => ({
      lines: state.lines
        .map((line) => (line.id === lineId ? recalcLine(line, { qty }) : line))
        .filter((line) => line.qty > 0),
    })),

  removeLine: (lineId) =>
    set((state) => ({ lines: state.lines.filter((line) => line.id !== lineId) })),

  clear: () => set({ ...initialState, lines: [] }),

  subtotal: () => sumJobLines(get().lines),

  total: () => {
    const subtotal = sumJobLines(get().lines)
    return Math.max(subtotal - get().discount, 0)
  },
}))

export { jobLineFromProduct, createJobLine, computeJobLineSubtotal }
export type { LocalJobLine as JobLine }
