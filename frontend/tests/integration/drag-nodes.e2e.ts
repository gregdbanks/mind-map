import { test, expect } from '@playwright/test'

test.describe('Drag Nodes - PixiJS Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Enable PixiJS renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    
    // Create a new mind map with some nodes
    await page.click('button:has-text("New Mind Map")')
    
    // Create test nodes
    const nodes = [
      { x: 300, y: 200, text: 'Node A' },
      { x: 500, y: 200, text: 'Node B' },
      { x: 400, y: 350, text: 'Node C' }
    ]
    
    for (const node of nodes) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: node.x, y: node.y }
      })
      await page.keyboard.type(node.text)
      await page.keyboard.press('Enter')
    }
  })

  test('should drag single node smoothly', async ({ page }) => {
    // Get initial position
    const initialPos = await page.locator('text=Node A').boundingBox()
    
    // Drag node
    await page.dragAndDrop('text=Node A', 'text=Node A', {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 110, y: 60 }
    })
    
    // Get new position
    const newPos = await page.locator('text=Node A').boundingBox()
    
    // Verify node moved
    expect(newPos.x).toBeGreaterThan(initialPos.x + 90)
    expect(newPos.y).toBeGreaterThan(initialPos.y + 40)
    
    // Check smooth movement (no lag)
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should drag multiple selected nodes', async ({ page }) => {
    // Select multiple nodes with Ctrl+click
    await page.click('text=Node A')
    await page.click('text=Node B', { modifiers: ['Control'] })
    await page.click('text=Node C', { modifiers: ['Control'] })
    
    // Verify all selected
    await expect(page.locator('.pixi-node.selected')).toHaveCount(3)
    
    // Drag one of the selected nodes
    await page.dragAndDrop('text=Node A', 'text=Node A', {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 150, y: 100 }
    })
    
    // All selected nodes should move together
    const positions = await page.evaluate(() => {
      const nodes = (window as any).pixiRenderer?.getNodes()
      return nodes.map(n => ({ id: n.id, x: n.positionX, y: n.positionY }))
    })
    
    // Verify relative positions maintained
    const deltaX = positions[0].x - 300 // Node A original X
    const deltaY = positions[0].y - 200 // Node A original Y
    
    expect(positions[1].x).toBeCloseTo(500 + deltaX, 1)
    expect(positions[2].y).toBeCloseTo(350 + deltaY, 1)
  })

  test('should maintain connections while dragging', async ({ page }) => {
    // Create connected nodes
    await page.click('text=Node A')
    await page.dblclick('#mind-map-canvas', {
      position: { x: 300, y: 300 }
    })
    await page.keyboard.type('Child of A')
    await page.keyboard.press('Enter')
    
    // Drag parent node
    await page.dragAndDrop('text=Node A', 'text=Node A', {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 200, y: 10 }
    })
    
    // Connection should follow
    await expect(page.locator('.pixi-connection')).toBeVisible()
    
    // Verify connection endpoints updated
    const connection = await page.evaluate(() => {
      const connections = (window as any).pixiRenderer?.getConnections()
      return connections[0]
    })
    
    expect(connection.startPoint).toBeDefined()
    expect(connection.endPoint).toBeDefined()
  })

  test('should handle rapid drag movements', async ({ page }) => {
    const nodeLocator = page.locator('text=Node B')
    
    // Simulate rapid dragging
    await nodeLocator.hover()
    await page.mouse.down()
    
    // Move in a pattern
    const movements = [
      { x: 550, y: 250 },
      { x: 600, y: 300 },
      { x: 650, y: 250 },
      { x: 600, y: 200 },
      { x: 550, y: 250 }
    ]
    
    for (const pos of movements) {
      await page.mouse.move(pos.x, pos.y)
      await page.waitForTimeout(50)
    }
    
    await page.mouse.up()
    
    // Check performance during rapid movement
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
    expect(metrics.frameTime).toBeLessThanOrEqual(17) // 60 FPS target
  })

  test('should snap to grid if enabled', async ({ page }) => {
    // Enable grid snapping
    await page.evaluate(() => {
      (window as any).pixiRenderer?.enableGridSnapping(20)
    })
    
    // Drag node
    await page.dragAndDrop('text=Node A', 'text=Node A', {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 47, y: 33 } // Not on grid
    })
    
    // Get final position
    const position = await page.evaluate(() => {
      const node = (window as any).pixiRenderer?.getNode('node-a')
      return { x: node.positionX, y: node.positionY }
    })
    
    // Should snap to nearest grid point
    expect(position.x % 20).toBe(0)
    expect(position.y % 20).toBe(0)
  })

  test('should constrain drag to bounds', async ({ page }) => {
    // Set world bounds
    await page.evaluate(() => {
      (window as any).pixiRenderer?.setWorldBounds({
        minX: 0,
        minY: 0,
        maxX: 800,
        maxY: 600
      })
    })
    
    // Try to drag outside bounds
    await page.dragAndDrop('text=Node C', 'text=Node C', {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 1000, y: 800 } // Outside bounds
    })
    
    // Get final position
    const position = await page.evaluate(() => {
      const node = (window as any).pixiRenderer?.getNode('node-c')
      return { x: node.positionX, y: node.positionY }
    })
    
    // Should be constrained to bounds
    expect(position.x).toBeLessThanOrEqual(800)
    expect(position.y).toBeLessThanOrEqual(600)
  })

  test('should show drag preview', async ({ page }) => {
    // Start dragging
    await page.locator('text=Node A').hover()
    await page.mouse.down()
    await page.mouse.move(400, 300)
    
    // Drag preview should be visible
    await expect(page.locator('.pixi-drag-preview')).toBeVisible()
    
    // Release
    await page.mouse.up()
    
    // Preview should disappear
    await expect(page.locator('.pixi-drag-preview')).not.toBeVisible()
  })
})