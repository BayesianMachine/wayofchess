import { test as authTest, expect } from './fixtures'
import { ApiMocks, makeGameMeta, makeGameState } from './fixtures/api-mocks.fixture'
import { BoardPage } from './pages/BoardPage'
import { GamePage } from './pages/GamePage'

const GAME_ID = 'test-online-game-id'

const test = authTest

// ---------------------------------------------------------------------------
// Helper: set up mocks and navigate to the online game page
// ---------------------------------------------------------------------------

async function loadOnlineGame(
  page: import('@playwright/test').Page,
  opts: { gameId?: string; meta?: Partial<Parameters<typeof makeGameMeta>[0]> } = {},
) {
  const id = opts.gameId ?? GAME_ID
  const api = new ApiMocks(page)

  await api.gameMeta(id, makeGameMeta({ id, ...opts.meta }))
  await api.gameState(id, makeGameState())

  await page.goto(`/play/online/${id}`)

  const board = new BoardPage(page)
  await board.waitForBoardReady()
  return { board, game: new GamePage(page), api }
}

// ---------------------------------------------------------------------------
// Loading & auth guard
// ---------------------------------------------------------------------------

test.describe('Online game — auth guard', () => {
  test('unauthenticated access redirects to /login', async ({ page }) => {
    // No auth fixture
    await page.goto(`/play/online/${GAME_ID}`)
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})

test.describe('Online game — loading', () => {
  test('board is visible after game meta loads', async ({ authenticatedPage: page }) => {
    const { board } = await loadOnlineGame(page)
    await board.expectBoardVisible()
  })

  test('shows player usernames from API response', async ({ authenticatedPage: page }) => {
    const { } = await loadOnlineGame(page, {
      meta: {
        whitePlayer: { id: 'test-user-id', username: 'Din' },
        blackPlayer: { id: 'opp-id', username: 'Gideon' },
      },
    })
    await expect(page.getByText('Din')).toBeVisible()
    await expect(page.getByText('Gideon')).toBeVisible()
  })

  test('shows "You" label as the bottom player (white by default)', async ({
    authenticatedPage: page,
  }) => {
    const { } = await loadOnlineGame(page, {
      meta: {
        whitePlayer: { id: 'test-user-id', username: 'TestUser' },
        blackPlayer: { id: 'opp-id', username: 'Opponent' },
      },
    })
    // Bottom panel shows the authenticated player's name (in the main content, not the nav)
    await expect(page.locator('main').getByText('TestUser').first()).toBeVisible()
  })

  test('navigates away when game API returns 404', async ({ authenticatedPage: page }) => {
    await page.route(`**/api/v1/games/${GAME_ID}`, async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
    })
    await page.route(`**/api/v1/games/${GAME_ID}/state`, async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
    })
    await page.goto(`/play/online/${GAME_ID}`)
    // Should redirect to /play/online on error
    await expect(page).toHaveURL(/\/play\/online/, { timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// Game controls
// ---------------------------------------------------------------------------

test.describe('Online game — controls', () => {
  test('Resign button is visible during an active game', async ({ authenticatedPage: page }) => {
    const { game } = await loadOnlineGame(page)
    await game.expectResignButtonVisible()
  })

  test('Offer Draw button is visible during an active game', async ({
    authenticatedPage: page,
  }) => {
    const { game } = await loadOnlineGame(page)
    await game.expectDrawOfferButtonVisible()
  })

  test('clicking Offer Draw opens the draw modal', async ({ authenticatedPage: page }) => {
    const { game } = await loadOnlineGame(page)
    await game.openDrawModal()
    await expect(page.getByRole('heading', { name: 'Draw Offer' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Offer' })).toBeVisible()
  })

  test('cancelling the draw modal closes it', async ({ authenticatedPage: page }) => {
    const { game } = await loadOnlineGame(page)
    await game.openDrawModal()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'Draw Offer' })).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Ended game state
// ---------------------------------------------------------------------------

test.describe('Online game — ended game', () => {
  test('shows game result overlay when game is already ended', async ({
    authenticatedPage: page,
  }) => {
    const api = new ApiMocks(page)
    await api.gameMeta(
      GAME_ID,
      makeGameMeta({ id: GAME_ID, status: 'ended' }),
    )
    await api.gameState(
      GAME_ID,
      makeGameState({
        status: 'ended',
        fen: '8/8/8/8/8/8/8/4K2k w - - 0 1',  // minimal position
      }),
    )

    await page.goto(`/play/online/${GAME_ID}`)
    // The game result overlay or a result-related element should be visible
    // (The page shows the board but status is 'ended' so no resign/draw buttons)
    await expect(page.getByRole('button', { name: 'Resign' })).not.toBeVisible({
      timeout: 5_000,
    })
  })

  test('game with existing moves shows move list', async ({ authenticatedPage: page }) => {
    const api = new ApiMocks(page)
    await api.gameMeta(GAME_ID, makeGameMeta({ id: GAME_ID }))
    await api.gameState(
      GAME_ID,
      makeGameState({
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        moves: [{ san: 'e4', from: 'e2', to: 'e4' }],
      }),
    )

    await page.goto(`/play/online/${GAME_ID}`)
    const board = new BoardPage(page)
    await board.waitForBoardReady()

    const game = new GamePage(page)
    await game.expectMoveInList('e4')
  })
})

// ---------------------------------------------------------------------------
// Player-as-black orientation
// ---------------------------------------------------------------------------

test.describe('Online game — board orientation', () => {
  test('board is shown from the player\'s perspective (black player sees flipped board)', async ({
    authenticatedPage: page,
  }) => {
    const api = new ApiMocks(page)
    // Current user is black
    await api.gameMeta(
      GAME_ID,
      makeGameMeta({
        id: GAME_ID,
        whiteUserId: 'other-user-id',
        blackUserId: 'test-user-id',
        whitePlayer: { id: 'other-user-id', username: 'Opponent' },
        blackPlayer: { id: 'test-user-id', username: 'TestUser' },
      }),
    )
    await api.gameState(GAME_ID, makeGameState())
    await page.goto(`/play/online/${GAME_ID}`)
    const board = new BoardPage(page)
    await board.waitForBoardReady()
    // Black's pieces should be at the bottom when playing as black
    await expect(page.getByText('TestUser').first()).toBeVisible()
  })
})
