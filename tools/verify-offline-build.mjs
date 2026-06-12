import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'apps/web/dist')
const requiredPieces = [
  'mando-king',
  'mando-queen',
  'mando-bishop',
  'mando-knight',
  'mando-rook',
  'mando-pawn',
  'imperial-king',
  'imperial-queen',
  'imperial-bishop',
  'imperial-knight',
  'imperial-rook',
  'imperial-pawn',
]
const requiredIcons = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
]

async function exists(relativePath) {
  await access(path.join(dist, relativePath))
}

function fail(message) {
  throw new Error(`Offline build verification failed: ${message}`)
}

const [html, manifestText, worker, assetNames] = await Promise.all([
  readFile(path.join(dist, 'index.html'), 'utf8'),
  readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'),
  readFile(path.join(dist, 'sw.js'), 'utf8'),
  readdir(path.join(dist, 'assets')),
])
const manifest = JSON.parse(manifestText)

if (manifest.id !== '/wayofchess/' || manifest.scope !== '/wayofchess/') {
  fail('manifest ID and scope must be /wayofchess/')
}
if (manifest.start_url !== '/wayofchess/#/') {
  fail('manifest start URL is incorrect')
}
if ('orientation' in manifest) {
  fail('manifest must allow both portrait and landscape orientation')
}
if (!html.includes('/wayofchess/manifest.webmanifest')) {
  fail('index.html does not reference the scoped manifest')
}
if (!worker.includes('index.html') || !worker.includes('manifest.webmanifest')) {
  fail('service worker does not precache the navigation shell')
}

for (const icon of requiredIcons) {
  await exists(icon)
  if (!worker.includes(icon)) fail(`${icon} is not precached`)
}
for (const piece of requiredPieces) {
  const emitted = assetNames.find(
    (name) => name.startsWith(`${piece}-redesign-`) && name.endsWith('.png')
  )
  if (!emitted) fail(`${piece}-redesign.png was not emitted`)
  if (!worker.includes(`assets/${emitted}`)) fail(`${emitted} is not precached`)
}

const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith('/wayofchess/'))
for (const reference of references) {
  const relativePath = reference.slice('/wayofchess/'.length)
  if (relativePath) await exists(relativePath)
}

const scannedFiles = ['index.html', ...assetNames.filter((name) => /\.(?:js|css)$/.test(name))]
const forbidden = [
  /(?:fetch|import)\(\s*["'`]https?:\/\//i,
  /https?:\/\/(?:cdn\.|unpkg\.com|jsdelivr\.net)/i,
  /(?:localhost|127\.0\.0\.1):3001/i,
  /\/api(?:\/|["'`])/i,
  /socket\.io/i,
  /fonts\.(?:googleapis|gstatic)\.com/i,
]
for (const relativePath of scannedFiles) {
  const text = await readFile(
    relativePath === 'index.html'
      ? path.join(dist, relativePath)
      : path.join(dist, 'assets', relativePath),
    'utf8'
  )
  for (const pattern of forbidden) {
    if (pattern.test(text)) fail(`${relativePath} contains forbidden runtime reference ${pattern}`)
  }
}

console.log(
  `Offline build verified: ${requiredPieces.length} character assets, ${requiredIcons.length} icons, scoped manifest, and complete precache.`
)
