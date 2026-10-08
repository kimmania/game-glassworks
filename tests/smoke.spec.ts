import { expect, test } from '@playwright/test'

async function startFirstLevel(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Glassworks' })).toBeVisible()
  await page.getByRole('button', { name: /Enter the Studio|Continue to Map/ }).click()
  await expect(page.getByLabel('Apprentice Studio levels')).toBeVisible()
  const helpDialog = page.getByRole('dialog', { name: 'How to Play' })
  if (await helpDialog.isVisible()) await helpDialog.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: /First Switch/ }).click()
  await expect(page.getByText('Run Speed')).toBeVisible()
  await page.getByRole('button', { name: /Open Switchboard/ }).click()
  await expect(page.getByText('Incoming Sequence')).toBeVisible()
}

test('loads switch conveyor UI', async ({ page }) => {
  await startFirstLevel(page)
  await expect(page.locator('.seq-globe').first()).toBeVisible()
  await expect(page.locator('.gate-card').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Run Conveyor/ })).toBeVisible()
  await page.screenshot({ path: 'test-results/glassworks-smoke.png', fullPage: true })
})

test('can change a gate and run conveyor on touch', async ({ page }) => {
  await startFirstLevel(page)
  await page.locator('.gate-card').first().tap()
  await expect(page.locator('#change-count')).toContainText('1 changes')
  await page.getByRole('button', { name: /Run Conveyor/ }).tap()
  await expect(page.locator('#run-log .log-row').first()).toBeVisible()
  await expect(page.locator('#attempt-count')).toContainText('1 runs')
})
