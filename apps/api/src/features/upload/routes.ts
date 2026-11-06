import { Hono } from 'hono'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'

/**
 * Local disk storage for uploaded images.
 *
 * This app self-hosts: files live under UPLOAD_DIR (default /app/uploads), a
 * Docker volume, so they survive redeploys. No cloud bucket is involved —
 * `POST /api/v1/upload` takes the file directly and `GET /api/v1/upload/file/...`
 * serves it back through the same `/api` proxy that serve.mjs exposes.
 */
const uploadRoot = resolve(process.env.UPLOAD_DIR ?? '/app/uploads')
const maxBytes = 5 * 1024 * 1024

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
const allowedFolders = ['products', 'company', 'invoices', 'uploads'] as const

type UploadFolder = typeof allowedFolders[number]

const mimeByExt: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
}

function toUploadFolder(value: unknown): UploadFolder {
	const asString = typeof value === 'string' ? value : ''
	return (allowedFolders as readonly string[]).includes(asString)
		? (asString as UploadFolder)
		: 'uploads'
}

function sanitizeName(name: string, contentType: string): string {
	const base = basename(name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')
	const ext = extname(base).toLowerCase()
	if (ext && mimeByExt[ext]) return base
	// Fall back to an extension that matches the declared MIME type.
	if (contentType === 'image/png') return `${base}.png`
	if (contentType === 'image/webp') return `${base}.webp`
	return `${base}.jpg`
}

export const uploadRoutes = new Hono()

// POST /api/v1/upload  (multipart/form-data: file, folder?)
uploadRoutes.post('/', async (c) => {
	try {
		const body = await c.req.parseBody()
		const file = body['file']
		const folder = toUploadFolder(body['folder'])

		if (!(file instanceof File)) {
			return c.json({ ok: false, message: 'File wajib diisi.' }, 400)
		}
		if (!(allowedTypes as readonly string[]).includes(file.type)) {
			return c.json({ ok: false, message: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.' }, 400)
		}
		if (file.size > maxBytes) {
			return c.json({ ok: false, message: 'Ukuran gambar maksimal 5MB.' }, 400)
		}

		const safeName = sanitizeName(file.name, file.type)
		const key = `${folder}/${randomUUID()}-${safeName}`

		await mkdir(join(uploadRoot, folder), { recursive: true })
		await writeFile(join(uploadRoot, key), Buffer.from(await file.arrayBuffer()))

		return c.json({ ok: true, key, url: `/api/v1/upload/file/${key}` })
	} catch (error) {
		console.error('upload error:', error)
		return c.json({ ok: false, message: 'Gagal menyimpan file.' }, 500)
	}
})

// GET /api/v1/upload/file/:folder/:name
uploadRoutes.get('/file/:folder/:name', async (c) => {
	const folder = toUploadFolder(c.req.param('folder'))
	const name = basename(c.req.param('name'))
	const folderRoot = join(uploadRoot, folder)
	const fullPath = join(folderRoot, name)

	// Defence in depth: basename already strips slashes, but never serve outside the folder.
	if (!resolve(fullPath).startsWith(resolve(folderRoot))) {
		return c.text('Forbidden', 403)
	}

	try {
		const info = await stat(fullPath)
		if (!info.isFile()) return c.text('Not found', 404)
	} catch {
		return c.text('Not found', 404)
	}

	const buffer = await readFile(fullPath)
	const contentType = mimeByExt[extname(name).toLowerCase()] ?? 'application/octet-stream'

	return new Response(buffer, {
		status: 200,
		headers: {
			'Content-Type': contentType,
			'Content-Length': String(buffer.byteLength),
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
})
