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
  await page.getByRole('button', { name: /First Fire/ }).click()
  await expect(page.getByText('Speed Setting')).toBeVisible()
  await page.getByRole('button', { name: /Begin/ }).click()
  await expect(page.getByText('Forehearth')).toBeVisible()
}

test('loads, starts level, and shows playable Glassworks UI', async ({ page }) => {
  await startFirstLevel(page)
  await expect(page.locator('.globe.on-belt').first()).toBeVisible()
  await expect(page.locator('.kiln').first()).toBeVisible()
  await expect(page.locator('#action-banner')).toContainText('Tap a moving globe')
  await page.screenshot({ path: 'test-results/glassworks-smoke.png', fullPage: true })
})

test('tap selection, pause, restart, clear, and kiln placement work on touch', async ({ page }) => {
  await startFirstLevel(page)
  await expect(page.getByRole('button', { name: 'Pause' })).toBeEnabled()
  await page.getByRole('button', { name: 'Pause' }).tap()
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
  await expect(page.locator('.globe.on-belt').first()).toBeVisible()
  const firstGlobe = page.locator('.globe.on-belt').first()
  const label = await firstGlobe.getAttribute('aria-label')
  const color = label?.replace(' globe', '') ?? 'Amber'
  await firstGlobe.tap({ force: true })
  await expect(page.locator('#selected-globe-readout')).toContainText(`${color} — tap the ${color} kiln`)
  await expect(page.getByRole('button', { name: 'Restart' })).toBeEnabled()
  await page.getByRole('button', { name: 'Clear Selection' }).tap()
  await expect(page.locator('#selected-globe-readout')).toContainText('None — tap a moving globe.')
  await page.locator('.globe.on-belt').first().tap({ force: true })
  const selected = await page.locator('#selected-globe-readout').textContent()
  const selectedColor = selected?.split(' ')[1] ?? 'Amber'
  await page.getByRole('button', { name: new RegExp(`${selectedColor} kiln`) }).tap()
  await expect(page.locator('#selected-globe-readout')).toContainText('None — tap a moving globe.')
  await page.getByRole('button', { name: 'Resume' }).tap()
})
