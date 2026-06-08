import { expect, test } from '@playwright/test'

const REMOVED_ROUTES = [
  '/login',
  '/register',
  '/play/ai',
  '/play/ai/game',
  '/play/online',
  '/play/online/example-game',
  '/watch',
  '/watch/example-game',
  '/profile/me',
  '/profile/example-user',
] as const

test.describe('Local-only navigation', () => {
  test('root is the local setup screen with no platform navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
    await expect(page.getByRole('navigation')).toHaveCount(0)
    await expect(page.getByText(/log in|register|play online|watch|spectat|rating/i)).toHaveCount(0)
    await expect(page.getByText(/play vs ai|computer/i)).toHaveCount(0)
  })

  test('legacy local setup redirects to root', async ({ page }) => {
    await page.goto('/play/local')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
  })

  test('legacy local game redirects to the active game route', async ({ page }) => {
    await page.goto('/play/local/game')
    await expect(page).toHaveURL(/\/game$/)
    await expect(page.locator('[role="grid"]')).toBeVisible()
  })

  for (const route of REMOVED_ROUTES) {
    test(`${route} redirects to local setup`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
    })
  }

  test('unknown routes redirect to local setup', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
  })

  test('setup and gameplay make no backend or socket requests', async ({ page }) => {
    const forbiddenRequests: string[] = []
    const sockets: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (/\/api(?:\/|$)|socket\.io|localhost:3001|127\.0\.0\.1:3001/i.test(url)) {
        forbiddenRequests.push(url)
      }
    })
    page.on('websocket', (socket) => {
      const url = new URL(socket.url())
      const isViteDevSocket =
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
        url.port === '5173'
      if (!isViteDevSocket) sockets.push(socket.url())
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page).toHaveURL(/\/game$/)
    await expect(page.locator('[role="grid"]')).toBeVisible()

    expect(forbiddenRequests).toEqual([])
    expect(sockets).toEqual([])
  })
})
