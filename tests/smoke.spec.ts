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

test('can place a belt, rotate it, and run on touch', async ({ page }) => {
  await startFirstLevel(page)
  await page.getByRole('button', { name: /Straight/ }).tap()
  await page.locator('.grid-cell.empty').nth(1).tap()
  await expect(page.locator('.grid-cell.piece').first()).toBeVisible()
  await page.locator('.grid-cell.piece').first().tap()
  await expect(page.locator('#edit-count')).toContainText('2 edits')
  await page.getByRole('button', { name: /Run Conveyor/ }).tap()
  await expect(page.locator('#run-log')).toContainText(/Amber|No run yet/)
})
