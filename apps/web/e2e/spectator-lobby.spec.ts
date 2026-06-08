import { test, expect } from '@playwright/test'

test.describe('Spectator lobby', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the lobby API
    await page.route('**/api/v1/games/lobby', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'game-1',
            whitePlayer: { username: 'Din Djarin' },
            blackPlayer: { username: 'Moff Gideon' },
            timeControl: { label: '5+3', category: 'Blitz' },
            startedAt: new Date(Date.now() - 120_000).toISOString(),
            spectatorCount: 5,
            moveCount: 20,
          },
        ]),
      })
    })
  })

  test('shows live games list', async ({ page }) => {
    await page.goto('/watch')
    await expect(page.getByText(/Din Djarin/i)).toBeVisible()
    await expect(page.getByText(/Moff Gideon/i)).toBeVisible()
  })

  test('shows category filter pills', async ({ page }) => {
    await page.goto('/watch')
    await expect(page.getByText(/All/i)).toBeVisible()
  })

  test('shows empty state when no games', async ({ page }) => {
    await page.route('**/api/v1/games/lobby', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.goto('/watch')
    await expect(page.getByText(/no live games/i)).toBeVisible()
  })
})
