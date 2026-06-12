import { apiPost } from '@/services/api/client'

type PresignResponse = {
  ok: boolean
  presignedUrl: string
  publicUrl: string
  message?: string
}

type UploadFolder = 'products' | 'company' | 'invoices' | 'uploads'

export async function uploadImageToR2(file: File, folder: UploadFolder = 'uploads'): Promise<string> {
  const res = await apiPost<PresignResponse>('/upload/presign', {
    filename: file.name,
    contentType: file.type,
    folder,
  })

  if (!res.ok || !res.presignedUrl) {
    throw new Error(res.message ?? 'Gagal mendapatkan URL upload')
  }

  const uploadRes = await fetch(res.presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  if (!uploadRes.ok) {
    throw new Error('Gagal mengunggah file ke penyimpanan')
  }

  return res.publicUrl
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

export function isR2Configured(): boolean {
  return !!import.meta.env.VITE_API_BASE_URL
}
