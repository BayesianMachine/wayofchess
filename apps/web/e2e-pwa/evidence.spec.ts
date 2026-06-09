import path from 'node:path'
import { expect, test } from '@playwright/test'
import { BoardPage } from '../e2e/pages/BoardPage'

test('captures Phase 5 production evidence', async ({ page, context }) => {
  test.skip(process.env.CAPTURE_PWA_EVIDENCE !== '1')
  const evidence = path.resolve(
    process.cwd(),
    '../../docs/local-only-design/evidence/phase-5'
  )

  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
  await page.screenshot({
    path: path.join(evidence, 'production-setup.png'),
    fullPage: true,
  })

  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Start Game' }).click()
  const board = new BoardPage(page)
  await board.waitForBoardReady()
  await page.screenshot({
    path: path.join(evidence, 'offline-tablet-game.png'),
    fullPage: true,
  })
})
