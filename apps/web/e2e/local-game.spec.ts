import { test, expect } from '@playwright/test'
import { BoardPage } from './pages/BoardPage'
import { GamePage } from './pages/GamePage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the local setup page, click Start Game, and wait for the board. */
async function startLocalGame(page: import('@playwright/test').Page) {
  await page.goto('/play/local')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page).toHaveURL(/\/play\/local\/game/, { timeout: 5_000 })
  const board = new BoardPage(page)
  await board.waitForBoardReady()
  return board
}

// ---------------------------------------------------------------------------
// Setup page tests
// ---------------------------------------------------------------------------

test.describe('Local game — setup page', () => {
  test('shows Pass & Play heading and Start Game button', async ({ page }) => {
    await page.goto('/play/local')
    await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
  })

  test('shows time control options', async ({ page }) => {
    await page.goto('/play/local')
    // At least one time control pill should be present (e.g. "No Clock")
    await expect(page.getByRole('button', { name: 'No Clock' })).toBeVisible()
  })

  test('clicking Start Game navigates to game page', async ({ page }) => {
    await page.goto('/play/local')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page).toHaveURL(/\/play\/local\/game/)
  })
})

// ---------------------------------------------------------------------------
// In-game: board visibility
// ---------------------------------------------------------------------------

test.describe('Local game — board', () => {
  test('chess board is visible after starting', async ({ page }) => {
    const board = await startLocalGame(page)
    await board.expectBoardVisible()
  })

  test('shows White and Black player panels', async ({ page }) => {
    await startLocalGame(page)
    await expect(page.getByText('White', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Black', { exact: true }).first()).toBeVisible()
  })

  test('move list starts empty ("No moves yet")', async ({ page }) => {
    await startLocalGame(page)
    await expect(page.getByText('No moves yet')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// In-game: chess moves
// ---------------------------------------------------------------------------

test.describe('Local game — chess moves', () => {
  test('legal pawn move (e2→e4) appears in move list', async ({ page }) => {
    const board = await startLocalGame(page)
    const game = new GamePage(page)

    // White's first move: e2 to e4
    await board.makeMove('e2', 'e4')

    // The move list should now contain "e4"
    await game.expectMoveInList('e4')
  })

  test('second move (d2→d4) is also recorded', async ({ page }) => {
    const board = await startLocalGame(page)
    const game = new GamePage(page)

    await board.makeMove('e2', 'e4')
    await game.expectMoveInList('e4')

    // Black's turn: d7→d5
    await board.makeMove('d7', 'd5')
    await game.expectMoveInList('d5')

    // White: d2→d4
    await board.makeMove('d2', 'd4')
    await game.expectMoveInList('d4')
  })

  test('clicking an empty square (no piece) does not add a move', async ({ page }) => {
    const board = await startLocalGame(page)
    const game = new GamePage(page)

    // e4 is empty at the start of the game
    await board.clickSquare('e4')

    // Move list should still say "No moves yet"
    await expect(page.getByText('No moves yet')).toBeVisible()
    const moves = await game.getMoveList()
    expect(moves).toHaveLength(0)
  })

  test('clicking a black piece on white\'s turn does not move it', async ({ page }) => {
    const board = await startLocalGame(page)

    // e7 has a black pawn — white cannot move it
    await board.clickSquare('e7')
    // No selection should be made (move list stays empty)
    await expect(page.getByText('No moves yet')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// In-game: resign
// ---------------------------------------------------------------------------

test.describe('Local game — resign', () => {
  test('Resign White button is visible during active game', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)
    await game.expectResignButtonVisible('white')
  })

  test('Resign Black button is visible during active game', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)
    await game.expectResignButtonVisible('black')
  })

  test('clicking Resign White ends the game', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.clickResign('white')
    await game.waitForGameOver()
    // Black wins because white resigned
    await expect(page.getByText(/black wins|imperial wins/i)).toBeVisible()
  })

  test('clicking Resign Black ends the game', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.clickResign('black')
    await game.waitForGameOver()
    await expect(page.getByText(/white wins|mandalorian wins/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// In-game: draw offer
// ---------------------------------------------------------------------------

test.describe('Local game — draw offer', () => {
  test('"Offer Draw" button is visible during active game', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)
    await game.expectDrawOfferButtonVisible()
  })

  test('clicking "Offer Draw" opens the Draw Offer modal', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.openDrawModal()
    await expect(page.getByRole('heading', { name: 'Draw Offer' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()
  })

  test('accepting the draw offer ends the game as a draw', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.openDrawModal()
    await game.acceptDraw()
    await game.waitForGameOver()
    await expect(page.getByRole('heading', { name: 'Draw', exact: true })).toBeVisible()
  })

  test('declining the draw offer closes the modal and resumes play', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.openDrawModal()
    await game.declineDraw()
    // Modal should be gone; game continues
    await expect(page.getByRole('heading', { name: 'Draw Offer' })).not.toBeVisible()
    await game.expectResignButtonVisible('white')
  })
})

// ---------------------------------------------------------------------------
// In-game: game-over navigation
// ---------------------------------------------------------------------------

test.describe('Local game — game over overlay', () => {
  test('game over overlay has "New Game" button that goes back to setup', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.clickResign('white')
    await game.waitForGameOver()

    await page.getByRole('button', { name: /new game/i }).click()
    await expect(page).toHaveURL(/\/play\/local/)
  })

  test('game over overlay has "Home" button', async ({ page }) => {
    await startLocalGame(page)
    const game = new GamePage(page)

    await game.clickResign('black')
    await game.waitForGameOver()

    await expect(page.getByRole('button', { name: /home/i })).toBeVisible()
  })
})
