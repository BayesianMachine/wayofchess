import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/release-verification.spec.ts',
    },
    {
      name: 'tablet-landscape',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        hasTouch: true,
      },
      testMatch: ['**/local-game.spec.ts', '**/navigation.spec.ts'],
    },
    {
      name: 'release-tablet-1024x600',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 600 },
        hasTouch: true,
      },
      testMatch: '**/release-verification.spec.ts',
    },
    {
      name: 'release-tablet-1280x800',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        hasTouch: true,
      },
      testMatch: '**/release-verification.spec.ts',
    },
    {
      name: 'release-tablet-1366x768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        hasTouch: true,
      },
      testMatch: '**/release-verification.spec.ts',
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
