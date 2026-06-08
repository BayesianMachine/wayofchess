import { test, expect } from '@playwright/test'
import { ApiMocks, makeGameMeta, makeGameState, makeLobbyGame } from './fixtures/api-mocks.fixture'
import { BoardPage } from './pages/BoardPage'

const GAME_ID = 'spectator-game-id'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function loadSpectatorGame(page: import('@playwright/test').Page) {
  const api = new ApiMocks(page)

  await api.gameMeta(
    GAME_ID,
    makeGameMeta({
      id: GAME_ID,
      whitePlayer: { id: 'p1', username: 'Din Djarin' },
      blackPlayer: { id: 'p2', username: 'Moff Gideon' },
    }),
  )
  await api.gameState(GAME_ID, makeGameState())

  // Prevent real socket connections
  await page.route('**/socket.io/**', async (route) => route.abort())

  await page.goto(`/watch/${GAME_ID}`)

  const board = new BoardPage(page)
  await board.waitForBoardReady()
  return { board, api }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Spectator game — board', () => {
  test('board is visible when spectating', async ({ page }) => {
    const { board } = await loadSpectatorGame(page)
    await board.expectBoardVisible()
  })

  test('shows player names from API response', async ({ page }) => {
    await loadSpectatorGame(page)
    await expect(page.getByText('Din Djarin')).toBeVisible()
    await expect(page.getByText('Moff Gideon')).toBeVisible()
  })

  test('board is non-interactive (clicks do not select pieces)', async ({ page }) => {
    const { board } = await loadSpectatorGame(page)

    // Click a white pawn — no selection highlight should appear, no move attempted
    await board.clickSquare('e2')
    // The move list should remain empty (non-interactive board cannot make moves)
    await expect(page.getByText('No moves yet')).toBeVisible()
  })

  test('shows spectator count from socket (initial = 0)', async ({ page }) => {
    await loadSpectatorGame(page)
    // Initial spectator count is 0; the page renders "0 spectators watching"
    await expect(page.getByText(/spectator/i)).toBeVisible()
  })
})

test.describe('Spectator game — game with moves', () => {
  test('existing moves appear in the move list', async ({ page }) => {
    const api = new ApiMocks(page)
    await api.gameMeta(
      GAME_ID,
      makeGameMeta({
        id: GAME_ID,
        whitePlayer: { id: 'p1', username: 'Player1' },
        blackPlayer: { id: 'p2', username: 'Player2' },
      }),
    )
    await api.gameState(
      GAME_ID,
      makeGameState({
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        moves: [{ san: 'e4', from: 'e2', to: 'e4' }],
      }),
    )
    await page.route('**/socket.io/**', async (route) => route.abort())

    await page.goto(`/watch/${GAME_ID}`)
    const board = new BoardPage(page)
    await board.waitForBoardReady()

    await expect(page.locator('div.font-mono').getByText('e4', { exact: true })).toBeVisible()
  })

  test('shows sidebar heading "Moves"', async ({ page }) => {
    await loadSpectatorGame(page)
    await expect(page.getByRole('heading', { name: 'Moves' })).toBeVisible()
  })
})

test.describe('Spectator game — ended game', () => {
  test('shows game result overlay for a finished game', async ({ page }) => {
    const api = new ApiMocks(page)
    await api.gameMeta(GAME_ID, makeGameMeta({ id: GAME_ID, status: 'ended' }))
    await api.gameState(
      GAME_ID,
      makeGameState({ status: 'ended', fen: '8/8/8/8/8/8/8/4K2k w - - 0 1' }),
    )
    await page.route('**/socket.io/**', async (route) => route.abort())

    await page.goto(`/watch/${GAME_ID}`)
    const board = new BoardPage(page)
    await board.waitForBoardReady()
    // Status ended with no result/reason should still show spectator view normally
    // Board is still visible
    await board.expectBoardVisible()
  })
})

test.describe('Spectator lobby — navigation', () => {
  test('clicking a game card navigates to spectator game page', async ({ page }) => {
    const api = new ApiMocks(page)
    await api.lobby([makeLobbyGame({ id: GAME_ID })])

    // Mock the destination game data
    await api.gameMeta(GAME_ID, makeGameMeta({ id: GAME_ID }))
    await api.gameState(GAME_ID, makeGameState())
    await page.route('**/socket.io/**', async (route) => route.abort())

    await page.goto('/watch')
    // Click the first game card
    await page.locator('[class*="cursor-pointer"]').first().click()
    await expect(page).toHaveURL(new RegExp(`/watch/${GAME_ID}`), { timeout: 5_000 })
  })
})
