import { test, expect, Page } from '@playwright/test'

test.describe('Mind Map Visual Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test('should display AWS Security mind map with all nodes', async () => {
    // Navigate to the AWS mind map
    await page.goto('/mindmap/681d4506-bde3-43e9-b63d-518861e45bc7')
    
    // Wait for the canvas to load
    await page.waitForSelector('canvas', { timeout: 10000 })
    
    // Wait a bit for nodes to render
    await page.waitForTimeout(2000)
    
    // Take a screenshot
    await page.screenshot({
      path: 'screenshots/aws-mindmap-full.png',
      fullPage: true,
    })
    
    // Check console for errors
    const consoleMessages: string[] = []
    page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`))
    
    // Log what we see in the console
    console.log('Console messages:', consoleMessages)
    
    // Count visible nodes by checking canvas content
    const canvasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) return 'No canvas found'
      
      // Get canvas dimensions
      const rect = canvas.getBoundingClientRect()
      
      // Try to access Konva stage through the canvas
      const stage = (window as any).Konva?.stages?.find((s: any) => s.content === canvas)
      if (!stage) return 'No Konva stage found'
      
      // Count nodes
      const nodes = stage.findOne('Layer')?.find('.node-group')
      return {
        stageWidth: stage.width(),
        stageHeight: stage.height(),
        nodeCount: nodes ? nodes.length : 0,
        canvasRect: rect,
      }
    })
    
    console.log('Canvas content:', canvasContent)
    
    // Take a zoomed out screenshot to see more
    await page.evaluate(() => {
      const stage = (window as any).Konva?.stages?.[0]
      if (stage) {
        stage.scale({ x: 0.5, y: 0.5 })
        stage.position({ x: 400, y: 300 })
        stage.draw()
      }
    })
    
    await page.waitForTimeout(1000)
    
    await page.screenshot({
      path: 'screenshots/aws-mindmap-zoomed-out.png',
      fullPage: true,
    })
    
    // Check specific nodes exist
    const nodeTexts = await page.evaluate(() => {
      const stage = (window as any).Konva?.stages?.[0]
      if (!stage) return []
      
      const layer = stage.findOne('Layer')
      if (!layer) return []
      
      const texts = layer.find('Text')
      return texts.map((text: any) => text.text()).slice(0, 10) // First 10 nodes
    })
    
    console.log('First 10 node texts:', nodeTexts)
    
    // Verify some key nodes exist
    expect(nodeTexts).toContain('AWS Security')
    
    // Take a screenshot of just the canvas element
    const canvas = await page.locator('canvas')
    await canvas.screenshot({ path: 'screenshots/aws-mindmap-canvas-only.png' })
  })

  test('should show all nodes with proper spacing', async () => {
    await page.goto('/mindmap/681d4506-bde3-43e9-b63d-518861e45bc7')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await page.waitForTimeout(2000)
    
    // Get all node positions
    const nodePositions = await page.evaluate(() => {
      const stage = (window as any).Konva?.stages?.[0]
      if (!stage) return []
      
      const layer = stage.findOne('Layer')
      if (!layer) return []
      
      const groups = layer.find('.node-group')
      return groups.map((group: any) => {
        const text = group.findOne('Text')
        return {
          text: text?.text() || 'Unknown',
          x: group.x(),
          y: group.y(),
        }
      })
    })
    
    console.log('Total nodes found:', nodePositions.length)
    console.log('Sample positions:', nodePositions.slice(0, 5))
    
    // Check that nodes are not overlapping (minimum distance between nodes)
    const minDistance = 50 // Minimum pixels between nodes
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodePositions[i].x - nodePositions[j].x, 2) +
          Math.pow(nodePositions[i].y - nodePositions[j].y, 2)
        )
        if (dist < minDistance) {
          console.warn(`Nodes too close: "${nodePositions[i].text}" and "${nodePositions[j].text}" are ${dist}px apart`)
        }
      }
    }
    
    expect(nodePositions.length).toBe(88) // Should have all 88 nodes
  })

  test('debug: check what is actually loading', async () => {
    await page.goto('/mindmap/681d4506-bde3-43e9-b63d-518861e45bc7')
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`API Response: ${response.url()} - Status: ${response.status()}`)
      }
    })
    
    // Wait for API calls
    await page.waitForResponse(resp => resp.url().includes('/nodes'), { timeout: 10000 })
    
    // Check what's in the DOM
    const domInfo = await page.evaluate(() => {
      return {
        hasCanvas: !!document.querySelector('canvas'),
        canvasSize: document.querySelector('canvas')?.getBoundingClientRect(),
        bodyText: document.body.innerText.substring(0, 200),
        hasError: document.querySelector('.error')?.textContent,
        hasLoading: document.querySelector('.loading')?.textContent,
        hasEmptyState: document.querySelector('.empty-state')?.textContent,
      }
    })
    
    console.log('DOM Info:', domInfo)
    
    // Take a screenshot of the current state
    await page.screenshot({
      path: 'screenshots/aws-mindmap-debug.png',
      fullPage: true,
    })
  })
})