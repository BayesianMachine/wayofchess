import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Page Object for the Matchmaking / Play Online page (/play/online).
 */
export class MatchmakingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/play/online')
    // Wait for auth to restore before interacting
    await expect(this.page.getByRole('heading', { name: 'Play Online' })).toBeVisible({
      timeout: 10_000,
    })
  }

  // ---------------------------------------------------------------------------
  // Time control selection
  // ---------------------------------------------------------------------------

  /** Click a time control pill by its label (e.g. "5+3", "1+0"). */
  async selectTimeControl(label: string) {
    // getByRole is most reliable here — confirmed working by the "shows bullet time controls" test
    const btn = this.page.getByRole('button', { name: label }).first()
    await btn.waitFor({ state: 'visible', timeout: 10_000 })
    await btn.click()
  }

  /** Return the label of the currently selected time control pill. */
  async getSelectedTimeControl(): Promise<string> {
    // The active button has class "active" added alongside other Tailwind classes
    const active = this.page.locator('button.active').first()
    return (await active.textContent()) ?? ''
  }  // ---------------------------------------------------------------------------
  // Find Game
  // ---------------------------------------------------------------------------

  async clickFindGame() {
    await this.page.getByRole('button', { name: 'Find Game' }).click()
  }

  async clickCancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click()
  }

  async expectSearchingVisible() {
    await expect(this.page.getByText('Finding your opponent...')).toBeVisible()
  }

  async expectSearchingHidden() {
    await expect(this.page.getByText('Finding your opponent...')).not.toBeVisible()
  }

  // ---------------------------------------------------------------------------
  // Challenge link
  // ---------------------------------------------------------------------------

  async clickChallengeAFriend() {
    await this.page.getByRole('button', { name: 'Challenge a friend' }).click()
  }

  /** Returns the invite URL displayed inside the challenge modal code block. */
  async getChallengeUrl(): Promise<string> {
    const code = this.page.locator('code').first()
    return (await code.textContent()) ?? ''
  }

  async clickCopyButton() {
    await this.page.getByRole('button', { name: /copy/i }).first().click()
  }

  async expectCopiedConfirmation() {
    await expect(this.page.getByRole('button', { name: /copied/i })).toBeVisible()
  }

  async closeChallengeModal() {
    await this.page.getByRole('button', { name: 'Close' }).click()
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  async expectCategoryHeadings() {
    for (const cat of ['Bullet', 'Blitz', 'Rapid', 'Classical']) {
      await expect(this.page.getByRole('heading', { name: cat })).toBeVisible()
    }
  }

  async expectQueueSizeVisible() {
    await expect(this.page.getByText(/player.*searching in/i)).toBeVisible()
  }
}
