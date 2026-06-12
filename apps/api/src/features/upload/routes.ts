import { Hono } from 'hono'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Endpoint = process.env.R2_ENDPOINT
const r2AccessKey = process.env.R2_ACCESS_KEY_ID
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME ?? 'vitpos-uploads'
const publicUrlBase = process.env.R2_PUBLIC_URL ?? ''

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const allowedFolders = ['products', 'company', 'invoices', 'uploads'] as const

type UploadFolder = typeof allowedFolders[number]

function toUploadFolder(value: unknown): UploadFolder {
  return allowedFolders.includes(value as UploadFolder) ? value as UploadFolder : 'uploads'
}

export const uploadRoutes = new Hono()

uploadRoutes.post('/presign', async (c) => {
  try {
    if (!r2Endpoint || !r2AccessKey || !r2SecretKey) {
      return c.json({ ok: false, message: 'R2 tidak dikonfigurasi. Hubungi admin.' }, 501)
    }

    const body = await c.req.json()
    const filename = (body.filename as string ?? '').trim()
    const contentType = (body.contentType as string ?? '').trim()
    const folder = toUploadFolder(body.folder)

    if (!filename || !contentType) {
      return c.json({ ok: false, message: 'filename dan contentType wajib diisi.' }, 400)
    }

    if (!allowedTypes.includes(contentType)) {
      return c.json({ ok: false, message: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.' }, 400)
    }

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey,
      },
    })

    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const r2Key = `${folder}/${crypto.randomUUID()}-${safeName}`

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })
    const publicUrl = publicUrlBase ? `${publicUrlBase.replace(/\/$/, '')}/${r2Key}` : presignedUrl.split('?')[0]

    return c.json({ ok: true, presignedUrl, publicUrl, key: r2Key })
  } catch (error) {
    console.error('R2 presign error:', error)
    return c.json({ ok: false, message: 'Gagal membuat URL upload. Periksa konfigurasi R2.' }, 500)
  }
})
