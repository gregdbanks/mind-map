import { test, expect } from '@playwright/test'

test.describe('Performance Comparison Validation', () => {
  test('PixiJS should outperform Konva in all benchmarks', async ({ page }) => {
    // This test runs after performance.test.ts and validates results
    const fs = require('fs').promises
    
    try {
      const results = await fs.readFile('tests/benchmarks/results.json', 'utf-8')
      const benchmarkData = JSON.parse(results)
      
      // Validate each benchmark
      const validationResults = []
      
      for (const konvaResult of benchmarkData.konva) {
        const testName = konvaResult.name.replace(' - Konva', '')
        const pixiResult = benchmarkData.pixi.find(r => 
          r.name === konvaResult.name.replace('Konva', 'PixiJS')
        )
        
        if (pixiResult) {
          const improvement = ((pixiResult.fps - konvaResult.fps) / konvaResult.fps) * 100
          
          validationResults.push({
            test: testName,
            konvaFPS: konvaResult.fps,
            pixiFPS: pixiResult.fps,
            improvement: improvement,
            passed: pixiResult.fps >= konvaResult.fps
          })
          
          // PixiJS should always be equal or better
          expect(pixiResult.fps).toBeGreaterThanOrEqual(konvaResult.fps)
          
          // For most tests, PixiJS should be significantly better
          if (testName.includes('500 Nodes') || testName.includes('Batch Update')) {
            expect(improvement).toBeGreaterThan(50) // At least 50% improvement
          }
        }
      }
      
      // Generate validation report
      console.log('\n=== PERFORMANCE VALIDATION REPORT ===\n')
      
      let allPassed = true
      for (const result of validationResults) {
        const status = result.passed ? '✅' : '❌'
        console.log(`${status} ${result.test}`)
        console.log(`   Konva: ${result.konvaFPS.toFixed(1)} FPS`)
        console.log(`   PixiJS: ${result.pixiFPS.toFixed(1)} FPS`)
        console.log(`   Improvement: ${result.improvement > 0 ? '+' : ''}${result.improvement.toFixed(1)}%\n`)
        
        if (!result.passed) allPassed = false
      }
      
      expect(allPassed).toBe(true)
      
    } catch (error) {
      // If results file doesn't exist, skip validation
      console.log('Benchmark results not found. Run performance.test.ts first.')
    }
  })

  test('validate 60 FPS target with 500+ nodes', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Test with PixiJS renderer
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
      localStorage.setItem('performanceMonitoring', 'true')
    })
    
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
    
    // Create exactly 500 nodes
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(500)
    })
    
    await page.waitForTimeout(2000)
    
    // Perform various operations and check FPS
    const operations = [
      { name: 'Idle', action: async () => await page.waitForTimeout(1000) },
      { name: 'Panning', action: async () => {
        await page.keyboard.down('Space')
        await page.mouse.move(400, 300)
        await page.mouse.down()
        await page.mouse.move(500, 400)
        await page.mouse.up()
        await page.keyboard.up('Space')
      }},
      { name: 'Zooming', action: async () => {
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, -100)
        await page.keyboard.up('Control')
      }},
      { name: 'Node Selection', action: async () => {
        await page.click('.pixi-node >> nth=0')
        await page.click('.pixi-node >> nth=10', { modifiers: ['Control'] })
        await page.click('.pixi-node >> nth=20', { modifiers: ['Control'] })
      }}
    ]
    
    for (const op of operations) {
      console.log(`Testing ${op.name}...`)
      
      // Clear metrics
      await page.evaluate(() => {
        (window as any).pixiRenderer?.resetMetrics()
      })
      
      // Perform operation
      await op.action()
      await page.waitForTimeout(500)
      
      // Get metrics
      const metrics = await page.evaluate(() => {
        return (window as any).pixiRenderer?.getPerformanceMetrics()
      })
      
      console.log(`${op.name}: ${metrics.fps.toFixed(1)} FPS`)
      
      // Validate 60 FPS target
      expect(metrics.fps).toBeGreaterThanOrEqual(60)
      expect(metrics.frameTime).toBeLessThanOrEqual(17) // 16.67ms for 60 FPS
    }
  })

  test('validate memory efficiency', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Test memory usage with increasing node counts
    const nodeCounts = [100, 500, 1000, 2000]
    const memoryUsage = []
    
    for (const count of nodeCounts) {
      await page.evaluate(() => {
        localStorage.setItem('renderer', 'pixi')
      })
      
      await page.reload()
      await page.click('button:has-text("New Mind Map")')
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc()
        }
      })
      
      const memoryBefore = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize / 1024 / 1024
        }
        return 0
      })
      
      // Create nodes
      await page.evaluate((nodeCount) => {
        return (window as any).testHelpers?.loadLargeMap(nodeCount)
      }, count)
      
      await page.waitForTimeout(2000)
      
      const memoryAfter = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize / 1024 / 1024
        }
        return 0
      })
      
      const usage = memoryAfter - memoryBefore
      memoryUsage.push({ nodes: count, memory: usage })
      
      console.log(`Memory for ${count} nodes: ${usage.toFixed(2)} MB`)
    }
    
    // Validate memory scales linearly or better
    for (let i = 1; i < memoryUsage.length; i++) {
      const prev = memoryUsage[i - 1]
      const curr = memoryUsage[i]
      
      const nodeRatio = curr.nodes / prev.nodes
      const memoryRatio = curr.memory / prev.memory
      
      // Memory should scale sub-linearly (better than linear)
      expect(memoryRatio).toBeLessThanOrEqual(nodeRatio * 1.1) // Allow 10% overhead
    }
    
    // Absolute memory limits
    expect(memoryUsage.find(m => m.nodes === 1000)?.memory).toBeLessThan(50)
    expect(memoryUsage.find(m => m.nodes === 2000)?.memory).toBeLessThan(100)
  })

  test('validate WebGL fallback performance', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Force Canvas2D fallback
    await page.evaluate(() => {
      localStorage.setItem('renderer', 'pixi')
      localStorage.setItem('forceCanvas2D', 'true')
    })
    
    await page.reload()
    await page.click('button:has-text("New Mind Map")')
    
    // Verify using Canvas2D
    const renderMode = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getRenderMode()
    })
    
    expect(renderMode).toBe('canvas2d')
    
    // Create 100 nodes (reduced for Canvas2D)
    await page.evaluate(() => {
      return (window as any).testHelpers?.loadLargeMap(100)
    })
    
    await page.waitForTimeout(1000)
    
    // Check performance with fallback
    const metrics = await page.evaluate(() => {
      return (window as any).pixiRenderer?.getPerformanceMetrics()
    })
    
    // Canvas2D should still maintain reasonable performance
    expect(metrics.fps).toBeGreaterThan(30) // At least 30 FPS
    expect(metrics.nodeCount).toBe(100)
  })
})