import { expect, test } from '@playwright/test'
import { BoardPage } from '../e2e/pages/BoardPage'
import { GamePage } from '../e2e/pages/GamePage'

async function selectRelease(
  request: import('@playwright/test').APIRequestContext,
  release: 'a' | 'b'
) {
  await request.post(`http://127.0.0.1:4173/__release/${release}`)
}

async function waitForServiceWorker(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
}

test.beforeEach(async ({ request }) => {
  await selectRelease(request, 'a')
})

test('manifest is installable and every gameplay asset works offline', async ({
  page,
  context,
}) => {
  await page.goto('./')
  await waitForServiceWorker(page)

  const manifest = await page.request.get(
    'http://127.0.0.1:4173/wayofchess/manifest.webmanifest'
  )
  expect(manifest.ok()).toBeTruthy()
  expect(await manifest.json()).toMatchObject({
    id: '/wayofchess/',
    start_url: '/wayofchess/#/',
    scope: '/wayofchess/',
    display: 'standalone',
    orientation: 'landscape',
  })

  await page.reload()
  await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /pass.*play/i })).toBeVisible()

  await page.getByRole('button', { name: 'Start Game' }).click()
  const board = new BoardPage(page)
  await board.waitForBoardReady()
  await expect(page.locator('img')).toHaveCount(32)
  await board.makeMove('e2', 'e4')
  await expect(page.getByText('e4', { exact: true })).toBeVisible()
  const game = new GamePage(page)
  await game.clickResign('black')
  await game.waitForGameOver()

  await page.goto('http://127.0.0.1:4173/wayofchess/#/history')
  await expect(page.getByRole('heading', { name: 'Game History' })).toBeVisible()
  await expect(page.getByText(/1-0.*resignation/i)).toBeVisible()
  await page.goto('http://127.0.0.1:4173/wayofchess/#/data')
  await expect(page.getByRole('heading', { name: 'Backup & Data' })).toBeVisible()
})

test('waiting release defers during play and preserves history after activation', async ({
  page,
  request,
}) => {
  await page.goto('./')
  await waitForServiceWorker(page)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-app-version', 'release-a')

  await page.getByRole('button', { name: 'Start Game' }).click()
  const board = new BoardPage(page)
  await board.waitForBoardReady()
  await board.makeMove('e2', 'e4')

  await selectRelease(request, 'b')
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.update()
  })
  await expect(page.getByText('Update available after this game.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apply Update' })).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-app-version', 'release-a')

  const game = new GamePage(page)
  await game.clickResign('black')
  await game.waitForGameOver()
  await expect(page.getByRole('button', { name: 'Apply Update' })).toBeVisible()
  await page.getByRole('button', { name: 'Apply Update' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-app-version', 'release-b')

  await page.goto('http://127.0.0.1:4173/wayofchess/#/history')
  await expect(page.getByText(/1-0.*resignation/i)).toBeVisible()
  await expect(page.getByText(/1 moves/i)).toBeVisible()
})
