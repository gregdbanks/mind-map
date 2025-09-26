import { test, expect } from '@playwright/test'
import { percySnapshot } from '@percy/playwright'

test.describe('Visual Regression Baselines - PixiJS Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Enable PixiJS renderer and visual regression tests
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
      localStorage.setItem('visualRegressionTests', 'true')
    })
    
    await page.reload()
    
    // Wait for renderer initialization
    await page.waitForSelector('#mind-map-canvas', { state: 'visible' })
    await page.waitForTimeout(500)
  })

  test('empty canvas baseline', async ({ page }) => {
    // Create new mind map
    await page.click('button:has-text("New Mind Map")')
    
    // Wait for stable render
    await page.waitForTimeout(300)
    
    // Take Percy snapshot
    await percySnapshot(page, 'Empty Canvas - PixiJS')
    
    // Also take Playwright screenshot for local comparison
    await page.screenshot({
      path: 'tests/visual-regression/baselines/empty-canvas.png',
      fullPage: false
    })
  })

  test('single node baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create a single node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 300 }
    })
    await page.keyboard.type('Center Node')
    await page.keyboard.press('Enter')
    
    // Wait for stable render
    await page.waitForTimeout(300)
    
    await percySnapshot(page, 'Single Node - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/single-node.png'
    })
  })

  test('small tree structure baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create root node
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 150 }
    })
    await page.keyboard.type('Root')
    await page.keyboard.press('Enter')
    
    // Create child nodes
    await page.click('text=Root')
    
    const childPositions = [
      { x: 250, y: 300, text: 'Left Child' },
      { x: 400, y: 300, text: 'Middle Child' },
      { x: 550, y: 300, text: 'Right Child' }
    ]
    
    for (const child of childPositions) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: child.x, y: child.y }
      })
      await page.keyboard.type(child.text)
      await page.keyboard.press('Enter')
    }
    
    // Wait for connections to render
    await page.waitForTimeout(500)
    
    await percySnapshot(page, 'Tree Structure - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/tree-structure.png'
    })
  })

  test('node states baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create nodes with different states
    const nodes = [
      { x: 200, y: 200, text: 'Normal Node' },
      { x: 400, y: 200, text: 'Selected Node' },
      { x: 600, y: 200, text: 'Hover Node' },
      { x: 200, y: 400, text: 'Dragging Node' }
    ]
    
    for (const node of nodes) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: node.x, y: node.y }
      })
      await page.keyboard.type(node.text)
      await page.keyboard.press('Enter')
    }
    
    // Select a node
    await page.click('text=Selected Node')
    
    // Hover over a node
    await page.hover('text=Hover Node')
    
    // Start dragging (but don't complete)
    const draggingNode = page.locator('text=Dragging Node')
    await draggingNode.hover()
    await page.mouse.down()
    await page.mouse.move(250, 450)
    
    await percySnapshot(page, 'Node States - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/node-states.png'
    })
    
    // Release drag
    await page.mouse.up()
  })

  test('complex map baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Generate a more complex mind map
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadComplexMap()
    })
    
    await page.waitForTimeout(1000)
    
    await percySnapshot(page, 'Complex Map - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/complex-map.png'
    })
  })

  test('zoomed states baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create some nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(50)
    })
    
    await page.waitForTimeout(500)
    
    // Zoom levels
    const zoomLevels = [
      { name: 'Default Zoom', actions: [] },
      { name: 'Zoomed In', actions: ['Zoom in', 'Zoom in'] },
      { name: 'Zoomed Out', actions: ['Zoom out', 'Zoom out', 'Zoom out'] }
    ]
    
    for (const level of zoomLevels) {
      // Reset view first
      await page.click('button[aria-label="Reset view"]')
      
      // Apply zoom actions
      for (const action of level.actions) {
        await page.click(`button[aria-label="${action}"]`)
      }
      
      await page.waitForTimeout(300)
      
      await percySnapshot(page, `${level.name} - PixiJS`)
      
      await page.screenshot({
        path: `tests/visual-regression/baselines/zoom-${level.name.toLowerCase().replace(' ', '-')}.png`
      })
    }
  })

  test('styled nodes baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create nodes with different styles
    const styledNodes = [
      {
        x: 200,
        y: 200,
        text: 'Red Node',
        style: { color: '#ff0000', fontSize: 20 }
      },
      {
        x: 400,
        y: 200,
        text: 'Blue Node',
        style: { color: '#0000ff', fontSize: 16 }
      },
      {
        x: 600,
        y: 200,
        text: 'Bold Node',
        style: { fontWeight: 'bold', fontSize: 18 }
      },
      {
        x: 300,
        y: 350,
        text: 'Italic Node',
        style: { fontStyle: 'italic' }
      },
      {
        x: 500,
        y: 350,
        text: 'Large Node',
        style: { fontSize: 24 }
      }
    ]
    
    for (const node of styledNodes) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: node.x, y: node.y }
      })
      await page.keyboard.type(node.text)
      await page.keyboard.press('Enter')
      
      // Apply styles
      await page.click(`text=${node.text}`)
      await page.evaluate((style) => {
        const selectedNode = (window as any).pixiRenderer?.getSelectedNode()
        if (selectedNode) {
          (window as any).pixiRenderer?.updateNodeStyle(selectedNode.id, style)
        }
      }, node.style)
    }
    
    await page.waitForTimeout(500)
    
    await percySnapshot(page, 'Styled Nodes - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/styled-nodes.png'
    })
  })

  test('export dialog baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create a few nodes
    await page.dblclick('#mind-map-canvas', {
      position: { x: 400, y: 300 }
    })
    await page.keyboard.type('Export Test')
    await page.keyboard.press('Enter')
    
    // Open export dialog
    await page.click('button[aria-label="Share mind map"]')
    
    await page.waitForTimeout(300)
    
    await percySnapshot(page, 'Export Dialog - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/export-dialog.png'
    })
  })

  test('performance overlay baseline', async ({ page }) => {
    await page.click('button:has-text("New Mind Map")')
    
    // Create some nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(100)
    })
    
    // Enable performance overlay
    await page.keyboard.press('F12')
    
    await page.waitForTimeout(500)
    
    await percySnapshot(page, 'Performance Overlay - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/performance-overlay.png'
    })
  })

  test('dark mode baseline', async ({ page }) => {
    // Enable dark mode if available
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark')
    })
    
    await page.reload()
    
    // Create new mind map
    await page.click('button:has-text("New Mind Map")')
    
    // Create some nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadComplexMap()
    })
    
    await page.waitForTimeout(500)
    
    await percySnapshot(page, 'Dark Mode - PixiJS')
    
    await page.screenshot({
      path: 'tests/visual-regression/baselines/dark-mode.png'
    })
  })
})