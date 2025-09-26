import { test, expect } from '@playwright/test'

test.describe('Create Nodes - PixiJS Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Enable PixiJS renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    
    // Create a new mind map for testing
    await page.click('button:has-text("New Mind Map")')
  })

  test('should create node on double-click', async ({ page }) => {
    // Double-click on empty canvas
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 300 }
    })

    // Node should appear immediately
    await expect(page.locator('.pixi-node')).toBeVisible()
    
    // Verify node is editable
    const input = page.locator('input[type="text"]')
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()
  })

  test('should save node text on Enter', async ({ page }) => {
    // Create node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 300 }
    })

    // Type text
    await page.keyboard.type('My First Node')
    await page.keyboard.press('Enter')

    // Verify text is saved
    await expect(page.locator('text=My First Node')).toBeVisible()
    
    // Edit input should be hidden
    await expect(page.locator('input[type="text"]')).not.toBeVisible()
  })

  test('should create multiple nodes', async ({ page }) => {
    // Create first node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 300, y: 200 }
    })
    await page.keyboard.type('Node 1')
    await page.keyboard.press('Enter')

    // Create second node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 500, y: 300 }
    })
    await page.keyboard.type('Node 2')
    await page.keyboard.press('Enter')

    // Create third node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 400 }
    })
    await page.keyboard.type('Node 3')
    await page.keyboard.press('Enter')

    // Verify all nodes are visible
    await expect(page.locator('text=Node 1')).toBeVisible()
    await expect(page.locator('text=Node 2')).toBeVisible()
    await expect(page.locator('text=Node 3')).toBeVisible()

    // Check performance metrics
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.nodeCount).toBe(3)
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should handle rapid node creation', async ({ page }) => {
    const positions = [
      { x: 200, y: 200 },
      { x: 300, y: 200 },
      { x: 400, y: 200 },
      { x: 500, y: 200 },
      { x: 600, y: 200 }
    ]

    // Rapidly create nodes
    for (let i = 0; i < positions.length; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: positions[i]
      })
      await page.keyboard.type(`Quick Node ${i + 1}`)
      await page.keyboard.press('Enter')
    }

    // Verify all nodes created
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Quick Node ${i}`)).toBeVisible()
    }

    // Performance should remain smooth
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should create connected nodes', async ({ page }) => {
    // Create parent node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 200 }
    })
    await page.keyboard.type('Parent Node')
    await page.keyboard.press('Enter')

    // Select parent node
    await page.click('text=Parent Node')

    // Create child node while parent is selected
    await page.dblclick('#mind-map-canvas', {
      position: { x: 500, y: 300 }
    })
    await page.keyboard.type('Child Node')
    await page.keyboard.press('Enter')

    // Verify connection line is visible
    await expect(page.locator('.pixi-connection')).toBeVisible()

    // Verify parent-child relationship
    const connections = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getConnections()
    })
    
    expect(connections).toHaveLength(1)
    expect(connections[0].parentId).toBeTruthy()
  })

  test('should validate node creation performance', async ({ page }) => {
    const startTime = Date.now()
    
    // Create a node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 300 }
    })
    
    // Wait for node to appear
    await expect(page.locator('.pixi-node')).toBeVisible()
    
    const endTime = Date.now()
    const creationTime = endTime - startTime
    
    // Node should appear instantly (within 100ms)
    expect(creationTime).toBeLessThan(100)
  })
})