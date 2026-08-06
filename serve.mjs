import { spawn } from 'node:child_process'
import { existsSync, createReadStream, statSync } from 'node:fs'
import { createServer, request as httpRequest } from 'node:http'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.PORT ?? 3000)
const API_PORT = 3010
const DIST = '/app/dist'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
}

const apiProcess = spawn('npx', ['tsx', 'apps/api/src/server.ts'], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: 'inherit',
})

apiProcess.on('error', (err) => {
  console.error('[vitpos] failed to start API:', err)
  process.exit(1)
})

function proxyApi(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${API_PORT}`)
  const upstream = httpRequest(
    {
      host: '127.0.0.1',
      port: API_PORT,
      path: url.pathname + url.search,
      method: req.method,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode, upstreamRes.headers)
      upstreamRes.pipe(res)
    },
  )

  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: false, message: 'API unavailable' }))
  })

  req.pipe(upstream)
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  let filePath = join(DIST, url.pathname === '/' ? 'index.html' : url.pathname)
  const normalized = normalize(filePath)

  if (!normalized.startsWith(normalize(DIST))) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  if (!existsSync(normalized) || statSync(normalized).isDirectory()) {
    if (url.pathname !== '/') {
      const indexHtml = join(DIST, 'index.html')
      if (existsSync(indexHtml)) {
        res.writeHead(200, { 'content-type': MIME['.html'] })
        createReadStream(indexHtml).pipe(res)
        return
      }
    }
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const type = MIME[extname(normalized)] || 'application/octet-stream'
  res.writeHead(200, { 'content-type': type })
  createReadStream(normalized).pipe(res)
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname.startsWith('/api/')) {
    proxyApi(req, res)
    return
  }
  serveStatic(req, res)
})

server.listen(PORT, () => {
  console.log(`[vitpos] serving web on :${PORT} (dist=${DIST}), API on :${API_PORT}`)
})

function shutdown() {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
