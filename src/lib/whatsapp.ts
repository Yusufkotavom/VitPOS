export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.substring(1)}` : cleanPhone
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`
}
