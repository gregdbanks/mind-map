import { test, expect } from '@playwright/test'

test.describe('Pan and Zoom - PixiJS Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Enable PixiJS renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    
    // Create a new mind map with nodes spread across canvas
    await page.click('button:has-text("New Mind Map")')
    
    // Create test nodes in a grid pattern
    const positions = [
      { x: 200, y: 200 }, { x: 400, y: 200 }, { x: 600, y: 200 },
      { x: 200, y: 400 }, { x: 400, y: 400 }, { x: 600, y: 400 },
      { x: 200, y: 600 }, { x: 400, y: 600 }, { x: 600, y: 600 }
    ]
    
    for (let i = 0; i < positions.length; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: positions[i]
      })
      await page.keyboard.type(`Node ${i + 1}`)
      await page.keyboard.press('Enter')
    }
  })

  test('should pan with Space + drag smoothly', async ({ page }) => {
    // Get initial viewport
    const initialViewport = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport()
    })
    
    // Hold space and drag
    await page.keyboard.down('Space')
    
    const canvas = page.locator('#mind-map-canvas')
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.mouse.down()
    await page.mouse.move(600, 400)
    await page.mouse.up()
    
    await page.keyboard.up('Space')
    
    // Get new viewport
    const newViewport = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport()
    })
    
    // Viewport should have moved
    expect(newViewport.x).not.toBe(initialViewport.x)
    expect(newViewport.y).not.toBe(initialViewport.y)
    
    // Check smooth panning
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should zoom with scroll wheel smoothly', async ({ page }) => {
    const canvas = page.locator('#mind-map-canvas')
    
    // Get initial zoom
    const initialZoom = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    // Zoom in
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -100)
    await page.keyboard.up('Control')
    
    const zoomIn = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(zoomIn).toBeGreaterThan(initialZoom)
    
    // Zoom out
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Control')
    
    const zoomOut = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(zoomOut).toBeLessThan(zoomIn)
    
    // Check smooth zooming
    await expect(page.locator('.pixi-node')).toBeVisible()
  })

  test('should use zoom controls', async ({ page }) => {
    // Click zoom in button
    await page.click('button[aria-label="Zoom in"]')
    await page.click('button[aria-label="Zoom in"]')
    
    const zoomIn = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(zoomIn).toBeGreaterThan(1)
    
    // Click zoom out button
    await page.click('button[aria-label="Zoom out"]')
    await page.click('button[aria-label="Zoom out"]')
    await page.click('button[aria-label="Zoom out"]')
    
    const zoomOut = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(zoomOut).toBeLessThan(zoomIn)
    
    // Reset view
    await page.click('button[aria-label="Reset view"]')
    
    const resetZoom = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(resetZoom).toBe(1)
  })

  test('should handle rapid pan movements', async ({ page }) => {
    await page.keyboard.down('Space')
    
    // Simulate rapid panning
    const canvas = page.locator('#mind-map-canvas')
    await canvas.hover({ position: { x: 400, y: 300 } })
    await page.mouse.down()
    
    // Rapid movements
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(300 + i * 20, 300 + i * 10)
      await page.waitForTimeout(16) // ~60fps
    }
    
    await page.mouse.up()
    await page.keyboard.up('Space')
    
    // Performance should remain smooth
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should zoom to cursor position', async ({ page }) => {
    // Position cursor over specific node
    await page.hover('text=Node 5') // Center node
    
    const nodePosBeforeZoom = await page.locator('text=Node 5').boundingBox()
    
    // Zoom in with cursor over node
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -200)
    await page.keyboard.up('Control')
    
    const nodePosAfterZoom = await page.locator('text=Node 5').boundingBox()
    
    // Node should remain roughly at cursor position
    expect(Math.abs(nodePosAfterZoom.x - nodePosBeforeZoom.x)).toBeLessThan(50)
    expect(Math.abs(nodePosAfterZoom.y - nodePosBeforeZoom.y)).toBeLessThan(50)
  })

  test('should maintain performance with high zoom', async ({ page }) => {
    // Zoom in significantly
    for (let i = 0; i < 5; i++) {
      await page.click('button[aria-label="Zoom in"]')
    }
    
    // Pan around at high zoom
    await page.keyboard.down('Space')
    const canvas = page.locator('#mind-map-canvas')
    await canvas.hover()
    await page.mouse.down()
    
    // Move around
    await page.mouse.move(300, 300)
    await page.mouse.move(500, 300)
    await page.mouse.move(500, 500)
    await page.mouse.move(300, 500)
    
    await page.mouse.up()
    await page.keyboard.up('Space')
    
    // Performance should still be good
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    expect(metrics.fps).toBeGreaterThanOrEqual(60)
  })

  test('should respect zoom limits', async ({ page }) => {
    // Try to zoom out beyond limit
    for (let i = 0; i < 20; i++) {
      await page.click('button[aria-label="Zoom out"]')
    }
    
    const minZoom = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(minZoom).toBeGreaterThanOrEqual(0.1)
    
    // Try to zoom in beyond limit
    for (let i = 0; i < 20; i++) {
      await page.click('button[aria-label="Zoom in"]')
    }
    
    const maxZoom = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport().zoom
    })
    
    expect(maxZoom).toBeLessThanOrEqual(10)
  })

  test('should pan with scroll when not zooming', async ({ page }) => {
    const canvas = page.locator('#mind-map-canvas')
    
    // Get initial viewport
    const initialViewport = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport()
    })
    
    // Scroll without Ctrl (should pan)
    await canvas.hover()
    await page.mouse.wheel(50, 30)
    
    const newViewport = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getViewport()
    })
    
    // Should pan, not zoom
    expect(newViewport.zoom).toBe(initialViewport.zoom)
    expect(newViewport.x).not.toBe(initialViewport.x)
    expect(newViewport.y).not.toBe(initialViewport.y)
  })
})