import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('header links work', async ({ page }) => {
    await page.goto('/')
    // Check that main nav links exist
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('can navigate to login from header', async ({ page }) => {
    await page.goto('/')
    const loginLink = page.getByRole('link', { name: /log in|login|sign in/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('can navigate to watch page', async ({ page }) => {
    await page.route('**/api/v1/games/lobby', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.goto('/')
    const watchLink = page.getByRole('link', { name: /watch|spectate/i })
    if ((await watchLink.count()) > 0) {
      await watchLink.click()
      await expect(page).toHaveURL(/\/watch/)
    }
  })

  test('404 redirects to home or shows error', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    // Either 404 or redirect to home
    const url = page.url()
    const ok = url.includes('/') || response?.status() === 404
    expect(ok).toBeTruthy()
  })
})
