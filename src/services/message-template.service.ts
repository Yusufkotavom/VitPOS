import { localDb } from '@/services/local-db/client'
import { resolveTenantId } from '@/features/auth/stores/auth-store'

export type MessageTemplateType =
  | 'invoice'
  | 'shortage'
  | 'paid'
  | 'status'
  | 'product_info'
  | 'service_order_masuk'
  | 'service_order_selesai'

export const TEMPLATE_LABELS: Record<MessageTemplateType, string> = {
  invoice: 'Nota / Invoice',
  shortage: 'Kekurangan Pembayaran',
  paid: 'Pembayaran Lunas',
  status: 'Update Status Pesanan',
  product_info: 'Info Produk',
  service_order_masuk: 'Service Order (Baru Masuk)',
  service_order_selesai: 'Service Order (Selesai)',
}

export const TEMPLATE_VARIABLES: Record<MessageTemplateType, string[]> = {
  invoice: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name'],
  shortage: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name', 'remaining', 'status'],
  paid: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'change', 'payment_method', 'store_name', 'remaining', 'status'],
  status: ['code', 'date', 'customer_name', 'items', 'total', 'paid', 'remaining', 'status', 'change', 'payment_method', 'store_name'],
  product_info: ['product_name', 'price', 'stock', 'category'],
  service_order_masuk: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'estimated_completion', 'date', 'total', 'paid', 'remaining', 'items', 'change', 'payment_method', 'store_name'],
  service_order_selesai: ['code', 'customer_name', 'device', 'problem', 'status', 'cost', 'date', 'total', 'paid', 'remaining', 'items', 'change', 'payment_method', 'store_name'],
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

  service_order_selesai: `✅ *SERVICE SELESAI*
─────────────────
*No Service:* {{code}}
*Pelanggan:* {{customer_name}}
*Perangkat:* {{device}}
─────────────────
Pekerjaan telah selesai dan perangkat siap diambil.
*Total Biaya:* {{total}}
*Sudah Dibayar:* {{paid}}
*Sisa Tagihan:* {{remaining}}
─────────────────
Silakan tunjukkan pesan ini atau nomor service saat pengambilan. Terima kasih.`,
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match
  })
}

export const messageTemplateService = {
  async getTemplate(type: MessageTemplateType): Promise<string> {
    const tenantId = resolveTenantId()
    const override = await localDb.settings.get(`msg_template_${type}`)
    if (override && override.tenantId === tenantId && override.value.trim()) {
      return override.value
    }
    return DEFAULT_TEMPLATES[type]
  },

  async render(type: MessageTemplateType, variables: Record<string, string>): Promise<string> {
    const template = await this.getTemplate(type)
    return renderTemplate(template, variables)
  },

  async setOverride(type: MessageTemplateType, value: string): Promise<void> {
    const tenantId = resolveTenantId()
    const now = new Date().toISOString()
    await localDb.settings.put({
      id: `msg_template_${type}`,
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
    await localDb.settings.delete(`msg_template_${type}`)
  },
}
