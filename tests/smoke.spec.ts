import { expect, test } from '@playwright/test'

async function startFirstLevel(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Glassworks' })).toBeVisible()
  await page.getByRole('button', { name: /Enter the Studio|Continue to Map/ }).click()
  await expect(page.getByLabel('Apprentice Studio levels')).toBeVisible()
  const helpDialog = page.getByRole('dialog', { name: 'How to Play' })
  if (await helpDialog.isVisible()) await helpDialog.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: /Build the Line/ }).click()
  await expect(page.getByText('Build Grid')).toBeVisible()
}

test('loads conveyor builder UI', async ({ page }) => {
  await startFirstLevel(page)
  await expect(page.locator('.tool-card').first()).toBeVisible()
  await expect(page.locator('.grid-cell').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Run Conveyor/ })).toBeVisible()
  await page.screenshot({ path: 'test-results/glassworks-smoke.png', fullPage: true })
})

test('can select a gate colour, place a belt, rotate it, and run on touch', async ({ page }) => {
  await startFirstLevel(page)
  await page.getByRole('button', { name: /Straight/ }).tap()
  await page.locator('.grid-cell.empty').nth(1).tap()
  await expect(page.locator('.grid-cell.piece').first()).toBeVisible()
  await page.locator('.grid-cell.piece').first().tap()
  await expect(page.locator('#edit-count')).toContainText('2 edits')
  await page.getByRole('button', { name: /Run Conveyor/ }).tap()
  await expect(page.locator('#run-log')).toContainText(/Amber|No run yet/)
})

test('gate colour picker can choose non-amber gates', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('glassworks-save-v1', JSON.stringify({ version: 1, settings: { defaultSpeed: 'relaxed', sound: true, reducedMotion: false, highContrast: false, loopRelaxed: true, seenIntro: true, seenHelp: true }, completed: { 'apprentice-01': 1, 'apprentice-02': 1 }, results: {} })))
  await page.reload()
  await expect(page.getByLabel('Apprentice Studio levels')).toBeVisible()
  await page.getByRole('button', { name: /Amber Gate/ }).click()
  await expect(page.getByText('Gate colour')).toBeVisible()
  await page.getByRole('button', { name: /Cobalt gate colour/ }).tap()
  await expect(page.getByRole('button', { name: /Cobalt gate colour/ })).toHaveClass(/selected/)
})

test('continue after solving opens next level directly', async ({ page }) => {
  await startFirstLevel(page)
  await page.getByRole('button', { name: /Straight/ }).tap()
  await page.locator('.grid-cell').nth(6).tap()
  await page.locator('.grid-cell').nth(7).tap()
  await page.locator('.grid-cell').nth(8).tap()
  await page.getByRole('button', { name: /Run Conveyor/ }).tap()
  await expect(page.getByRole('dialog', { name: 'Conveyor Solved' })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /Next: First Turn/ }).tap()
  await expect(page.getByRole('heading', { name: 'First Turn' })).toBeVisible()
  await expect(page.getByText('Build Grid')).toBeVisible()
})
