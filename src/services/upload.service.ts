import { useAuthStore } from '@/features/auth/stores/auth-store'

type UploadResponse = {
  ok: boolean
  url?: string
  key?: string
  message?: string
}

export type UploadFolder = 'products' | 'company' | 'invoices' | 'uploads'

/**
 * Upload an image to this server (not a cloud bucket). The API stores the file
 * under UPLOAD_DIR and returns a relative `/api/v1/upload/file/...` URL; we make
 * it absolute so it stays valid wherever the value is later rendered (product
 * card, invoice PDF, storefront on another host).
 */
export async function uploadImage(file: File, folder: UploadFolder = 'uploads'): Promise<string> {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)

  const headers: Record<string, string> = {}
  const user = useAuthStore.getState().currentUser
  if (user) headers['x-user-id'] = user.id

  const response = await fetch(`${baseUrl}/api/v1/upload`, {
    method: 'POST',
    headers,
    body: form,
  })

  const payload = (await response.json().catch(() => null)) as UploadResponse | null
  if (!response.ok || !payload?.ok || !payload.url) {
    throw new Error(payload?.message ?? `Gagal mengunggah gambar (${response.status})`)
  }

  return payload.url.startsWith('http')
    ? payload.url
    : `${window.location.origin}${payload.url}`
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}
