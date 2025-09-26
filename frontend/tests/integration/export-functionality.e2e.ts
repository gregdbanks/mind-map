import { test, expect } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

test.describe('Export Functionality - PixiJS Renderer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Enable PixiJS renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
    })
    
    await page.reload()
    
    // Create a new mind map with test content
    await page.click('button:has-text("New Mind Map")')
    
    // Create a structured mind map
    const nodes = [
      { x: 400, y: 100, text: 'Main Topic' },
      { x: 200, y: 250, text: 'Subtopic 1' },
      { x: 400, y: 250, text: 'Subtopic 2' },
      { x: 600, y: 250, text: 'Subtopic 3' },
      { x: 150, y: 400, text: 'Detail 1.1' },
      { x: 250, y: 400, text: 'Detail 1.2' },
      { x: 550, y: 400, text: 'Detail 3.1' },
      { x: 650, y: 400, text: 'Detail 3.2' }
    ]
    
    // Create main node
    await page.dblclick('#mind-map-canvas', {
      position: { x: nodes[0].x, y: nodes[0].y }
    })
    await page.keyboard.type(nodes[0].text)
    await page.keyboard.press('Enter')
    
    // Create child nodes
    for (let i = 1; i <= 3; i++) {
      await page.click(`text=${nodes[0].text}`)
      await page.dblclick('#mind-map-canvas', {
        position: { x: nodes[i].x, y: nodes[i].y }
      })
      await page.keyboard.type(nodes[i].text)
      await page.keyboard.press('Enter')
    }
    
    // Create grandchild nodes
    await page.click('text=Subtopic 1')
    for (let i = 4; i <= 5; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: nodes[i].x, y: nodes[i].y }
      })
      await page.keyboard.type(nodes[i].text)
      await page.keyboard.press('Enter')
    }
    
    await page.click('text=Subtopic 3')
    for (let i = 6; i <= 7; i++) {
      await page.dblclick('#mind-map-canvas', {
        position: { x: nodes[i].x, y: nodes[i].y }
      })
      await page.keyboard.type(nodes[i].text)
      await page.keyboard.press('Enter')
    }
  })

  test('should export as PNG image', async ({ page }) => {
    // Open share dialog
    await page.click('button[aria-label="Share mind map"]')
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export as PNG
    await page.click('button:has-text("Export as PNG")')
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/mind-map.*\.png$/)
    
    // Save to temp directory
    const filePath = path.join(__dirname, 'temp', download.suggestedFilename())
    await download.saveAs(filePath)
    
    // Verify file exists and has content
    const stats = await fs.stat(filePath)
    expect(stats.size).toBeGreaterThan(1000) // Should be at least 1KB
    
    // Clean up
    await fs.unlink(filePath)
  })

  test('should export as JSON', async ({ page }) => {
    // Open share dialog
    await page.click('button[aria-label="Share mind map"]')
    
    // Set up download promise
    const downloadPromise = page.waitForEvent('download')
    
    // Click export as JSON
    await page.click('button:has-text("Export as JSON")')
    
    // Wait for download
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/mind-map.*\.json$/)
    
    // Save and read JSON
    const filePath = path.join(__dirname, 'temp', download.suggestedFilename())
    await download.saveAs(filePath)
    
    const jsonContent = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(jsonContent)
    
    // Verify JSON structure
    expect(data).toHaveProperty('nodes')
    expect(data.nodes).toHaveLength(8)
    expect(data.nodes[0]).toMatchObject({
      id: expect.any(String),
      text: 'Main Topic',
      positionX: expect.any(Number),
      positionY: expect.any(Number)
    })
    
    // Verify parent-child relationships
    const childNodes = data.nodes.filter(n => n.parentId)
    expect(childNodes).toHaveLength(7)
    
    // Clean up
    await fs.unlink(filePath)
  })

  test('should import JSON correctly', async ({ page }) => {
    // First export current map
    await page.click('button[aria-label="Share mind map"]')
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export as JSON")')
    const download = await downloadPromise
    
    const filePath = path.join(__dirname, 'temp', download.suggestedFilename())
    await download.saveAs(filePath)
    
    // Create new empty map
    await page.click('button:has-text("New Mind Map")')
    
    // Verify empty
    await expect(page.locator('.pixi-node')).toHaveCount(0)
    
    // Import the JSON
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    
    // Wait for import to complete
    await page.waitForTimeout(1000)
    
    // Verify all nodes imported
    await expect(page.locator('.pixi-node')).toHaveCount(8)
    await expect(page.locator('text=Main Topic')).toBeVisible()
    await expect(page.locator('text=Subtopic 1')).toBeVisible()
    await expect(page.locator('text=Detail 1.1')).toBeVisible()
    
    // Verify connections
    await expect(page.locator('.pixi-connection')).toHaveCount(7)
    
    // Clean up
    await fs.unlink(filePath)
  })

  test('should export with custom settings', async ({ page }) => {
    // Open share dialog
    await page.click('button[aria-label="Share mind map"]')
    
    // Click advanced export
    await page.click('button:has-text("Advanced Export")')
    
    // Configure export settings
    await page.selectOption('select[name="format"]', 'jpeg')
    await page.fill('input[name="quality"]', '0.8')
    await page.fill('input[name="resolution"]', '2')
    await page.check('input[name="transparentBackground"]')
    
    // Export
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export")')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/mind-map.*\.jpg$/)
    
    // Verify high resolution export
    const filePath = path.join(__dirname, 'temp', download.suggestedFilename())
    await download.saveAs(filePath)
    const stats = await fs.stat(filePath)
    
    // High res export should be larger
    expect(stats.size).toBeGreaterThan(5000)
    
    await fs.unlink(filePath)
  })

  test('should export only visible area', async ({ page }) => {
    // Zoom in to show only part of the map
    for (let i = 0; i < 3; i++) {
      await page.click('button[aria-label="Zoom in"]')
    }
    
    // Pan to specific area
    await page.keyboard.down('Space')
    await page.mouse.move(400, 300)
    await page.mouse.down()
    await page.mouse.move(300, 200)
    await page.mouse.up()
    await page.keyboard.up('Space')
    
    // Export visible area only
    await page.click('button[aria-label="Share mind map"]')
    await page.click('button:has-text("Export Visible Area")')
    
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export as PNG")')
    
    const download = await downloadPromise
    const filePath = path.join(__dirname, 'temp', download.suggestedFilename())
    await download.saveAs(filePath)
    
    // Exported file should be smaller than full export
    const stats = await fs.stat(filePath)
    expect(stats.size).toBeGreaterThan(1000)
    expect(stats.size).toBeLessThan(50000) // Smaller than full export
    
    await fs.unlink(filePath)
  })

  test('should handle export errors gracefully', async ({ page }) => {
    // Try to export with invalid settings
    await page.evaluate(() => {
      // Mock a renderer error
      (window as any).pixiRenderer.exportCanvas = () => {
        throw new Error('WebGL context lost')
      }
    })
    
    // Attempt export
    await page.click('button[aria-label="Share mind map"]')
    await page.click('button:has-text("Export as PNG")')
    
    // Should show error message
    await expect(page.locator('text=Export failed')).toBeVisible()
    await expect(page.locator('text=WebGL context lost')).toBeVisible()
    
    // Should offer fallback option
    await expect(page.locator('button:has-text("Try Canvas Export")')).toBeVisible()
  })

  test('should export with performance metrics', async ({ page }) => {
    // Generate large map
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(200)
    })
    
    // Export and measure time
    const startTime = Date.now()
    
    await page.click('button[aria-label="Share mind map"]')
    await page.click('button:has-text("Export as PNG")')
    
    await page.waitForSelector('.export-progress', { state: 'hidden' })
    
    const exportTime = Date.now() - startTime
    
    // Should complete in reasonable time
    expect(exportTime).toBeLessThan(3000)
    
    // Check export metrics
    const metrics = await page.evaluate(() => {
      return (window as any).lastExportMetrics
    })
    
    expect(metrics).toMatchObject({
      nodeCount: 200,
      renderTime: expect.any(Number),
      fileSize: expect.any(Number)
    })
  })
})