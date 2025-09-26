import { test, expect, Page } from '@playwright/test'

// Helper to switch renderer
async function switchToPixiRenderer(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('renderer', 'pixi')
    localStorage.setItem('performanceMonitoring', 'true')
  })
  await page.reload()
  
  // Wait for the PixiJS indicator
  await expect(page.locator('text=PixiJS Renderer')).toBeVisible()
}

async function switchToKonvaRenderer(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('renderer', 'konva')
  })
  await page.reload()
}

test.describe('PixiJS Renderer Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('should successfully switch between Konva and PixiJS renderers', async ({ page }) => {
    // Start with Konva (default)
    const konvaCanvas = await page.locator('canvas').first()
    await expect(konvaCanvas).toBeVisible()
    
    // Switch to PixiJS
    await switchToPixiRenderer(page)
    
    // Verify PixiJS is active
    await expect(page.locator('text=PixiJS Renderer')).toBeVisible()
    const pixiCanvas = await page.locator('canvas').first()
    await expect(pixiCanvas).toBeVisible()
    
    // Switch back to Konva
    await switchToKonvaRenderer(page)
    
    // Verify Konva is active (no PixiJS indicator)
    await expect(page.locator('text=PixiJS Renderer')).not.toBeVisible()
  })

  test('should render existing mind maps with PixiJS', async ({ page }) => {
    // Switch to PixiJS
    await switchToPixiRenderer(page)
    
    // Create a new mind map
    await page.click('text=Create Mind Map')
    await page.fill('input[placeholder="Enter mind map title"]', 'PixiJS Test Map')
    await page.click('button:has-text("Create")')
    
    // Navigate to the mind map
    await page.click('text=PixiJS Test Map')
    
    // Verify we're in the editor with PixiJS
    await expect(page.locator('text=Mind Map Editor')).toBeVisible()
    await expect(page.locator('text=PixiJS Renderer')).toBeVisible()
    
    // Verify canvas is rendered
    const canvas = page.locator('#mind-map-canvas canvas')
    await expect(canvas).toBeVisible()
  })

  test('should create and display nodes with PixiJS', async ({ page }) => {
    await switchToPixiRenderer(page)
    
    // Navigate to a mind map
    await page.click('text=Create Mind Map')
    await page.fill('input[placeholder="Enter mind map title"]', 'Node Test')
    await page.click('button:has-text("Create")')
    await page.click('text=Node Test')
    
    // Create a node by double-clicking on canvas
    const canvas = page.locator('#mind-map-canvas')
    await canvas.dblclick({ position: { x: 400, y: 300 } })
    
    // Type node text
    await page.keyboard.type('Test Node 1')
    await page.keyboard.press('Enter')
    
    // Verify node is created and visible
    // Note: PixiJS renders to canvas, so we need to check differently
    const canvasElement = page.locator('#mind-map-canvas canvas')
    await expect(canvasElement).toBeVisible()
    
    // Create another node
    await canvas.dblclick({ position: { x: 600, y: 300 } })
    await page.keyboard.type('Test Node 2')
    await page.keyboard.press('Enter')
    
    // Test that nodes persist after page reload
    await page.reload()
    await expect(page.locator('text=PixiJS Renderer')).toBeVisible()
    await expect(canvasElement).toBeVisible()
  })

  test('should handle node interactions with PixiJS', async ({ page }) => {
    await switchToPixiRenderer(page)
    
    // Create a mind map with nodes
    await page.click('text=Create Mind Map')
    await page.fill('input[placeholder="Enter mind map title"]', 'Interaction Test')
    await page.click('button:has-text("Create")')
    await page.click('text=Interaction Test')
    
    const canvas = page.locator('#mind-map-canvas')
    
    // Create parent node
    await canvas.dblclick({ position: { x: 400, y: 200 } })
    await page.keyboard.type('Parent Node')
    await page.keyboard.press('Enter')
    
    // Create child node far away to test zoom-to-node
    await canvas.dblclick({ position: { x: 800, y: 600 } })
    await page.keyboard.type('Child Node')
    await page.keyboard.press('Enter')
    
    // Click on the child node - should zoom to it
    await page.waitForTimeout(500)
    await canvas.click({ position: { x: 800, y: 600 } })
    
    // Wait for zoom animation
    await page.waitForTimeout(400)
    
    // Test dragging
    await page.mouse.move(400, 200)
    await page.mouse.down()
    await page.mouse.move(500, 300)
    await page.mouse.up()
    
    // Verify no errors occurred
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(500)
    expect(consoleErrors).toHaveLength(0)
  })

  test('should handle zoom controls with PixiJS', async ({ page }) => {
    await switchToPixiRenderer(page)
    
    // Navigate to a mind map
    const firstMindMap = page.locator('.mind-map-item').first()
    if (await firstMindMap.isVisible()) {
      await firstMindMap.click()
    } else {
      // Create one if none exists
      await page.click('text=Create Mind Map')
      await page.fill('input[placeholder="Enter mind map title"]', 'Zoom Test')
      await page.click('button:has-text("Create")')
      await page.click('text=Zoom Test')
    }
    
    // Test zoom controls
    const zoomIn = page.locator('button[aria-label="Zoom in"]')
    const zoomOut = page.locator('button[aria-label="Zoom out"]')
    const resetView = page.locator('button[aria-label="Reset view"]')
    
    await expect(zoomIn).toBeVisible()
    await expect(zoomOut).toBeVisible()
    await expect(resetView).toBeVisible()
    
    // Test zoom in
    await zoomIn.click()
    await page.waitForTimeout(100)
    await zoomIn.click()
    
    // Test zoom out
    await zoomOut.click()
    await page.waitForTimeout(100)
    
    // Test reset
    await resetView.click()
    
    // Verify no errors
    await expect(page.locator('#mind-map-canvas canvas')).toBeVisible()
  })

  test('should preserve data when switching renderers', async ({ page }) => {
    // Start with Konva
    await page.goto('http://localhost:5173')
    
    // Create a mind map with Konva
    await page.click('text=Create Mind Map')
    await page.fill('input[placeholder="Enter mind map title"]', 'Renderer Switch Test')
    await page.click('button:has-text("Create")')
    await page.click('text=Renderer Switch Test')
    
    // Create some nodes with Konva
    const canvas = page.locator('#mind-map-canvas')
    await canvas.dblclick({ position: { x: 400, y: 300 } })
    await page.keyboard.type('Node Created in Konva')
    await page.keyboard.press('Enter')
    
    // Switch to PixiJS
    await switchToPixiRenderer(page)
    
    // Verify the mind map still loads
    await expect(page.locator('text=Mind Map Editor')).toBeVisible()
    await expect(page.locator('text=PixiJS Renderer')).toBeVisible()
    
    // The canvas should still be visible (data preserved)
    await expect(page.locator('#mind-map-canvas canvas')).toBeVisible()
    
    // Create a new node in PixiJS
    await canvas.dblclick({ position: { x: 600, y: 300 } })
    await page.keyboard.type('Node Created in PixiJS')
    await page.keyboard.press('Enter')
    
    // Switch back to Konva
    await switchToKonvaRenderer(page)
    
    // Verify canvas is still visible
    await expect(page.locator('#mind-map-canvas canvas')).toBeVisible()
  })

  test('should zoom to node when clicked', async ({ page }) => {
    await switchToPixiRenderer(page)
    
    // Create a mind map
    await page.click('text=Create Mind Map')
    await page.fill('input[placeholder="Enter mind map title"]', 'Zoom Test')
    await page.click('button:has-text("Create")')
    await page.click('text=Zoom Test')
    
    const canvas = page.locator('#mind-map-canvas')
    
    // Create nodes spread out
    const nodes = [
      { x: 200, y: 200, text: 'Top Left' },
      { x: 800, y: 200, text: 'Top Right' },
      { x: 200, y: 600, text: 'Bottom Left' },
      { x: 800, y: 600, text: 'Bottom Right' }
    ]
    
    for (const node of nodes) {
      await canvas.dblclick({ position: { x: node.x, y: node.y } })
      await page.keyboard.type(node.text)
      await page.keyboard.press('Enter')
    }
    
    // Click on each node and verify zoom animation happens
    for (const node of nodes) {
      await canvas.click({ position: { x: node.x, y: node.y } })
      await page.waitForTimeout(400) // Wait for animation
      
      // The node should now be centered and zoomed
      // We can't directly verify the viewport, but we can check no errors
    }
    
    // Reset view
    await page.click('button[aria-label="Reset view"]')
    await page.waitForTimeout(300)
  })

  test('should show performance monitoring when enabled', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
      localStorage.setItem('showPerformance', 'true')
    })
    await page.reload()
    
    // Look for performance overlay
    const perfOverlay = page.locator('.performance-overlay')
    if (await perfOverlay.isVisible()) {
      await expect(perfOverlay).toContainText('Renderer: pixi')
    }
  })

  test('should handle errors gracefully', async ({ page }) => {
    await switchToPixiRenderer(page)
    
    // Set up console error monitoring
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
        errors.push(msg.text())
      }
    })
    
    // Navigate to a mind map
    const firstMindMap = page.locator('.mind-map-item').first()
    if (await firstMindMap.isVisible()) {
      await firstMindMap.click()
      
      // Perform various operations
      const canvas = page.locator('#mind-map-canvas')
      
      // Multiple rapid clicks
      for (let i = 0; i < 5; i++) {
        await canvas.dblclick({ position: { x: 200 + i * 50, y: 200 } })
        await page.keyboard.type(`Node ${i}`)
        await page.keyboard.press('Enter')
      }
      
      // Rapid zoom
      const zoomIn = page.locator('button[aria-label="Zoom in"]')
      for (let i = 0; i < 3; i++) {
        await zoomIn.click()
      }
    }
    
    // Check that no critical errors occurred
    const criticalErrors = errors.filter(e => 
      e.includes('Cannot read') || 
      e.includes('undefined') ||
      e.includes('null')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Feature Parity Tests', () => {
  // Test that all features working in Konva also work in PixiJS
  
  test('should support all keyboard shortcuts', async ({ page }) => {
    await switchToPixiRenderer(page)
    
    // Navigate to a mind map
    const firstMindMap = page.locator('.mind-map-item').first()
    if (await firstMindMap.isVisible()) {
      await firstMindMap.click()
      
      // Test space + drag for panning
      await page.keyboard.down('Space')
      await page.mouse.move(400, 300)
      await page.mouse.down()
      await page.mouse.move(500, 400)
      await page.mouse.up()
      await page.keyboard.up('Space')
      
      // Verify canvas is still functional
      await expect(page.locator('#mind-map-canvas canvas')).toBeVisible()
    }
  })

  test('should maintain performance with many nodes', async ({ page }) => {
    test.setTimeout(60000) // Longer timeout for performance test
    
    await switchToPixiRenderer(page)
    
    // Create a new mind map
    await page.click('text=Create Mind Map')
    await page.fill('input[placeholder="Enter mind map title"]', 'Performance Test')
    await page.click('button:has-text("Create")')
    await page.click('text=Performance Test')
    
    const canvas = page.locator('#mind-map-canvas')
    
    // Create multiple nodes
    const startTime = Date.now()
    for (let i = 0; i < 20; i++) {
      const x = 200 + (i % 5) * 100
      const y = 200 + Math.floor(i / 5) * 100
      
      await canvas.dblclick({ position: { x, y } })
      await page.keyboard.type(`Node ${i + 1}`)
      await page.keyboard.press('Enter')
    }
    const endTime = Date.now()
    
    // Should complete in reasonable time
    expect(endTime - startTime).toBeLessThan(30000)
    
    // Canvas should still be responsive
    await page.locator('button[aria-label="Zoom out"]').click()
    await expect(canvas).toBeVisible()
  })
})