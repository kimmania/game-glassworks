import { expect, test } from '@playwright/test'

async function startFirstLevel(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Glassworks' })).toBeVisible()
  await page.getByRole('button', { name: /Enter the Studio|Continue to Map/ }).click()
  await expect(page.getByLabel('Apprentice Studio levels')).toBeVisible()
  const helpDialog = page.getByRole('dialog', { name: 'How to Play' })
  if (await helpDialog.isVisible()) {
    await helpDialog.getByRole('button', { name: 'Close' }).click()
  }
  await page.getByRole('button', { name: /First Crate/ }).click()
  await expect(page.getByText('Bench Setup')).toBeVisible()
  await page.getByRole('button', { name: /Begin/ }).click()
  await expect(page.getByText('Packed Crate')).toBeVisible()
}

test('loads, starts level, and shows crate sorting UI', async ({ page }) => {
  await startFirstLevel(page)
  await expect(page.locator('.crate-cell.exposed').first()).toBeVisible()
  await expect(page.locator('.cooling-slot.empty').first()).toBeVisible()
  await expect(page.locator('.kiln').first()).toBeVisible()
  await expect(page.locator('#action-banner')).toContainText('Pull an exposed top globe')
  await page.screenshot({ path: 'test-results/glassworks-smoke.png', fullPage: true })
})

test('touch flow pulls from crate, stages in slot, and feeds matching kiln', async ({ page }) => {
  await startFirstLevel(page)
  const firstCrate = page.locator('.crate-cell.exposed').first()
  const label = await firstCrate.getAttribute('aria-label')
  const color = label?.match(/^(.+?) crate globe/)?.[1] ?? 'Amber'
  await firstCrate.tap()
  await expect(page.locator('#action-banner')).toContainText(`Selected ${color}`)
  await page.locator('.cooling-slot.empty').first().tap()
  await expect(page.locator('.cooling-slot.filled').first()).toBeVisible()
  await page.locator('.cooling-slot.filled').first().tap()
  await expect(page.locator('#action-banner')).toContainText(`Selected ${color}`)
  await page.getByRole('button', { name: new RegExp(`${color} kiln`) }).tap()
  await expect(page.locator('#action-banner')).toContainText('Pull an exposed top globe')
  await expect(page.locator('#move-count')).toContainText('2 moves')
})
