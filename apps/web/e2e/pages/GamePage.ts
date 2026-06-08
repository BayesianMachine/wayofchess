import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Page Object for local in-game actions.
 */
export class GamePage {
  constructor(private readonly page: Page) {}

  // ---------------------------------------------------------------------------
  // Resign
  // ---------------------------------------------------------------------------

  /**
   * Click the side-specific local resign button.
   */
  async clickResign(side: 'white' | 'black') {
    const label = side === 'white' ? 'Resign White' : 'Resign Black'
    await this.page.getByRole('button', { name: label }).click()
  }

  // ---------------------------------------------------------------------------
  // Draw
  // ---------------------------------------------------------------------------

  /** Click the "Offer Draw" button to open the draw modal. */
  async openDrawModal() {
    await this.page.getByRole('button', { name: 'Offer Draw' }).click()
  }

  /** Accept the local draw offer. */
  async acceptDraw() {
    await this.page.getByRole('button', { name: 'Accept' }).click()
  }

  /** Decline the local draw offer. */
  async declineDraw() {
    await this.page.getByRole('button', { name: 'Decline' }).click()
  }

  // ---------------------------------------------------------------------------
  // Move list
  // ---------------------------------------------------------------------------

  /**
   * Return all SAN strings visible in the move list.
   * Skips the move-number labels (e.g. "1.", "2.") and the empty-state text.
   */
  async getMoveList(): Promise<string[]> {
    const spans = await this.page
      .locator('div[class*="font-mono"] span')
      .allTextContents()

    return spans
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !/^\d+\.$/.test(t) && t !== 'No moves yet')
  }

  // ---------------------------------------------------------------------------
  // Game end
  // ---------------------------------------------------------------------------

  /** Wait for the GameResultOverlay to appear (game is over). */
  async waitForGameOver(timeout = 15_000) {
    // The GameResultOverlay renders result text ("White wins", "Draw", etc.)
    await this.page
      .locator('[data-testid="game-result-overlay"], .game-result-overlay')
      .or(this.page.getByText(/wins|draw|stalemate|checkmate|resigned/i))
      .first()
      .waitFor({ state: 'visible', timeout })
  }

  /** Return the visible game result text (winner announcement). */
  async getGameResultText(): Promise<string> {
    const overlay = this.page.getByText(/wins|draw|stalemate|checkmate|resigned/i).first()
    return (await overlay.textContent()) ?? ''
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  async expectMoveInList(san: string, timeout = 8_000) {
    // Target the move list DIV specifically (not the clock span that also carries font-mono)
    await expect(
      this.page.locator('div[class*="font-mono"]').first(),
    ).toContainText(san, { timeout })
  }

  async expectResignButtonVisible(side: 'white' | 'black') {
    const name = side === 'white' ? 'Resign White' : 'Resign Black'
    await expect(this.page.getByRole('button', { name })).toBeVisible()
  }

  async expectDrawOfferButtonVisible() {
    await expect(this.page.getByRole('button', { name: 'Offer Draw' })).toBeVisible()
  }
}
