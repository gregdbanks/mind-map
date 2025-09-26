import { test, expect } from '@playwright/test'
import { runBenchmark, BenchmarkResult } from './benchmark-utils'

test.describe('Performance Benchmarks - PixiJS vs Konva', () => {
  const benchmarkResults: Record<string, BenchmarkResult[]> = {
    konva: [],
    pixi: []
  }

  async function setupRenderer(page: any, renderer: 'konva' | 'pixi') {
    await page.goto('http://localhost:5173')
    await page.evaluate((r) => {
      localStorage.setItem('renderer', r)
      localStorage.setItem('performanceMonitoring', 'true')
    }, renderer)
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
  }

  test('benchmark node creation - Konva', async ({ page }) => {
    await setupRenderer(page, 'konva')
    
    const result = await runBenchmark(page, async () => {
      // Create 100 nodes rapidly
      for (let i = 0; i < 100; i++) {
        const x = 200 + (i % 10) * 60
        const y = 200 + Math.floor(i / 10) * 60
        
        await page.dblclick('#mind-map-canvas', {
          position: { x, y }
        })
        await page.keyboard.type(`N${i}`)
        await page.keyboard.press('Enter')
      }
    }, {
      name: 'Node Creation - Konva',
      iterations: 1
    })
    
    benchmarkResults.konva.push(result)
    
    // Verify all nodes created
    await expect(page.locator('.konva-node')).toHaveCount(100)
    
    // Performance assertions
    expect(result.fps).toBeGreaterThan(30)
    expect(result.frameTime).toBeLessThan(33) // 30 FPS minimum
  })

  test('benchmark node creation - PixiJS', async ({ page }) => {
    await setupRenderer(page, 'pixi')
    
    const result = await runBenchmark(page, async () => {
      // Create 100 nodes rapidly
      for (let i = 0; i < 100; i++) {
        const x = 200 + (i % 10) * 60
        const y = 200 + Math.floor(i / 10) * 60
        
        await page.dblclick('#mind-map-canvas', {
          position: { x, y }
        })
        await page.keyboard.type(`N${i}`)
        await page.keyboard.press('Enter')
      }
    }, {
      name: 'Node Creation - PixiJS',
      iterations: 1
    })
    
    benchmarkResults.pixi.push(result)
    
    // Verify all nodes created
    await expect(page.locator('.pixi-node')).toHaveCount(100)
    
    // Performance assertions - PixiJS should be faster
    expect(result.fps).toBeGreaterThanOrEqual(60)
    expect(result.frameTime).toBeLessThanOrEqual(17) // 60 FPS target
  })

  test('benchmark panning performance - Konva', async ({ page }) => {
    await setupRenderer(page, 'konva')
    
    // Create nodes first
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    await page.waitForTimeout(1000)
    
    const result = await runBenchmark(page, async () => {
      await page.keyboard.down('Space')
      const canvas = page.locator('#mind-map-canvas')
      await canvas.hover({ position: { x: 400, y: 300 } })
      await page.mouse.down()
      
      // Pan in a circle
      for (let angle = 0; angle < 360; angle += 30) {
        const x = 400 + 150 * Math.cos(angle * Math.PI / 180)
        const y = 300 + 150 * Math.sin(angle * Math.PI / 180)
        await page.mouse.move(x, y)
        await page.waitForTimeout(16)
      }
      
      await page.mouse.up()
      await page.keyboard.up('Space')
    }, {
      name: 'Panning 500 Nodes - Konva',
      iterations: 3
    })
    
    benchmarkResults.konva.push(result)
    expect(result.fps).toBeGreaterThan(30)
  })

  test('benchmark panning performance - PixiJS', async ({ page }) => {
    await setupRenderer(page, 'pixi')
    
    // Create nodes first
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    await page.waitForTimeout(1000)
    
    const result = await runBenchmark(page, async () => {
      await page.keyboard.down('Space')
      const canvas = page.locator('#mind-map-canvas')
      await canvas.hover({ position: { x: 400, y: 300 } })
      await page.mouse.down()
      
      // Pan in a circle
      for (let angle = 0; angle < 360; angle += 30) {
        const x = 400 + 150 * Math.cos(angle * Math.PI / 180)
        const y = 300 + 150 * Math.sin(angle * Math.PI / 180)
        await page.mouse.move(x, y)
        await page.waitForTimeout(16)
      }
      
      await page.mouse.up()
      await page.keyboard.up('Space')
    }, {
      name: 'Panning 500 Nodes - PixiJS',
      iterations: 3
    })
    
    benchmarkResults.pixi.push(result)
    expect(result.fps).toBeGreaterThanOrEqual(60)
  })

  test('benchmark zoom performance - Konva', async ({ page }) => {
    await setupRenderer(page, 'konva')
    
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    await page.waitForTimeout(1000)
    
    const result = await runBenchmark(page, async () => {
      const canvas = page.locator('#mind-map-canvas')
      await canvas.hover({ position: { x: 400, y: 300 } })
      
      // Zoom in and out rapidly
      for (let i = 0; i < 5; i++) {
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, -100)
        await page.keyboard.up('Control')
        await page.waitForTimeout(100)
        
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, 100)
        await page.keyboard.up('Control')
        await page.waitForTimeout(100)
      }
    }, {
      name: 'Zooming 500 Nodes - Konva',
      iterations: 3
    })
    
    benchmarkResults.konva.push(result)
    expect(result.fps).toBeGreaterThan(30)
  })

  test('benchmark zoom performance - PixiJS', async ({ page }) => {
    await setupRenderer(page, 'pixi')
    
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    await page.waitForTimeout(1000)
    
    const result = await runBenchmark(page, async () => {
      const canvas = page.locator('#mind-map-canvas')
      await canvas.hover({ position: { x: 400, y: 300 } })
      
      // Zoom in and out rapidly
      for (let i = 0; i < 5; i++) {
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, -100)
        await page.keyboard.up('Control')
        await page.waitForTimeout(100)
        
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, 100)
        await page.keyboard.up('Control')
        await page.waitForTimeout(100)
      }
    }, {
      name: 'Zooming 500 Nodes - PixiJS',
      iterations: 3
    })
    
    benchmarkResults.pixi.push(result)
    expect(result.fps).toBeGreaterThanOrEqual(60)
  })

  test('benchmark batch updates - Konva', async ({ page }) => {
    await setupRenderer(page, 'konva')
    
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(200)
    })
    
    const result = await runBenchmark(page, async () => {
      // Update all nodes at once
      await page.evaluate(() => {
        const nodes = (window as any).konvaRenderer?.getNodes()
        const updates = nodes.map((node, i) => ({
          id: node.id,
          positionX: node.positionX + Math.sin(i) * 10,
          positionY: node.positionY + Math.cos(i) * 10,
          style: { color: `hsl(${i * 360 / nodes.length}, 70%, 50%)` }
        }))
        
        return (window as any).konvaRenderer?.batchUpdateNodes(updates)
      })
    }, {
      name: 'Batch Update 200 Nodes - Konva',
      iterations: 10
    })
    
    benchmarkResults.konva.push(result)
  })

  test('benchmark batch updates - PixiJS', async ({ page }) => {
    await setupRenderer(page, 'pixi')
    
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(200)
    })
    
    const result = await runBenchmark(page, async () => {
      // Update all nodes at once
      await page.evaluate(() => {
        const nodes = (window as any).pixiRenderer?.getNodes()
        const updates = nodes.map((node, i) => ({
          id: node.id,
          positionX: node.positionX + Math.sin(i) * 10,
          positionY: node.positionY + Math.cos(i) * 10,
          style: { color: `hsl(${i * 360 / nodes.length}, 70%, 50%)` }
        }))
        
        return (window as any).pixiRenderer?.batchUpdateNodes(updates)
      })
    }, {
      name: 'Batch Update 200 Nodes - PixiJS',
      iterations: 10
    })
    
    benchmarkResults.pixi.push(result)
  })

  test('benchmark memory usage - Konva', async ({ page }) => {
    await setupRenderer(page, 'konva')
    
    const memoryBefore = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / 1024 / 1024
      }
      return 0
    })
    
    // Create many nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(1000)
    })
    
    await page.waitForTimeout(2000)
    
    const memoryAfter = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / 1024 / 1024
      }
      return 0
    })
    
    const memoryIncrease = memoryAfter - memoryBefore
    
    console.log(`Konva memory usage for 1000 nodes: ${memoryIncrease.toFixed(2)} MB`)
    
    // Memory should be reasonable
    expect(memoryIncrease).toBeLessThan(100) // Less than 100MB for 1000 nodes
  })

  test('benchmark memory usage - PixiJS', async ({ page }) => {
    await setupRenderer(page, 'pixi')
    
    const memoryBefore = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / 1024 / 1024
      }
      return 0
    })
    
    // Create many nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(1000)
    })
    
    await page.waitForTimeout(2000)
    
    const memoryAfter = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / 1024 / 1024
      }
      return 0
    })
    
    const memoryIncrease = memoryAfter - memoryBefore
    
    console.log(`PixiJS memory usage for 1000 nodes: ${memoryIncrease.toFixed(2)} MB`)
    
    // Memory should be efficient
    expect(memoryIncrease).toBeLessThan(50) // PixiJS should use less memory
  })

  test.afterAll(async () => {
    // Generate benchmark report
    console.log('\n=== PERFORMANCE BENCHMARK RESULTS ===\n')
    
    // Compare results
    for (const konvaResult of benchmarkResults.konva) {
      const pixiResult = benchmarkResults.pixi.find(r => 
        r.name.replace('Konva', 'PixiJS') === konvaResult.name.replace('Konva', 'PixiJS')
      )
      
      if (pixiResult) {
        const improvement = ((pixiResult.fps - konvaResult.fps) / konvaResult.fps) * 100
        
        console.log(`${konvaResult.name.replace(' - Konva', '')}:`)
        console.log(`  Konva:  ${konvaResult.fps.toFixed(1)} FPS, ${konvaResult.frameTime.toFixed(2)}ms`)
        console.log(`  PixiJS: ${pixiResult.fps.toFixed(1)} FPS, ${pixiResult.frameTime.toFixed(2)}ms`)
        console.log(`  Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%\n`)
      }
    }
    
    // Save results to file
    const fs = require('fs').promises
    await fs.writeFile(
      'tests/benchmarks/results.json',
      JSON.stringify(benchmarkResults, null, 2)
    )
  })
})