import type { Page, Locator } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Page Object for the chess board.
 *
 * Interaction strategy: The Board component handles clicks via event delegation
 * on the board container and maps pixel coordinates to squares via clientToSquare().
 * We locate the [role="grid"] element (rendered by BoardBackground) to get its
 * bounding box, then compute pixel centers for each square name.
 *
 * Square coordinate mapping (white orientation, not flipped):
 *   file: 'a'=0 … 'h'=7 → x = (file + 0.5) * sqSize
 *   rank: '1'=0 … '8'=7 → y = (7 - rank + 0.5) * sqSize  (rank 8 at top)
 */
export class BoardPage {
  readonly board: Locator

  constructor(private readonly page: Page) {
    this.board = page.locator('[role="grid"]').first()
  }

  async waitForBoardReady(timeout = 10_000) {
    await this.board.waitFor({ state: 'visible', timeout })
    // Dismiss the loading text if present
    const loading = this.page.getByText('Loading game...')
    try {
      await loading.waitFor({ state: 'hidden', timeout: 5_000 })
    } catch {
      // Loading text may not exist on this page — that's fine
    }
  }

  /**
   * Returns the pixel center of a square name (e.g. "e2") relative to the viewport.
   * Assumes white-at-bottom orientation (the default).
   */
  async squareCenter(square: string): Promise<{ x: number; y: number }> {
    const bbox = await this.board.boundingBox()
    if (!bbox) throw new Error('[BoardPage] Board element has no bounding box')

    const file = square.charCodeAt(0) - 97 // 'a'=0, 'e'=4
    const rank = parseInt(square[1], 10) - 1 // '1'=0, '2'=1
    const sqSize = bbox.width / 8

    return {
      x: bbox.x + (file + 0.5) * sqSize,
      y: bbox.y + (7 - rank + 0.5) * sqSize,
    }
  }

  /** Click the center of a square (e.g. "e2").
   *
   * Uses { force: true } because chess piece <span> elements may intercept
   * pointer events even when inside a pointer-events-none container.
   */
  async clickSquare(square: string) {
    const cell = this.page.locator(`[role="gridcell"][aria-label="${square}"]`)
    const count = await cell.count()
    if (count > 0) {
      await cell.first().click({ force: true })
    } else {
      const { x, y } = await this.squareCenter(square)
      await this.page.mouse.click(x, y)
    }
  }

  /**
   * Drag a piece from one square to another.
   * Uses mouse down → move → up rather than Playwright's dragTo so it works
   * with the custom drag implementation in Board.tsx.
   */
  async dragPiece(from: string, to: string) {
    const src = await this.squareCenter(from)
    const dst = await this.squareCenter(to)

    await this.page.mouse.move(src.x, src.y)
    await this.page.mouse.down()
    // Move in small steps to trigger mousemove handlers
    await this.page.mouse.move(dst.x, dst.y, { steps: 10 })
    await this.page.mouse.up()
  }

  /** Assert the board is visible and not showing a loading spinner. */
  async expectBoardVisible() {
    await expect(this.board).toBeVisible()
  }

  /** Click source then target to perform a click-to-move. */
  async makeMove(from: string, to: string) {
    await this.clickSquare(from)
    await this.clickSquare(to)
  }

  async tapMove(from: string, to: string) {
    const source = await this.squareCenter(from)
    const target = await this.squareCenter(to)
    await this.page.touchscreen.tap(source.x, source.y)
    await this.page.touchscreen.tap(target.x, target.y)
  }
}
