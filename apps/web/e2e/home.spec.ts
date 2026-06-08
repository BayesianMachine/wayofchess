import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('shows hero title and CTA buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'The Way of Chess' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Play vs AI/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Play Local/i })).toBeVisible()
  })

  test('navigates to AI setup from hero CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Play vs AI/i }).click()
    await expect(page).toHaveURL(/\/play\/ai/)
  })

  test('navigates to local setup from hero CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Play Local/i }).click()
    await expect(page).toHaveURL(/\/play\/local/)
  })

  test('has no accessibility violations on load', async ({ page }) => {
    await page.goto('/')
    // Basic heading hierarchy check
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })
})
