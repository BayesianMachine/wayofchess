import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-pwa',
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173/wayofchess/',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  },
  webServer: {
    command: 'node tools/pwa-test-server.mjs',
    url: 'http://127.0.0.1:4173/wayofchess/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
