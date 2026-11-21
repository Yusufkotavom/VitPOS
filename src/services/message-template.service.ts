import { localDb } from '@/services/local-db/client'
import { settingRepository } from '@/services/local-db/repository'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export type MessageTemplateType =
  | 'invoice'
  | 'shortage'
  | 'paid'
  | 'status'
  | 'product_info'
  | 'service_order_masuk'
  | 'service_order_persetujuan'
  | 'service_order_dikerjakan'
  | 'service_order_selesai'
  | 'service_order_diambil'
  | 'service_order_garansi'
  | 'service_order_batal'
  | 'service_order_status'

export const TEMPLATE_LABELS: Record<MessageTemplateType, string> = {
  invoice: 'Nota / Invoice',
  shortage: 'Kekurangan Pembayaran',
  paid: 'Pembayaran Lunas',
  status: 'Update Status Pesanan',
  product_info: 'Info Produk',
  service_order_masuk: 'Service Order (Baru Masuk)',
  service_order_persetujuan: 'Service Order (Menunggu Persetujuan)',
  service_order_dikerjakan: 'Service Order (Sedang Dikerjakan)',
  service_order_selesai: 'Service Order (Selesai / Siap Diambil)',
  service_order_diambil: 'Service Order (Sudah Diambil)',
  service_order_garansi: 'Service Order (Garansi Servis)',
  service_order_batal: 'Service Order (Dibatalkan)',
  service_order_status: 'Service Order (Update Status)',
}

export const TEMPLATE_VARIABLES: Record<MessageTemplateType, string[]> = {
  invoice: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name'],
  shortage: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name', 'remaining', 'status'],
  paid: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name', 'remaining', 'status'],
  status: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'remaining', 'status', 'change', 'payment_method', 'store_name'],
  product_info: ['product_name', 'price', 'stock', 'category'],
  service_order_masuk: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'estimated_completion', 'date', 'total', 'paid', 'remaining', 'items', 'change', 'payment_method', 'store_name'],
  service_order_persetujuan: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'estimated_completion', 'date', 'total', 'paid', 'remaining', 'items', 'notes', 'store_name'],
  service_order_dikerjakan: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'estimated_completion', 'date', 'notes', 'store_name'],
  service_order_selesai: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'date', 'total', 'paid', 'remaining', 'items', 'change', 'payment_method', 'store_name', 'warranty'],
  service_order_diambil: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'date', 'total', 'paid', 'remaining', 'items', 'change', 'payment_method', 'store_name', 'warranty'],
  service_order_garansi: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'date', 'warranty', 'notes', 'store_name'],
  service_order_batal: ['code', 'customer_name', 'device', 'problem', 'status', 'notes', 'date', 'store_name'],
  service_order_status: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'estimated_completion', 'date', 'total', 'paid', 'remaining', 'items', 'change', 'payment_method', 'store_name', 'notes'],
}

export const DEFAULT_TEMPLATES: Record<MessageTemplateType, string> = {
  invoice: `🛒 *NOTA PEMBELIAN*
─────────────────
*No Nota:* {{code}}
*Tanggal:* {{date}}
*Pelanggan:* {{customer_name}}
─────────────────
{{items}}
─────────────────
*Total:* {{total}}
*Bayar:* {{paid}}
*Kembali:* {{change}}
*Metode:* {{payment_method}}
─────────────────
Terima kasih telah berbelanja!`,

  shortage: `⚠️ *PEMBERITAHUAN*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Total:* {{total}}
*Terbayar:* {{paid}}
*Sisa:* {{remaining}}
─────────────────
Mohon segera dilunasi. Terima kasih.`,

  paid: `✅ *PEMBAYARAN LUNAS*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Total:* {{total}}
*Pembayaran:* {{paid}}
*Status:* LUNAS
─────────────────
Terima kasih!`,

  status: `📋 *UPDATE STATUS PESANAN*
─────────────────
*No Nota:* {{code}}
*Pelanggan:* {{customer_name}}
*Status:* {{status}}
─────────────────
Terima kasih.`,

  product_info: `📦 *INFO PRODUK*
─────────────────
*Produk:* {{product_name}}
*Harga:* {{price}}
*Stok:* {{stock}}
*Kategori:* {{category}}
─────────────────`,

  service_order_masuk: `🔧 *TANDA TERIMA SERVICE*
─────────────────
*No Service:* {{code}}
*Tanggal:* {{date}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
*Kerusakan:* {{problem}}
─────────────────
*Estimasi Selesai:* {{estimated_completion}}
*Estimasi Biaya:* {{cost}}
*DP Dibayar:* {{paid}}
*Sisa Biaya:* {{remaining}}
─────────────────
Mohon konfirmasi jika setuju dengan estimasi di atas. Terima kasih.`,

  service_order_persetujuan: `⚠️ *KONFIRMASI PERSETUJUAN SERVICE*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
*Hasil Pengecekan:* {{problem}}
─────────────────
*Estimasi Biaya:* {{cost}}
*Estimasi Selesai:* {{estimated_completion}}
*Catatan:* {{notes}}
─────────────────
Mohon balas *SETUJU* jika biaya di atas disetujui agar teknisi kami dapat segera mulai mengerjakan. Terima kasih.`,

  service_order_dikerjakan: `⚙️ *PROGRES PENGERJAAN SERVICE*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
*Status:* Sedang Dikerjakan
─────────────────
*Catatan Teknisi:* {{notes}}
*Estimasi Selesai:* {{estimated_completion}}
─────────────────
Perangkat Anda saat ini sedang dikerjakan oleh teknisi kami. Kami akan mengabari Anda segera setelah selesai. Terima kasih.`,

  service_order_selesai: `✅ *SERVICE SELESAI & SIAP DIAMBIL*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
─────────────────
Pekerjaan telah selesai dan perangkat siap diambil di toko.
*Total Biaya:* {{total}}
*Sudah Dibayar:* {{paid}}
*Sisa Tagihan:* {{remaining}}
*Garansi:* {{warranty}}
─────────────────
Silakan tunjukkan pesan ini atau nomor service saat pengambilan. Terima kasih.`,

  service_order_diambil: `🤝 *PENYERAHAN UNIT SERVICE*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
─────────────────
Unit servis telah diserahkan kepada pelanggan.
*Total Biaya:* {{total}}
*Sudah Dibayar:* {{paid}}
*Sisa Tagihan:* {{remaining}}
*Garansi Servis:* {{warranty}}
─────────────────
Terima kasih telah mempercayakan perbaikan kepada kami. Simpan pesan ini sebagai bukti garansi servis Anda.`,

  service_order_garansi: `🛡️ *STATUS GARANSI SERVICE*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
*Status Garansi:* {{warranty}}
─────────────────
*Catatan:* {{notes}}
─────────────────
Simpan bukti pesan ini untuk klaim garansi service Anda. Terima kasih telah mempercayakan perbaikan kepada kami.`,

  service_order_batal: `❌ *PEMBATALAN SERVICE*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
─────────────────
*Alasan Batal:* {{notes}}
─────────────────
Perbaikan untuk perangkat ini telah dibatalkan. Silakan mengambil unit kembali di toko kami. Terima kasih.`,

  service_order_status: `📋 *UPDATE STATUS SERVICE*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
*Status:* {{status}}
─────────────────
*Catatan:* {{notes}}
*Estimasi Selesai:* {{estimated_completion}}
*Estimasi Biaya:* {{cost}}
*Sisa Tagihan:* {{remaining}}
─────────────────
Terima kasih telah mempercayakan perbaikan kepada kami.`,
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match
  })
}

export const messageTemplateService = {
  async getTemplate(type: MessageTemplateType): Promise<string> {
    try {
      const tenantId = resolveTenantId()
      const override = await localDb?.settings?.get(`msg_template_${type}`)
      if (override && override.tenantId === tenantId && override.value?.trim()) {
        return override.value
      }
    } catch {
      // Fallback to default template
    }
    return DEFAULT_TEMPLATES[type] ?? ''
  },

  async render(type: MessageTemplateType, variables: Record<string, string>): Promise<string> {
    const template = await this.getTemplate(type)
    return renderTemplate(template, variables)
  },

  async setOverride(type: MessageTemplateType, value: string): Promise<void> {
    const tenantId = resolveTenantId()
    const now = new Date().toISOString()
    const id = `msg_template_${type}`
    await settingRepository.upsert({
      id,
      tenantId,
      area: 'Template Pesan',
      setting: TEMPLATE_LABELS[type],
      value,
      status: value.trim() ? 'Lengkap' : 'Belum Lengkap',
      updatedAt: now,
    })
  },

  async getOverride(type: MessageTemplateType): Promise<string | null> {
    const tenantId = resolveTenantId()
    const override = await localDb.settings.get(`msg_template_${type}`)
    if (override && override.tenantId === tenantId && override.value.trim()) {
      return override.value
    }
    return null
  },

  async resetToDefault(type: MessageTemplateType): Promise<void> {
    await settingRepository.remove(`msg_template_${type}`)
  },
}
