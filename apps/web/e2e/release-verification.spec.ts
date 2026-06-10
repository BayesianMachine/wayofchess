import path from 'node:path'
import { expect, test } from '@playwright/test'
import { TIME_CONTROLS } from '../src/features/local-game/config/timeControls'
import { BoardPage } from './pages/BoardPage'

async function startGame(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'No Clock' }).click()
  await page.getByRole('button', { name: 'Start Game' }).click()
  const board = new BoardPage(page)
  await board.waitForBoardReady()
  return board
}

test.describe('Release tablet verification', () => {
  test('every time control starts a game and controls meet the touch target minimum', async ({
    page,
  }) => {
    await page.goto('/')

    const controls = [...TIME_CONTROLS.map((control) => control.label), 'No Clock']
    for (const label of controls) {
      const button = page.getByRole('button', { name: label })
      await button.click()
      await expect(button).toHaveClass(/border-mando-gold/)
      await page.getByRole('button', { name: 'Start Game' }).click()
      await expect(page.locator('[role="grid"]')).toBeVisible()
      await page.goto('/data')
      await page.getByRole('button', { name: 'Reset Local Data' }).click()
      await page.getByRole('button', { name: 'Confirm Reset' }).click()
      await expect(page.getByRole('button', { name: 'Start Game' })).toBeVisible()
    }

    for (const control of TIME_CONTROLS) {
      const button = page.getByRole('button', { name: control.label })
      await expect(button).toBeVisible()
    }

    const buttons = page.getByRole('button')
    const count = await buttons.count()
    for (let index = 0; index < count; index += 1) {
      const button = buttons.nth(index)
      if (!(await button.isVisible())) continue
      const box = await button.boundingBox()
      expect(box, `button ${index} should have a bounding box`).not.toBeNull()
      expect(box!.height, `button ${index} height`).toBeGreaterThanOrEqual(44)
      expect(box!.width, `button ${index} width`).toBeGreaterThanOrEqual(44)
    }
  })

  test('tap-only gameplay fits the viewport and prevents disruptive selection', async ({
    page,
  }, testInfo) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    const board = await startGame(page)
    await board.tapMove('e2', 'e4')
    await expect(page.getByText('e4', { exact: true })).toBeVisible()

    const layout = await page.evaluate(() => {
      const boardElement = document.querySelector('.chess-board')
      const styles = boardElement ? getComputedStyle(boardElement) : null
      return {
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        touchAction: styles?.touchAction,
        userSelect: styles?.userSelect,
      }
    })

    expect(layout.scrollHeight).toBeLessThanOrEqual(layout.viewportHeight)
    expect(layout.touchAction).toBe('manipulation')
    expect(layout.userSelect).toBe('none')
    expect(errors).toEqual([])

    if (
      process.env.CAPTURE_PHASE6_EVIDENCE === '1' &&
      testInfo.project.name.startsWith('release-tablet-')
    ) {
      await page.screenshot({
        path: path.resolve(
          process.cwd(),
          '../../docs/local-only-design/evidence/phase-6',
          `${testInfo.project.name.replace('release-tablet-', 'game-')}.png`
        ),
        fullPage: true,
      })
    }
  })

  test('touch promotion presents and applies the promotion choices', async ({ page }) => {
    const now = Date.now()
    const fen = '8/P7/8/8/8/8/7p/4K2k w - - 0 1'
    const backup = {
      format: 'mandalorian-chess-backup',
      version: 1,
      exportedAt: now,
      activeGame: {
        id: 'promotion-touch-game',
        recordVersion: 1,
        startingFen: fen,
        currentFen: fen,
        moves: [],
        status: 'active',
        result: null,
        endReason: null,
        timeControlBaseSec: 0,
        timeControlIncSec: 0,
        startedAt: now,
        updatedAt: now,
        completedAt: null,
        finalWhiteMs: null,
        finalBlackMs: null,
      },
      clock: null,
      completedGames: [],
      preferences: null,
    }

    await page.goto('/data')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'promotion.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    })
    await expect(page.getByRole('status')).toContainText('imported successfully')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.getByRole('button', { name: 'Resume' }).click()

    const board = new BoardPage(page)
    await board.waitForBoardReady()
    await board.tapMove('a7', 'a8')
    await expect(page.getByRole('button', { name: 'Promote to q' })).toBeVisible()
    await page.getByRole('button', { name: 'Promote to q' }).click()
    await expect(page.getByText('a8=Q+', { exact: true })).toBeVisible()
  })

  test('portrait mode presents the rotate guard instead of a broken board', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: 1024 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Rotate to landscape' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /pass.*play/i })).not.toBeVisible()
  })

  test('reduced motion suppresses application animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const duration = await page.getByRole('button', { name: 'Start Game' }).evaluate((element) =>
      getComputedStyle(element).transitionDuration
    )
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001)
  })
})
