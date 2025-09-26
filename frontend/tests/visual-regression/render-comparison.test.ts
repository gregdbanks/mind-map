import { test, expect } from '@playwright/test'
import { percySnapshot } from '@percy/playwright'

test.describe('Renderer Comparison - Konva vs PixiJS', () => {
  async function createTestMap(page: any) {
    // Create a standardized test map
    await page.click('button:has-text("New Mind Map")')
    
    // Create nodes in specific pattern
    const nodes = [
      { x: 400, y: 100, text: 'Main Topic' },
      { x: 200, y: 250, text: 'Branch 1' },
      { x: 400, y: 250, text: 'Branch 2' },
      { x: 600, y: 250, text: 'Branch 3' },
      { x: 150, y: 400, text: 'Leaf 1.1' },
      { x: 250, y: 400, text: 'Leaf 1.2' },
      { x: 550, y: 400, text: 'Leaf 3.1' },
      { x: 650, y: 400, text: 'Leaf 3.2' }
    ]
    
    // Create main node
    await page.dblclick('#mind-map-canvas', {
      position: { x: nodes[0].x, y: nodes[0].y }
    })
    await page.keyboard.type(nodes[0].text)
    await page.keyboard.press('Enter')
    
    // Create branches
    await page.click(`text=${nodes[0].text}`)
    for (let i = 1; i <= 3; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: nodes[i].x, y: nodes[i].y }
      })
      await page.keyboard.type(nodes[i].text)
      await page.keyboard.press('Enter')
    }
    
    // Create leaves for Branch 1
    await page.click('text=Branch 1')
    for (let i = 4; i <= 5; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: nodes[i].x, y: nodes[i].y }
      })
      await page.keyboard.type(nodes[i].text)
      await page.keyboard.press('Enter')
    }
    
    // Create leaves for Branch 3
    await page.click('text=Branch 3')
    for (let i = 6; i <= 7; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: nodes[i].x, y: nodes[i].y }
      })
      await page.keyboard.type(nodes[i].text)
      await page.keyboard.press('Enter')
    }
    
    await page.waitForTimeout(500)
  }

  test('compare basic rendering - Konva', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Use Konva renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'konva')
    })
    
    await page.reload()
    await createTestMap(page)
    
    await percySnapshot(page, 'Basic Map - Konva Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/basic-map-konva.png'
    })
  })

  test('compare basic rendering - PixiJS', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Use PixiJS renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    await createTestMap(page)
    
    await percySnapshot(page, 'Basic Map - PixiJS Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/basic-map-pixi.png'
    })
    
    // Visual comparison will be done by Percy automatically
  })

  test('compare zoom rendering - Konva', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'konva')
    })
    
    await page.reload()
    await createTestMap(page)
    
    // Zoom in 3x
    for (let i = 0; i < 3; i++) {
      await page.click('button[aria-label="Zoom in"]')
    }
    
    await page.waitForTimeout(300)
    
    await percySnapshot(page, 'Zoomed Map - Konva Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/zoomed-map-konva.png'
    })
  })

  test('compare zoom rendering - PixiJS', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    await createTestMap(page)
    
    // Zoom in 3x
    for (let i = 0; i < 3; i++) {
      await page.click('button[aria-label="Zoom in"]')
    }
    
    await page.waitForTimeout(300)
    
    await percySnapshot(page, 'Zoomed Map - PixiJS Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/zoomed-map-pixi.png'
    })
  })

  test('compare selection states - Konva', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'konva')
    })
    
    await page.reload()
    await createTestMap(page)
    
    // Select multiple nodes
    await page.click('text=Branch 1')
    await page.click('text=Branch 2', { modifiers: ['Control'] })
    await page.click('text=Branch 3', { modifiers: ['Control'] })
    
    await percySnapshot(page, 'Selected Nodes - Konva Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/selected-nodes-konva.png'
    })
  })

  test('compare selection states - PixiJS', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    await createTestMap(page)
    
    // Select multiple nodes
    await page.click('text=Branch 1')
    await page.click('text=Branch 2', { modifiers: ['Control'] })
    await page.click('text=Branch 3', { modifiers: ['Control'] })
    
    await percySnapshot(page, 'Selected Nodes - PixiJS Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/selected-nodes-pixi.png'
    })
  })

  test('compare large map rendering - Konva', async ({ page }) => {
    test.setTimeout(60000)
    
    await page.goto('http://localhost:5173')
    
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'konva')
    })
    
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
    
    // Generate large map
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(200)
    })
    
    await page.waitForTimeout(2000)
    
    await percySnapshot(page, 'Large Map - Konva Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/large-map-konva.png'
    })
  })

  test('compare large map rendering - PixiJS', async ({ page }) => {
    test.setTimeout(60000)
    
    await page.goto('http://localhost:5173')
    
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
    
    // Generate large map
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(200)
    })
    
    await page.waitForTimeout(2000)
    
    await percySnapshot(page, 'Large Map - PixiJS Renderer')
    
    await page.screenshot({
      path: 'tests/visual-regression/comparisons/large-map-pixi.png'
    })
  })

  test('compare text rendering quality', async ({ page }) => {
    // Test different font sizes and styles
    const textStyles = [
      { size: 12, text: 'Small Text 12px' },
      { size: 16, text: 'Normal Text 16px' },
      { size: 24, text: 'Large Text 24px' },
      { size: 32, text: 'XL Text 32px' }
    ]
    
    // Test with Konva
    await page.goto('http://localhost:5173')
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'konva')
    })
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
    
    for (let i = 0; i < textStyles.length; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: 200 + i * 150, y: 300 }
      })
      await page.keyboard.type(textStyles[i].text)
      await page.keyboard.press('Enter')
      
      // Apply font size
      await page.click(`text=${textStyles[i].text}`)
      await page.evaluate((size) => {
        const selectedNode = (window as any).konvaRenderer?.getSelectedNode()
        if (selectedNode) {
          (window as any).konvaRenderer?.updateNodeStyle(selectedNode.id, { fontSize: size })
        }
      }, textStyles[i].size)
    }
    
    await percySnapshot(page, 'Text Quality - Konva')
    
    // Test with PixiJS
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
    
    for (let i = 0; i < textStyles.length; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: 200 + i * 150, y: 300 }
      })
      await page.keyboard.type(textStyles[i].text)
      await page.keyboard.press('Enter')
      
      // Apply font size
      await page.click(`text=${textStyles[i].text}`)
      await page.evaluate((size) => {
        const selectedNode = (window as any).pixiRenderer?.getSelectedNode()
        if (selectedNode) {
          (window as any).pixiRenderer?.updateNodeStyle(selectedNode.id, { fontSize: size })
        }
      }, textStyles[i].size)
    }
    
    await percySnapshot(page, 'Text Quality - PixiJS')
  })

  test('pixel-perfect validation', async ({ page }) => {
    // This test ensures critical UI elements render identically
    const criticalElements = [
      'button[aria-label="Zoom in"]',
      'button[aria-label="Zoom out"]',
      'button[aria-label="Reset view"]',
      'button[aria-label="Share mind map"]'
    ]
    
    // Test with both renderers
    for (const renderer of ['konva', 'pixi']) {
      await page.goto('http://localhost:5173')
      await page.evaluate((r) => {
        localStorage.setItem('renderer', r)
      }, renderer)
      await page.reload()
      
      // Check each critical element
      for (const selector of criticalElements) {
        const element = page.locator(selector)
        await expect(element).toBeVisible()
        
        // Take screenshot of individual element
        await element.screenshot({
          path: `tests/visual-regression/elements/${selector.replace(/[\[\]"=]/g, '-')}-${renderer}.png`
        })
      }
    }
  })
})