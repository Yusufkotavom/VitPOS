import type { ServiceOrderStatus } from '@/services/local-db/schema'
import type { BusinessModeId, BusinessVerticalId } from '@/features/auth/data/business-playbooks'

export type IntakeFieldKey =
  | 'deviceType'
  | 'deviceBrand'
  | 'deviceModel'
  | 'deviceSerial'
  | 'accessories'
  | 'condition'
  | 'fileSource'
  | 'material'
  | 'finishing'
  | 'size'

export type IntakeField = {
  key: IntakeFieldKey
  label: string
  placeholder?: string
}

export type ServiceVerticalConfig = {
  id: string
  label: string
  jobCategoryLabel: string
  jobCategoryPlaceholder: string
  complaintLabel: string
  complaintPlaceholder: string
  diagnosisLabel: string
  accessoriesLabel: string
  intakeFields: IntakeField[]
  quickServices: Array<{ label: string; complaint: string }>
  statusFlow: ServiceOrderStatus[]
  defaultWarrantyDays?: number
}

const deviceFields: IntakeField[] = [
  { key: 'deviceBrand', label: 'Merek', placeholder: 'Asus / HP / Epson' },
  { key: 'deviceModel', label: 'Model', placeholder: 'Acer Aspire 5 / L3210' },
  { key: 'deviceSerial', label: 'Serial / IMEI', placeholder: 'Opsional' },
  { key: 'accessories', label: 'Kelengkapan', placeholder: 'Charger, tas, kabel' },
]

const computerConfig: ServiceVerticalConfig = {
  id: 'service_computer',
  label: 'Servis Komputer & Laptop',
  jobCategoryLabel: 'Jenis perangkat',
  jobCategoryPlaceholder: 'Laptop / PC / Printer',
  complaintLabel: 'Keluhan pelanggan',
  complaintPlaceholder: 'Contoh: laptop mati total setelah kena air',
  diagnosisLabel: 'Diagnosa teknisi',
  accessoriesLabel: 'Kelengkapan',
  intakeFields: deviceFields,
  quickServices: [
    { label: 'Instal Ulang OS', complaint: 'Install ulang OS + software standar' },
    { label: 'Deep Cleaning', complaint: 'Bersihkan debu + ganti thermal paste' },
    { label: 'Upgrade SSD', complaint: 'Upgrade storage ke SSD' },
    { label: 'Ganti LCD', complaint: 'LCD bergaris / pecah' },
    { label: 'Servis Printer', complaint: 'Printer head buntu / hasil bergaris' },
  ],
  statusFlow: ['Diterima', 'Menunggu Persetujuan', 'Dikerjakan', 'Selesai', 'Garansi'],
  defaultWarrantyDays: 30,
}

const printingConfig: ServiceVerticalConfig = {
  id: 'printing',
  label: 'Percetakan & Digital Printing',
  jobCategoryLabel: 'Jenis pesanan',
  jobCategoryPlaceholder: 'Banner / Kartu nama / Jilid',
  complaintLabel: 'Spesifikasi pesanan',
  complaintPlaceholder: 'Banner flexi 280gr 3x1 m, finishing mata ayam',
  diagnosisLabel: 'Catatan produksi',
  accessoriesLabel: 'File & bahan',
  intakeFields: [
    { key: 'fileSource', label: 'Sumber file', placeholder: 'WhatsApp / Flashdisk / Email' },
    { key: 'material', label: 'Bahan', placeholder: 'Flexi 280gr / Art paper' },
    { key: 'size', label: 'Ukuran', placeholder: '3 x 1 meter' },
    { key: 'finishing', label: 'Finishing', placeholder: 'Mata ayam / laminasi' },
  ],
  quickServices: [
    { label: 'Banner per m²', complaint: 'Cetak banner flexi per meter persegi' },
    { label: 'Print A4 BW', complaint: 'Print hitam putih A4 per lembar' },
    { label: 'Cetak Kartu Nama', complaint: 'Kartu nama 1 box isi 100' },
    { label: 'Jilid Buku', complaint: 'Jilid spiral / lem panas' },
  ],
  statusFlow: ['Diterima', 'Menunggu Persetujuan', 'Dikerjakan', 'Selesai', 'Garansi'],
  defaultWarrantyDays: 0,
}

const gadgetConfig: ServiceVerticalConfig = {
  id: 'service_gadget',
  label: 'Servis HP & Gadget',
  jobCategoryLabel: 'Jenis perangkat',
  jobCategoryPlaceholder: 'HP / Tablet / Aksesoris',
  complaintLabel: 'Keluhan pelanggan',
  complaintPlaceholder: 'Contoh: layar pecah, baterai cepat habis',
  diagnosisLabel: 'Diagnosa teknisi',
  accessoriesLabel: 'Kelengkapan',
  intakeFields: deviceFields,
  quickServices: [
    { label: 'Ganti LCD', complaint: 'Layar pecah / touch tidak berfungsi' },
    { label: 'Ganti Baterai', complaint: 'Baterai cepat habis' },
    { label: 'Flash Software', complaint: 'Bootloop / lupa pola' },
    { label: 'Ganti Konektor', complaint: 'Tidak bisa charge' },
  ],
  statusFlow: ['Diterima', 'Menunggu Persetujuan', 'Dikerjakan', 'Selesai', 'Garansi'],
  defaultWarrantyDays: 14,
}

const generalConfig: ServiceVerticalConfig = {
  id: 'general',
  label: 'Pekerjaan & Jasa Umum',
  jobCategoryLabel: 'Jenis pekerjaan',
  jobCategoryPlaceholder: 'Servis / Pesanan / Jasa',
  complaintLabel: 'Permintaan pelanggan',
  complaintPlaceholder: 'Jelaskan pekerjaan yang diminta',
  diagnosisLabel: 'Catatan pengerjaan',
  accessoriesLabel: 'Kelengkapan',
  intakeFields: [
    { key: 'deviceBrand', label: 'Item / perangkat', placeholder: 'Opsional' },
    { key: 'accessories', label: 'Kelengkapan', placeholder: 'Opsional' },
  ],
  quickServices: [],
  statusFlow: ['Diterima', 'Menunggu Persetujuan', 'Dikerjakan', 'Selesai', 'Garansi'],
  defaultWarrantyDays: 0,
}

const configByVertical: Record<string, ServiceVerticalConfig> = {
  service_computer: computerConfig,
  atk_printing: printingConfig,
  service_gadget: gadgetConfig,
  general: generalConfig,
}

const configByMode: Record<string, ServiceVerticalConfig> = {
  computer_service_repair: computerConfig,
  computer_printer_combo: computerConfig,
  printing_only: printingConfig,
  atk_only: generalConfig,
  atk_printing_combo: printingConfig,
  hp_service_repair: gadgetConfig,
  hp_accessories_combo: gadgetConfig,
  general_standard: generalConfig,
}

export const SERVICE_VERTICALS: ServiceVerticalConfig[] = [
  computerConfig,
  printingConfig,
  gadgetConfig,
  generalConfig,
]

export function resolveServiceVertical(input: {
  verticalId?: BusinessVerticalId | string | null
  modeId?: BusinessModeId | string | null
}): ServiceVerticalConfig {
  const byMode = input.modeId ? configByMode[input.modeId] : undefined
  if (byMode) return byMode

  const byVertical = input.verticalId ? configByVertical[input.verticalId] : undefined
  return byVertical ?? generalConfig
}

export function getServiceVerticalById(id?: string | null): ServiceVerticalConfig {
  return (id ? configByVertical[id] : undefined) ?? generalConfig
}
