import { test, expect } from '@playwright/test'
import { ApiMocks } from './fixtures/api-mocks.fixture'

test.describe('Auth — Login', () => {
  let api: ApiMocks

  test.beforeEach(async ({ page }) => {
    api = new ApiMocks(page)
    await api.login()
    // Register mock needed because login calls register's follow-up login
    await api.register()
  })

  test('login page renders required fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('main').getByRole('heading', { name: /log in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.locator('form').getByRole('button', { name: /^log in$/i })).toBeVisible()
  })

  test('successful login redirects away from /login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Password1')
    await page.locator('form').getByRole('button', { name: /^log in$/i }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('API error on login shows error message', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INVALID_CREDENTIALS' }),
      })
    })
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('bad@example.com')
    await page.getByLabel(/password/i).fill('wrongpass')
    await page.locator('form').getByRole('button', { name: /^log in$/i }).click()
    await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible({ timeout: 3_000 })
  })

  test.skip('login button is disabled while submitting', async ({ page }) => {
    // Block the login response so we can observe the loading state
    let resolveLogin: () => void
    await page.route('**/api/v1/auth/login', async (route) => {
      await new Promise<void>((r) => {
        resolveLogin = r
      })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'tok',
          refreshToken: 'rt',
          user: { id: '1', username: 'u', avatarUrl: null, factionPreference: 'auto' },
        }),
      })
    })
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Password1')
    await page.locator('form').getByRole('button', { name: /^log.?in$/i }).click()
    // While the request is pending, the submit button should be in a loading state
    // (disabled attribute OR changed text like "Logging in...")
    const submitBtn = page.locator('form button[type="submit"]')
    await expect(async () => {
      const isDisabled = await submitBtn.isDisabled()
      const text = await submitBtn.textContent()
      const isLoading = isDisabled || /loading|logging|submitting/i.test(text ?? '')
      expect(isLoading).toBe(true)
    }).toPass({ timeout: 3_000 })
    // Let the request finish so the test teardown is clean
    resolveLogin!()
  })
})

test.describe('Auth — Register', () => {
  test('register page renders all fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /register|create account/i })).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByLabel(/confirm/i)).toBeVisible()
  })

  test('mismatched confirm password shows validation error before API call', async ({ page }) => {
    // If the API were called it would fail this test (no mock set up)
    await page.goto('/register')
    await page.getByLabel(/username/i).fill('newuser')
    await page.getByLabel(/email/i).fill('new@example.com')
    await page.getByLabel(/^password$/i).fill('Password1')
    await page.getByLabel(/confirm/i).fill('Different1')
    await page.locator('form').getByRole('button', { name: /register/i }).click()
    // Use exact text to avoid matching the "Confirm Password" label
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 2_000 })
  })

  test('password too short shows validation error before API call', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel(/username/i).fill('newuser')
    await page.getByLabel(/email/i).fill('new@example.com')
    await page.getByLabel(/^password$/i).fill('short')
    await page.getByLabel(/confirm/i).fill('short')
    await page.locator('form').getByRole('button', { name: /register/i }).click()
    await expect(page.getByText(/8|too short|length/i)).toBeVisible({ timeout: 2_000 })
  })

  test('successful registration logs in and redirects', async ({ page }) => {
    const api = new ApiMocks(page)
    await api.register()
    await api.login()

    await page.goto('/register')
    await page.getByLabel(/username/i).fill('newuser')
    await page.getByLabel(/email/i).fill('new@example.com')
    await page.getByLabel(/^password$/i).fill('Password1')
    await page.getByLabel(/confirm/i).fill('Password1')
    await page.locator('form').getByRole('button', { name: /register/i }).click()
    // After registration → auto-login → redirect away from /register
    await expect(page).not.toHaveURL(/\/register/, { timeout: 6_000 })
  })

  test('duplicate username shows error message from API', async ({ page }) => {
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'USERNAME_TAKEN' }),
      })
    })
    await page.goto('/register')
    await page.getByLabel(/username/i).fill('taken')
    await page.getByLabel(/email/i).fill('taken@example.com')
    await page.getByLabel(/^password$/i).fill('Password1')
    await page.getByLabel(/confirm/i).fill('Password1')
    await page.locator('form').getByRole('button', { name: /register/i }).click()
    await expect(page.getByText(/taken|exists|conflict/i)).toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Auth — Navigation links', () => {
  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    // The in-page link is in the paragraph below the form; scope to main to avoid the header
    const link = page.locator('main, [role="main"], form ~ p, p').getByRole('link', { name: /register/i }).last()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register')
    const link = page.locator('main, [role="main"], form ~ p, p').getByRole('link', { name: /log in/i }).last()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/login/)
  })
})
