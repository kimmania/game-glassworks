import { expect, test } from '@playwright/test'

test('loads, starts level, and shows playable Glassworks UI', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Glassworks' })).toBeVisible()
  await page.getByRole('button', { name: /Enter the Studio|Continue to Map/ }).click()
  await expect(page.getByLabel('Apprentice Studio levels')).toBeVisible()
  const helpDialog = page.getByRole('dialog', { name: 'How to Play' })
  if (await helpDialog.isVisible()) {
    await helpDialog.getByRole('button', { name: 'Close' }).click()
  }
  await page.getByRole('button', { name: /First Fire/ }).click()
  await expect(page.getByText('Speed Setting')).toBeVisible()
  await page.getByRole('button', { name: /Begin/ }).click()
  await expect(page.getByText('Forehearth')).toBeVisible()
  await expect(page.locator('.globe.on-belt').first()).toBeVisible()
  await expect(page.locator('.kiln').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/glassworks-smoke.png', fullPage: true })
})
