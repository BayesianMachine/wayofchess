import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const webRoot = path.resolve(import.meta.dirname, '..')
const source = path.join(webRoot, 'public/favicon.svg')
const output = path.join(webRoot, 'public/icons')

await mkdir(output, { recursive: true })

const browser = await chromium.launch()

async function render(name, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.goto(`file:///${source.replaceAll('\\', '/')}`)
  await page.screenshot({
    path: path.join(output, name),
    omitBackground: false,
  })
  await page.close()
}

await render('icon-192.png', 192)
await render('icon-512.png', 512)
await render('icon-maskable-512.png', 512)
await render('apple-touch-icon.png', 180)

await browser.close()
