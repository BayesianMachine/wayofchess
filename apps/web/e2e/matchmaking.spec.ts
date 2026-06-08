import { test as authTest, expect } from './fixtures'
import { ApiMocks } from './fixtures/api-mocks.fixture'
import { MatchmakingPage } from './pages/MatchmakingPage'

// All tests use the authenticatedPage fixture so the matchmaking page is shown
// instead of redirecting to /login.
const test = authTest

test.describe('Matchmaking — time control selection', () => {
  test('shows Play Online heading', async ({ authenticatedPage: page }) => {
    const mm = new MatchmakingPage(page)
    await mm.goto()
    await expect(page.getByRole('heading', { name: 'Play Online' })).toBeVisible()
  })

  test('renders time controls grouped by category', async ({ authenticatedPage: page }) => {
    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.expectCategoryHeadings()
  })

  test('shows bullet time controls', async ({ authenticatedPage: page }) => {
    await page.goto('/play/online')
    // "1+0" is a common bullet control
    await expect(page.getByRole('button', { name: '1+0' })).toBeVisible()
  })

  test('clicking a time control pill selects it', async ({ authenticatedPage: page }) => {
    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.selectTimeControl('1+0')
    const selected = await mm.getSelectedTimeControl()
    // The selected button may include the category prefix (e.g. "Bullet 1+0")
    expect(selected.trim()).toContain('1+0')
  })

  test('shows queue size for the selected category', async ({ authenticatedPage: page }) => {
    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.expectQueueSizeVisible()
  })
})

test.describe('Matchmaking — find game flow', () => {
  test('clicking Find Game enters searching state', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.matchmakingJoin()
    await api.matchmakingLeave()

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickFindGame()
    await mm.expectSearchingVisible()
  })

  test('searching state shows elapsed seconds counter', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.matchmakingJoin()
    await api.matchmakingLeave()

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickFindGame()
    await expect(page.getByText(/searching for \d+s/i)).toBeVisible({ timeout: 3_000 })
  })

  test('Cancel button stops searching', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.matchmakingJoin()
    await api.matchmakingLeave()

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickFindGame()
    await mm.expectSearchingVisible()
    await mm.clickCancel()
    await mm.expectSearchingHidden()
  })

  test('Find Game fails gracefully on API error', async ({ authenticatedPage: page }) => {
    await page.route('**/api/v1/matchmaking/join', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickFindGame()
    await expect(page.getByText(/failed to join|error/i)).toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Matchmaking — challenge link', () => {
  test('clicking "Challenge a friend" opens modal with invite URL', async ({
    authenticatedPage: page,
  }) => {
    const api = new ApiMocks(page)
    const inviteUrl = await api.challenge('some-game-id')

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickChallengeAFriend()

    await expect(page.getByRole('heading', { name: 'Challenge Link' })).toBeVisible()
    const url = await mm.getChallengeUrl()
    expect(url).toContain('some-game-id')
    expect(url).toContain(inviteUrl.replace(/^.*\/\/[^/]+/, ''))
  })

  test('Copy button appears in challenge modal', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.challenge()

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickChallengeAFriend()
    await expect(page.getByRole('button', { name: /^copy$/i })).toBeVisible()
  })

  test('closing the modal dismisses it', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.challenge()

    const mm = new MatchmakingPage(page)
    await mm.goto()
    await mm.clickChallengeAFriend()
    await expect(page.getByRole('heading', { name: 'Challenge Link' })).toBeVisible()
    await mm.closeChallengeModal()
    await expect(page.getByRole('heading', { name: 'Challenge Link' })).not.toBeVisible()
  })
})

test.describe('Matchmaking — auth guard', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    // No auth fixture — page should redirect
    await page.goto('/play/online')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
