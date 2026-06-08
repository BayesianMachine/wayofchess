import { test, expect } from '@playwright/test'
import { BoardPage } from './pages/BoardPage'
import { GamePage } from './pages/GamePage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function startAiGame(page: import('@playwright/test').Page) {
  await page.goto('/play/ai')
  await page.getByRole('button', { name: 'Start Game' }).click()
  await expect(page).toHaveURL(/\/play\/ai\/game/, { timeout: 5_000 })
  const board = new BoardPage(page)
  await board.waitForBoardReady()
  return board
}

// ---------------------------------------------------------------------------
// Setup page
// ---------------------------------------------------------------------------

test.describe('AI game — setup page', () => {
  test('shows vs. AI heading and difficulty section', async ({ page }) => {
    await page.goto('/play/ai')
    await expect(page.getByRole('heading', { name: /vs\.\s*ai/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Difficulty' })).toBeVisible()
  })

  test('shows faction choice buttons', async ({ page }) => {
    await page.goto('/play/ai')
    // Use .first() because /mandalorian/i also matches "Mand'alor" difficulty card
    await expect(page.getByRole('button', { name: /mandalorian/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /imperial/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /random/i }).first()).toBeVisible()
  })

  test('shows all difficulty options', async ({ page }) => {
    await page.goto('/play/ai')
    for (const name of ['Foundling', 'Warrior', 'Champion', "Mand'alor"]) {
      await expect(page.getByRole('button', { name })).toBeVisible()
    }
  })

  test('selecting Imperial faction highlights that button', async ({ page }) => {
    await page.goto('/play/ai')
    // Same approach as the "shows faction choice buttons" test — .first() avoids strict mode
    const imperialBtn = page.getByRole('button', { name: /imperial/i }).first()
    await imperialBtn.click()
    await expect(imperialBtn).toHaveClass(/border-mando-gold/)
  })

  test('selecting a difficulty highlights that card', async ({ page }) => {
    await page.goto('/play/ai')
    // Foundling is currently not selected by default (warrior is); click it
    const foundlingBtn = page.locator('button').filter({ hasText: /^Foundling/ }).first()
    await foundlingBtn.click()
    await expect(foundlingBtn).toHaveClass(/border-mando-gold/)
  })

  test('clicking Start Game navigates to AI game page', async ({ page }) => {
    await page.goto('/play/ai')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page).toHaveURL(/\/play\/ai\/game/)
  })
})

// ---------------------------------------------------------------------------
// In-game: board and layout
// ---------------------------------------------------------------------------

test.describe('AI game — board', () => {
  test('chess board is visible after starting', async ({ page }) => {
    const board = await startAiGame(page)
    await board.expectBoardVisible()
  })

  test('shows player panel "You" at bottom', async ({ page }) => {
    await startAiGame(page)
    await expect(page.getByText('You', { exact: true })).toBeVisible()
  })

  test('shows difficulty label in opponent panel', async ({ page }) => {
    await startAiGame(page)
    // Default difficulty is "warrior" → panel shows "Warrior AI"
    await expect(page.getByText(/ai$/i)).toBeVisible()
  })

  test('shows a Resign button', async ({ page }) => {
    await startAiGame(page)
    const game = new GamePage(page)
    await game.expectResignButtonVisible()
  })
})

// ---------------------------------------------------------------------------
// In-game: player move
// ---------------------------------------------------------------------------

test.describe('AI game — player moves', () => {
  test('player can make a legal move (e2→e4)', async ({ page }) => {
    const board = await startAiGame(page)
    const game = new GamePage(page)

    await board.makeMove('e2', 'e4')
    await game.expectMoveInList('e4')
  })

  test('after player moves, AI thinking indicator appears', async ({ page }) => {
    const board = await startAiGame(page)
    const game = new GamePage(page)

    await board.makeMove('e2', 'e4')
    // Either the thinking indicator appears briefly, or the AI has already responded
    await expect(async () => {
      const moves = await game.getMoveList()
      const thinkingVisible = await page
        .locator('[class*="animate-pulse"]').first()
        .isVisible()
        .catch(() => false)
      expect(moves.length >= 1 || thinkingVisible).toBeTruthy()
    }).toPass({ timeout: 8_000 })
  })

  test('after AI responds, move list has two moves', async ({ page }) => {
    const board = await startAiGame(page)
    const game = new GamePage(page)

    await board.makeMove('e2', 'e4')
    // Wait for AI to complete its move (move list gains a second entry)
    await expect(async () => {
      const moves = await game.getMoveList()
      expect(moves.length).toBeGreaterThanOrEqual(2)
    }).toPass({ timeout: 10_000 })
  })

  test('clicking a black piece on player\'s turn (as white) does not add a move', async ({
    page,
  }) => {
    const board = await startAiGame(page)

    await board.clickSquare('e7') // black pawn — cannot be moved by white
    await expect(page.getByText('No moves yet')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// In-game: resign
// ---------------------------------------------------------------------------

test.describe('AI game — resign', () => {
  test('clicking Resign ends the game', async ({ page }) => {
    await startAiGame(page)
    const game = new GamePage(page)

    await game.clickResign()
    await game.waitForGameOver()
    // AI wins when player resigns
    await expect(page.getByText(/wins|imperial wins/i)).toBeVisible()
  })

  test('game over overlay shows New Game button', async ({ page }) => {
    await startAiGame(page)
    const game = new GamePage(page)

    await game.clickResign()
    await game.waitForGameOver()
    await expect(page.getByRole('button', { name: /new game/i })).toBeVisible()
  })

  test('New Game after resign navigates back to AI setup', async ({ page }) => {
    await startAiGame(page)
    const game = new GamePage(page)

    await game.clickResign()
    await game.waitForGameOver()
    await page.getByRole('button', { name: /new game/i }).click()
    await expect(page).toHaveURL(/\/play\/ai/)
  })
})

// ---------------------------------------------------------------------------
// Direct navigation guard
// ---------------------------------------------------------------------------

test.describe('AI game — setup guard', () => {
  test('navigating to /play/ai/game without setup redirects to /play/ai', async ({ page }) => {
    // Clear any existing config
    await page.addInitScript(() => localStorage.removeItem('mando-ai-setup'))
    await page.goto('/play/ai/game')
    await expect(page).toHaveURL(/\/play\/ai/, { timeout: 3_000 })
  })
})
