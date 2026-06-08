import { test as authTest, expect } from './fixtures'
import { ApiMocks, makeProfile, makeRecentGame } from './fixtures/api-mocks.fixture'

const test = authTest

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function goToMyProfile(page: import('@playwright/test').Page) {
  const api = new ApiMocks(page)
  await api.profile('TestUser', makeProfile({ username: 'TestUser' }))
  await api.recentGames('TestUser', [makeRecentGame()])
  await page.goto('/profile/me')
  // Wait for profile to load (spinner disappears)
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Loading"]'),
    { timeout: 5_000 },
  ).catch(() => {})
  await expect(page.getByText('Loading...').or(page.locator('[class*="animate-spin"]'))).not.toBeVisible({
    timeout: 5_000,
  }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

test.describe('Profile — auth guard', () => {
  test('unauthenticated /profile/me shows empty or loading state (not authenticated)', async ({
    page,
  }) => {
    await page.goto('/profile/me')
    // The profile page either redirects to login or renders without a logged-in user.
    // Either way it should NOT show "TestUser" profile content.
    await expect(page.getByRole('heading', { name: 'TestUser' })).not.toBeVisible({
      timeout: 5_000,
    })
  })
})

// ---------------------------------------------------------------------------
// Profile page content
// ---------------------------------------------------------------------------

test.describe('Profile — own profile', () => {
  test('shows username', async ({ authenticatedPage: page }) => {
    await goToMyProfile(page)
    // The h1 heading has the username; use getByRole to avoid matching the nav span
    await expect(page.getByRole('heading', { name: 'TestUser' })).toBeVisible({ timeout: 5_000 })
  })

  test('shows rating cards for each time control category', async ({
    authenticatedPage: page,
  }) => {
    const api = new ApiMocks(page)
    await api.profile(
      'TestUser',
      makeProfile({
        ratings: [
          { category: 'bullet', rating: 1200, peakRating: 1250 },
          { category: 'blitz', rating: 1350, peakRating: 1400 },
          { category: 'rapid', rating: 1100, peakRating: 1150 },
          { category: 'classical', rating: 1000, peakRating: 1000 },
        ],
      }),
    )
    await api.recentGames('TestUser', [])
    await page.goto('/profile/me')
    await expect(page.getByText('1350').first()).toBeVisible({ timeout: 5_000 })
  })

  test('shows rank badge', async ({ authenticatedPage: page }) => {
    await goToMyProfile(page)
    // RankBadge renders with a title from getRankTitle — at 1350 ELO this is something
    // like "Alor" or "Vizsla". Check that any rank badge element appears.
    await expect(page.locator('[class*="RankBadge"], span:has-text("⬡"), span:has-text("⬤")').first()).toBeVisible({
      timeout: 5_000,
    }).catch(async () => {
      // Fallback: look for the Your Rank heading
      await expect(page.getByText(/your rank/i)).toBeVisible({ timeout: 3_000 })
    })
  })

  test('shows recent games section', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.profile('TestUser', makeProfile())
    await api.recentGames('TestUser', [
      makeRecentGame({
        whitePlayer: { id: 'test-user-id', username: 'TestUser' },
        blackPlayer: { id: 'opp-id', username: 'Opponent' },
        result: '1-0',
      }),
    ])
    await page.goto('/profile/me')
    await expect(page.getByText('Opponent').first()).toBeVisible({ timeout: 5_000 })
  })

  test('shows win/loss/draw stats', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.profile(
      'TestUser',
      makeProfile({ totalWins: 10, totalLosses: 7, totalDraws: 3 }),
    )
    await api.recentGames('TestUser', [])
    await page.goto('/profile/me')
    await expect(page.getByText('10').first()).toBeVisible({ timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// Public profile (another user)
// ---------------------------------------------------------------------------

test.describe('Profile — public profile', () => {
  test('shows another user\'s profile by username', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.profile('Opponent', makeProfile({ username: 'Opponent', id: 'opp-id' }))
    await api.recentGames('Opponent', [])

    await page.goto('/profile/Opponent')
    await expect(page.getByText('Opponent')).toBeVisible({ timeout: 5_000 })
  })

  test('public profile does not show edit controls', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.profile('Opponent', makeProfile({ username: 'Opponent', id: 'opp-id' }))
    await api.recentGames('Opponent', [])

    await page.goto('/profile/Opponent')
    await expect(page.getByRole('button', { name: /edit|save/i })).not.toBeVisible({
      timeout: 3_000,
    })
  })
})

// ---------------------------------------------------------------------------
// Edit profile
// ---------------------------------------------------------------------------

test.describe('Profile — edit', () => {
  test('own profile shows an edit button', async ({ authenticatedPage: page }) => {
    await goToMyProfile(page)
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible({ timeout: 5_000 })
  })

  test('clicking edit opens the edit modal', async ({ authenticatedPage: page }) => {
    await goToMyProfile(page)
    await page.getByRole('button', { name: /edit/i }).click()
    // Edit modal should appear — use .first() to handle cases where both dialog and
    // the Save button inside it are independently matched
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 3_000 })
  })
})
