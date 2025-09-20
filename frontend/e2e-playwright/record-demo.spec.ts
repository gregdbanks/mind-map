import { test } from '@playwright/test'
import { saveVideo } from 'playwright-video'

test.describe('Record Demo GIF', () => {
  test('record mind map interactions demo', async ({ page, context }) => {
    // Start recording
    const capture = await saveVideo(page, 'demo-raw.mp4')

    try {
      // 1. Navigate to home and show the list
      await page.goto('/')
      await page.waitForSelector('.mind-map-list')
      await page.waitForTimeout(1000)

      // 2. Click on AWS Security mind map
      await page.click('text=AWS Security Best Practices')
      await page.waitForSelector('canvas', { timeout: 10000 })
      await page.waitForTimeout(2000)

      // 3. Pan around to show the full mind map
      const canvas = await page.locator('canvas')
      
      // Slow pan to show different areas
      await page.mouse.move(400, 300)
      await page.mouse.down()
      await page.mouse.move(300, 400, { steps: 20 })
      await page.mouse.up()
      await page.waitForTimeout(500)

      // Pan to another area
      await page.mouse.move(300, 400)
      await page.mouse.down()
      await page.mouse.move(500, 200, { steps: 20 })
      await page.mouse.up()
      await page.waitForTimeout(500)

      // 4. Zoom out to show full view
      await page.click('button[aria-label="Zoom out"]')
      await page.waitForTimeout(300)
      await page.click('button[aria-label="Zoom out"]')
      await page.waitForTimeout(300)
      await page.click('button[aria-label="Zoom out"]')
      await page.waitForTimeout(1000)

      // 5. Click on a node to select it
      await canvas.click({ position: { x: 400, y: 300 } })
      await page.waitForTimeout(500)

      // 6. Double-click to edit
      await canvas.dblclick({ position: { x: 400, y: 300 } })
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape') // Cancel edit

      // 7. Drag a node
      await page.mouse.move(300, 250)
      await page.mouse.down()
      await page.mouse.move(350, 280, { steps: 10 })
      await page.mouse.up()
      await page.waitForTimeout(500)

      // 8. Reset view
      await page.click('button:has-text("Reset")')
      await page.waitForTimeout(1000)

      // 9. Go back to list
      await page.click('text=← Back to List')
      await page.waitForSelector('.mind-map-list')
      await page.waitForTimeout(1000)

    } finally {
      // Stop recording
      await capture.stop()
    }
  })

  test('record creating a new mind map', async ({ page }) => {
    const capture = await saveVideo(page, 'demo-create-raw.mp4')

    try {
      // Navigate to home
      await page.goto('/')
      await page.waitForSelector('.mind-map-list')
      await page.waitForTimeout(500)

      // Click create button
      await page.click('button:has-text("Create New")')
      await page.waitForTimeout(500)

      // Fill in the form
      await page.fill('input#title', 'My Project Ideas')
      await page.fill('textarea#description', 'Brainstorming new features')
      await page.waitForTimeout(500)

      // Create it
      await page.click('button:has-text("Create")')
      await page.waitForSelector('canvas')
      await page.waitForTimeout(1000)

      // Create first node
      const canvas = await page.locator('canvas')
      await canvas.dblclick({ position: { x: 400, y: 300 } })
      await page.keyboard.type('Main Idea', { delay: 100 })
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      // Create child nodes
      await canvas.dblclick({ position: { x: 600, y: 250 } })
      await page.keyboard.type('Feature 1', { delay: 100 })
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      await canvas.dblclick({ position: { x: 600, y: 350 } })
      await page.keyboard.type('Feature 2', { delay: 100 })
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      await canvas.dblclick({ position: { x: 200, y: 300 } })
      await page.keyboard.type('Technical Details', { delay: 100 })
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)

    } finally {
      await capture.stop()
    }
  })
})