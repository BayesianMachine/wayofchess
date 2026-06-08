import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Page Object for in-game actions shared by local, AI, and online game pages.
 */
export class GamePage {
  constructor(private readonly page: Page) {}

  // ---------------------------------------------------------------------------
  // Resign
  // ---------------------------------------------------------------------------

  /**
   * Click the resign button.
   * - Local game: side-specific buttons "Resign White" / "Resign Black"
   * - AI / online game: single "Resign" button
   */
  async clickResign(side?: 'white' | 'black') {
    if (side) {
      const label = side === 'white' ? 'Resign White' : 'Resign Black'
      await this.page.getByRole('button', { name: label }).click()
    } else {
      await this.page.getByRole('button', { name: 'Resign' }).click()
    }
  }

  // ---------------------------------------------------------------------------
  // Draw
  // ---------------------------------------------------------------------------

  /** Click the "Offer Draw" button to open the draw modal. */
  async openDrawModal() {
    await this.page.getByRole('button', { name: 'Offer Draw' }).click()
  }

  /**
   * Accept an incoming draw offer.
   * In the local game the Accept button is inside the Draw Offer modal.
   * In the online game the Accept button is in the banner at the top.
   */
  async acceptDraw() {
    await this.page.getByRole('button', { name: 'Accept' }).click()
  }

  /** Decline a draw offer (local game modal or online game banner). */
  async declineDraw() {
    await this.page.getByRole('button', { name: 'Decline' }).click()
  }

  /** Send draw offer from the modal (online game: "Send Offer"). */
  async sendDrawOffer() {
    await this.page.getByRole('button', { name: 'Send Offer' }).click()
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

  async expectResignButtonVisible(side?: 'white' | 'black') {
    const name = side ? (side === 'white' ? 'Resign White' : 'Resign Black') : 'Resign'
    await expect(this.page.getByRole('button', { name })).toBeVisible()
  }

  async expectDrawOfferButtonVisible() {
    await expect(this.page.getByRole('button', { name: 'Offer Draw' })).toBeVisible()
  }
}
