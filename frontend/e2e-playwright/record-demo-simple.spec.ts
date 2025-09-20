import { test } from '@playwright/test'

test.describe('Record Demo', () => {
  test('demo AWS Security mind map', async ({ page }) => {
    // Navigate to home
    await page.goto('/')
    await page.waitForSelector('.mind-map-list')
    await page.waitForTimeout(1000)

    // Click on AWS Security mind map
    await page.click('text=AWS Security Best Practices')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Show the mind map with some interactions
    const canvas = page.locator('canvas')
    
    // Pan around slowly
    await page.mouse.move(400, 300)
    await page.mouse.down()
    await page.mouse.move(300, 400, { steps: 20 })
    await page.mouse.up()
    await page.waitForTimeout(1000)

    // Zoom out to show full view
    for (let i = 0; i < 3; i++) {
      await page.click('button[aria-label="Zoom out"]')
      await page.waitForTimeout(300)
    }
    await page.waitForTimeout(1500)

    // Click on a node
    await canvas.click({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(1000)

    // Double-click to show edit capability
    await canvas.dblclick({ position: { x: 400, y: 300 } })
    await page.waitForTimeout(1000)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Reset view
    await page.click('button:has-text("Reset")')
    await page.waitForTimeout(1500)

    // Go back to list
    await page.click('text=← Back to List')
    await page.waitForSelector('.mind-map-list')
    await page.waitForTimeout(1000)
  })
})