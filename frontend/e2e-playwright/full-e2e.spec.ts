import { test, expect, Page } from '@playwright/test'

test.describe('Full Mind Map E2E Tests', () => {
  test('complete user journey: create mind map, add nodes, edit, and interact', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/')
    await page.waitForSelector('.mind-map-list')
    
    // 2. Create a new mind map
    await page.click('button:has-text("Create New Mind Map")')
    await page.fill('input[name="title"]', 'Test Mind Map E2E')
    await page.fill('textarea[name="description"]', 'Created by Playwright E2E test')
    await page.click('button:has-text("Create")')
    
    // Wait for navigation to the new mind map
    await page.waitForURL(/\/mindmap\/[a-f0-9-]+/)
    await page.waitForSelector('canvas')
    
    // 3. Create first node by double-clicking
    const canvas = await page.locator('canvas')
    await canvas.dblclick({ position: { x: 400, y: 300 } })
    
    // Type text for the node
    await page.keyboard.type('Central Concept')
    await page.keyboard.press('Enter')
    
    // 4. Create child nodes
    await canvas.dblclick({ position: { x: 600, y: 300 } })
    await page.keyboard.type('Child Node 1')
    await page.keyboard.press('Enter')
    
    await canvas.dblclick({ position: { x: 600, y: 400 } })
    await page.keyboard.type('Child Node 2')
    await page.keyboard.press('Enter')
    
    // 5. Test node dragging
    await page.waitForTimeout(500)
    const dragFrom = { x: 600, y: 300 }
    const dragTo = { x: 700, y: 250 }
    
    await canvas.dragAndDrop(
      { position: dragFrom },
      { position: dragTo }
    )
    
    // 6. Test zoom controls
    await page.click('button[aria-label="Zoom in"]')
    await page.waitForTimeout(200)
    await page.click('button[aria-label="Zoom out"]')
    await page.waitForTimeout(200)
    await page.click('button:has-text("Reset")')
    
    // 7. Edit a node by double-clicking
    await canvas.dblclick({ position: { x: 400, y: 300 } })
    await page.keyboard.press('Control+A')
    await page.keyboard.type('Updated Central Concept')
    await page.keyboard.press('Enter')
    
    // 8. Select multiple nodes with Ctrl+A
    await page.keyboard.press('Control+A')
    
    // 9. Take final screenshot
    await page.screenshot({
      path: 'screenshots/e2e-complete-journey.png',
      fullPage: true
    })
    
    // 10. Navigate back to list
    await page.click('text=← Back to List')
    await page.waitForSelector('.mind-map-list')
    
    // Verify our mind map appears in the list
    await expect(page.locator('text=Test Mind Map E2E')).toBeVisible()
  })

  test('AWS Security mind map interactions', async ({ page }) => {
    // Navigate to AWS Security mind map
    await page.goto('/mindmap/681d4506-bde3-43e9-b63d-518861e45bc7')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)
    
    // Test panning by dragging
    const canvas = await page.locator('canvas')
    await page.mouse.move(400, 300)
    await page.mouse.down()
    await page.mouse.move(500, 400)
    await page.mouse.up()
    
    // Test zoom with mouse wheel
    await canvas.hover()
    await page.mouse.wheel(0, -100) // Zoom in
    await page.waitForTimeout(500)
    await page.mouse.wheel(0, 100) // Zoom out
    
    // Click on a node to select it
    await canvas.click({ position: { x: 400, y: 300 } })
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Take screenshot of interactions
    await page.screenshot({
      path: 'screenshots/aws-mindmap-interactions.png',
      fullPage: true
    })
  })

  test('error handling and edge cases', async ({ page }) => {
    // Test non-existent mind map
    await page.goto('/mindmap/00000000-0000-0000-0000-000000000000')
    await expect(page.locator('.error')).toBeVisible()
    
    // Test going back from error
    await page.click('text=← Back to List')
    await expect(page.locator('.mind-map-list')).toBeVisible()
  })

  test('performance: handle mind map with many nodes', async ({ page }) => {
    // Navigate to AWS mind map which has 88 nodes
    await page.goto('/mindmap/681d4506-bde3-43e9-b63d-518861e45bc7')
    await page.waitForSelector('canvas', { timeout: 10000 })
    
    // Measure time to render
    const startTime = Date.now()
    await page.waitForFunction(() => {
      const stage = (window as any).Konva?.stages?.[0]
      if (!stage) return false
      const nodes = stage.findOne('Layer')?.find('.node-group')
      return nodes && nodes.length > 80
    }, { timeout: 5000 })
    const renderTime = Date.now() - startTime
    
    console.log(`Rendered 88 nodes in ${renderTime}ms`)
    expect(renderTime).toBeLessThan(3000) // Should render in under 3 seconds
    
    // Test performance of dragging with many nodes
    const canvas = await page.locator('canvas')
    const dragStartTime = Date.now()
    
    await canvas.dragAndDrop(
      { position: { x: 400, y: 300 } },
      { position: { x: 500, y: 400 } }
    )
    
    const dragTime = Date.now() - dragStartTime
    console.log(`Drag operation completed in ${dragTime}ms`)
    expect(dragTime).toBeLessThan(1000) // Dragging should be smooth
  })
})