import { apiPost } from '@/services/api/client'

type PresignResponse = {
  ok: boolean
  presignedUrl: string
  publicUrl: string
  message?: string
}

export async function uploadImageToR2(file: File): Promise<string> {
  const res = await apiPost<PresignResponse>('/upload/presign', {
    filename: file.name,
    contentType: file.type,
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

export function isR2Configured(): boolean {
  return !!import.meta.env.VITE_API_BASE_URL
}
