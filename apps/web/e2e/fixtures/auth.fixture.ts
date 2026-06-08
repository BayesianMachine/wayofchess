import { test as base, type Page } from '@playwright/test'

const MOCK_USER = {
  id: 'test-user-id',
  username: 'TestUser',
  avatarUrl: null,
  factionPreference: 'auto' as const,
}

/**
 * Injects an authenticated session before each test by:
 *  1. Setting the Zustand persisted user in localStorage
 *  2. Setting a mock refresh token
 *  3. Mocking POST /api/v1/auth/refresh so restoreSession() succeeds
 *  4. Mocking GET /api/v1/matchmaking/status so pages that call it on mount don't fail
 */
async function injectAuthState(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem(
      'mando-auth',
      JSON.stringify({ state: { user }, version: 0 }),
    )
    localStorage.setItem('mando-refresh-token', 'mock-refresh-token')
  }, MOCK_USER)

  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'mock-access-token' }),
    })
  })

  // Silence matchmaking status polling that fires on /play/online
  await page.route('**/api/v1/matchmaking/status**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ queueSize: 3 }),
    })
  })

  // Prevent real socket.io connections in auth-required pages
  await page.route('**/socket.io/**', async (route) => {
    await route.abort()
  })
}

interface AuthFixtures {
  /** A page fixture that starts with an authenticated session pre-injected */
  authenticatedPage: Page
  mockUser: typeof MOCK_USER
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await injectAuthState(page)
    await use(page)
  },
  mockUser: async ({}, use) => {
    await use(MOCK_USER)
  },
})

export { expect } from '@playwright/test'
export { MOCK_USER }
