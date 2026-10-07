import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173/game-glassworks/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173/game-glassworks/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'webkit-ipad', use: { ...devices['iPad Pro 11'], browserName: 'webkit', hasTouch: true } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'], browserName: 'chromium', hasTouch: true } },
  ],
})
