import { test, expect } from '@playwright/test'

test.describe('Large Map Performance - PixiJS Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Enable PixiJS renderer and performance monitoring
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
      localStorage.setItem('performanceMonitoring', 'true')
    })
    
    await page.reload()
    
    // Create a new mind map
    await page.click('button:has-text("New Mind Map")')
  })

  test('should maintain 60 FPS with 500+ nodes', async ({ page }) => {
    // Generate 500 nodes using test helper
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    
    // Wait for nodes to render
    await page.waitForTimeout(1000)
    
    // Check initial performance
    let metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.nodeCount).toBe(500)
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
    
    // Pan around rapidly
    await page.keyboard.down('Space')
    const canvas = page.locator('#mind-map-canvas')
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.mouse.down()
    
    // Move in a large circle
    const movements = []
    for (let angle = 0; angle < 360; angle += 30) {
      const x = 400 + 150 * Math.cos(angle * Math.PI / 180)
      const y = 300 + 150 * Math.sin(angle * Math.PI / 180)
      movements.push({ x, y })
    }
    
    for (const pos of movements) {
      await page.mouse.move(pos.x, pos.y)
      await page.waitForTimeout(50)
    }
    
    await page.mouse.up()
    await page.keyboard.up('Space')
    
    // Check performance during movement
    metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
    expect(metrics.frameTime).toBeLessThanOrEqual(17) // 16.67ms for 60 FPS
  })

  test('should handle 1000 nodes with good performance', async ({ page }) => {
    // Generate 1000 nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(1000)
    })
    
    await page.waitForTimeout(2000)
    
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.nodeCount).toBe(1000)
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
    expect(metrics.memoryUsage).toBeLessThan(200) // Under 200MB
    
    // Zoom out to see all nodes
    for (let i = 0; i < 5; i++) {
      await page.click('button[aria-label="Zoom out"]')
    }
    
    // Performance should still be good
    const zoomedMetrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(zoomedMetrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should handle 5000 nodes without crashing', async ({ page }) => {
    // Set longer timeout for this heavy test
    test.setTimeout(60000)
    
    // Generate 5000 nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(5000)
    })
    
    await page.waitForTimeout(5000)
    
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.nodeCount).toBe(5000)
    expect(metrics.fps).toBeGreaterThan(30) // Acceptable degradation
    expect(metrics.memoryUsage).toBeLessThan(200) // Still under budget
    
    // Test basic interaction still works
    await page.click('button[aria-label="Zoom out"]')
    await page.click('button[aria-label="Zoom out"]')
    
    // Should not crash or hang
    await expect(page.locator('#mind-map-canvas')).toBeVisible()
  })

  test('should optimize with viewport culling', async ({ page }) => {
    // Generate nodes spread across large area
    await page.evaluate(() => {
      const nodes = []
      for (let i = 0; i < 1000; i++) {
        nodes.push({
          id: `node-${i}`,
          text: `N${i}`,
          positionX: (i % 50) * 200, // Spread over 10,000px width
          positionY: Math.floor(i / 50) * 200 // Spread over 4,000px height
        })
      }
      return (window as any).pixiRenderer?.updateNodes(nodes)
    })
    
    // Zoom in to show only a portion
    for (let i = 0; i < 3; i++) {
      await page.click('button[aria-label="Zoom in"]')
    }
    
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    // Many nodes should be culled
    expect(metrics.visibleNodeCount).toBeLessThan(metrics.nodeCount)
    expect(metrics.visibleNodeCount).toBeLessThan(100) // Only nearby nodes visible
    
    // Performance should be excellent with culling
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should handle rapid node creation in large map', async ({ page }) => {
    // Start with 500 nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    
    // Add 10 more nodes rapidly
    for (let i = 0; i < 10; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: 300 + i * 30, y: 300 }
      })
      await page.keyboard.type(`New ${i}`)
      await page.keyboard.press('Enter')
    }
    
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.nodeCount).toBe(510)
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should maintain performance during batch operations', async ({ page }) => {
    // Create initial set of nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(200)
    })
    
    // Select all nodes
    await page.keyboard.press('Control+a')
    
    // Drag all nodes
    const firstNode = page.locator('.pixi-node').first()
    await firstNode.dragTo(firstNode, {
      sourcePosition: { x: 10, y: 10 },
      targetPosition: { x: 100, y: 100 }
    })
    
    // Check performance during batch move
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should show performance metrics overlay', async ({ page }) => {
    // Generate large map
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    
    // Enable performance overlay
    await page.keyboard.press('F12')
    
    // Performance overlay should be visible
    await expect(page.locator('.performance-overlay')).toBeVisible()
    await expect(page.locator('text=FPS:')).toBeVisible()
    await expect(page.locator('text=Nodes:')).toBeVisible()
    await expect(page.locator('text=Draw Calls:')).toBeVisible()
    
    // Values should update in real-time
    const fps1 = await page.locator('.fps-value').textContent()
    await page.waitForTimeout(1000)
    const fps2 = await page.locator('.fps-value').textContent()
    
    expect(fps1).not.toBe(fps2) // Should be updating
  })

  test('should export large map efficiently', async ({ page }) => {
    // Generate 1000 nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(1000)
    })
    
    await page.waitForTimeout(2000)
    
    // Time the export
    const startTime = Date.now()
    
    // Click export button
    await page.click('button[aria-label="Share mind map"]')
    await page.click('button:has-text("Export as Image")')
    
    // Wait for export to complete
    await page.waitForSelector('.export-complete', { timeout: 10000 })
    
    const exportTime = Date.now() - startTime
    
    // Export should be reasonably fast
    expect(exportTime).toBeLessThan(5000) // Under 5 seconds
    
    // Check export quality
    const exportData = await page.evaluate(() => {
      return (window as any).lastExportData
    })
    
    expect(exportData).toBeDefined()
    expect(exportData.nodeCount).toBe(1000)
  })
})