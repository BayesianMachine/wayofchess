import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'

const webRoot = path.resolve(import.meta.dirname, '..')
const basePath = '/wayofchess/'
let release = 'a'

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1:4173')
  if (request.method === 'POST' && url.pathname.startsWith('/__release/')) {
    const requested = url.pathname.split('/').at(-1)
    if (requested === 'a' || requested === 'b') release = requested
    response.writeHead(204)
    response.end()
    return
  }

  if (!url.pathname.startsWith(basePath)) {
    response.writeHead(404)
    response.end('Not found')
    return
  }

  const dist = path.join(webRoot, `dist-pwa-${release}`)
  let relative = decodeURIComponent(url.pathname.slice(basePath.length)) || 'index.html'
  let file = path.resolve(dist, relative)
  if (!file.startsWith(dist)) {
    response.writeHead(400)
    response.end('Invalid path')
    return
  }
  try {
    await access(file)
  } catch {
    relative = 'index.html'
    file = path.join(dist, relative)
  }

  response.setHeader('Cache-Control', 'no-cache')
  response.setHeader('Service-Worker-Allowed', basePath)
  response.setHeader('Content-Type', contentTypes[path.extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(response)
}).listen(4173, '127.0.0.1')
