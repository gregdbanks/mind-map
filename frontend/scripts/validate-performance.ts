#!/usr/bin/env node

import { chromium, Browser, Page } from 'playwright'
import { performance } from 'perf_hooks'
import * as fs from 'fs/promises'
import * as path from 'path'

interface PerformanceResult {
  renderer: string
  nodeCount: number
  metrics: {
    fps: number
    frameTime: number
    memoryUsage: number
    renderTime: number
  }
  passed: boolean
  issues: string[]
}

interface PerformanceTarget {
  nodeCount: number
  minFPS: number
  maxFrameTime: number
  maxMemory: number
}

const PERFORMANCE_TARGETS: PerformanceTarget[] = [
  { nodeCount: 100, minFPS: 60, maxFrameTime: 17, maxMemory: 50 },
  { nodeCount: 500, minFPS: 60, maxFrameTime: 17, maxMemory: 100 },
  { nodeCount: 1000, minFPS: 60, maxFrameTime: 17, maxMemory: 150 },
  { nodeCount: 5000, minFPS: 30, maxFrameTime: 34, maxMemory: 200 }
]

class PerformanceValidator {
  private browser: Browser | null = null
  private results: PerformanceResult[] = []
  
  async run(): Promise<void> {
    console.log('🚀 Starting performance validation...\n')
    
    try {
      // Start browser
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS !== 'false'
      })
      
      // Test both renderers
      for (const renderer of ['konva', 'pixi']) {
        console.log(`\n📊 Testing ${renderer.toUpperCase()} renderer...`)
        await this.testRenderer(renderer)
      }
      
      // Generate report
      await this.generateReport()
      
      // Check if all tests passed
      const allPassed = this.results.every(r => r.passed)
      
      if (allPassed) {
        console.log('\n✅ All performance tests PASSED!')
        process.exit(0)
      } else {
        console.log('\n❌ Some performance tests FAILED!')
        process.exit(1)
      }
    } catch (error) {
      console.error('Error during validation:', error)
      process.exit(1)
    } finally {
      await this.browser?.close()
    }
  }
  
  private async testRenderer(renderer: string): Promise<void> {
    const page = await this.browser!.newPage()
    
    // Navigate to app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    
    // Set renderer
    await page.evaluate((r) => {
      localStorage.setItem('renderer', r)
      localStorage.setItem('performanceMonitoring', 'true')
    }, renderer)
    
    await page.reload()
    
    // Wait for app to load
    await page.waitForSelector('#mind-map-canvas', { timeout: 10000 })
    
    // Test each node count
    for (const target of PERFORMANCE_TARGETS) {
      console.log(`  Testing with ${target.nodeCount} nodes...`)
      
      const result = await this.measurePerformance(page, renderer, target)
      this.results.push(result)
      
      // Log result
      const status = result.passed ? '✅' : '❌'
      console.log(`    ${status} FPS: ${result.metrics.fps}, Frame time: ${result.metrics.frameTime}ms, Memory: ${result.metrics.memoryUsage}MB`)
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`      ⚠️  ${issue}`))
      }
    }
    
    await page.close()
  }
  
  private async measurePerformance(
    page: Page,
    renderer: string,
    target: PerformanceTarget
  ): Promise<PerformanceResult> {
    // Clear any existing nodes
    await page.click('button:has-text("New Mind Map")')
    
    // Create nodes
    const startTime = performance.now()
    
    await page.evaluate(async (nodeCount) => {
      await (window as any).testHelpers?.loadLargeMap(nodeCount)
    }, target.nodeCount)
    
    // Wait for rendering to stabilize
    await page.waitForTimeout(3000)
    
    const renderTime = performance.now() - startTime
    
    // Collect metrics over 5 seconds
    const samples: any[] = []
    for (let i = 0; i < 5; i++) {
      const metrics = await page.evaluate(() => {
        const renderer = (window as any).pixiRenderer || (window as any).konvaRenderer
        return renderer?.getPerformanceMetrics()
      })
      
      if (metrics) {
        samples.push(metrics)
      }
      
      await page.waitForTimeout(1000)
    }
    
    // Calculate averages
    const avgMetrics = {
      fps: Math.round(samples.reduce((sum, s) => sum + s.fps, 0) / samples.length),
      frameTime: Math.round(samples.reduce((sum, s) => sum + s.frameTime, 0) / samples.length * 10) / 10,
      memoryUsage: Math.round(samples.reduce((sum, s) => sum + s.memoryUsage, 0) / samples.length),
      renderTime: Math.round(renderTime)
    }
    
    // Check against targets
    const issues: string[] = []
    
    if (avgMetrics.fps < target.minFPS) {
      issues.push(`FPS ${avgMetrics.fps} is below target ${target.minFPS}`)
    }
    
    if (avgMetrics.frameTime > target.maxFrameTime) {
      issues.push(`Frame time ${avgMetrics.frameTime}ms exceeds target ${target.maxFrameTime}ms`)
    }
    
    if (avgMetrics.memoryUsage > target.maxMemory) {
      issues.push(`Memory usage ${avgMetrics.memoryUsage}MB exceeds target ${target.maxMemory}MB`)
    }
    
    return {
      renderer,
      nodeCount: target.nodeCount,
      metrics: avgMetrics,
      passed: issues.length === 0,
      issues
    }
  }
  
  private async generateReport(): Promise<void> {
    console.log('\n📋 Generating performance report...')
    
    const timestamp = new Date().toISOString()
    const reportData = {
      timestamp,
      results: this.results,
      summary: this.generateSummary()
    }
    
    // Write JSON report
    const reportPath = path.join(process.cwd(), 'performance-report.json')
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2))
    
    // Generate markdown report
    const markdown = this.generateMarkdown(reportData)
    const mdPath = path.join(process.cwd(), 'performance-report.md')
    await fs.writeFile(mdPath, markdown)
    
    console.log(`\n📄 Reports saved to:`)
    console.log(`   - ${reportPath}`)
    console.log(`   - ${mdPath}`)
  }
  
  private generateSummary(): any {
    const konvaResults = this.results.filter(r => r.renderer === 'konva')
    const pixiResults = this.results.filter(r => r.renderer === 'pixi')
    
    const improvements = konvaResults.map((konva, i) => {
      const pixi = pixiResults[i]
      return {
        nodeCount: konva.nodeCount,
        fpsImprovement: ((pixi.metrics.fps - konva.metrics.fps) / konva.metrics.fps * 100).toFixed(1),
        frameTimeImprovement: ((konva.metrics.frameTime - pixi.metrics.frameTime) / konva.metrics.frameTime * 100).toFixed(1),
        memoryImprovement: ((konva.metrics.memoryUsage - pixi.metrics.memoryUsage) / konva.metrics.memoryUsage * 100).toFixed(1)
      }
    })
    
    return {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      improvements
    }
  }
  
  private generateMarkdown(reportData: any): string {
    let md = `# Performance Validation Report\n\n`
    md += `**Date**: ${new Date(reportData.timestamp).toLocaleString()}\n\n`
    
    md += `## Summary\n\n`
    md += `- Total Tests: ${reportData.summary.totalTests}\n`
    md += `- Passed: ${reportData.summary.passed}\n`
    md += `- Failed: ${reportData.summary.failed}\n\n`
    
    md += `## Results by Renderer\n\n`
    
    // Konva results
    md += `### Konva Renderer\n\n`
    md += `| Nodes | FPS | Frame Time | Memory | Status |\n`
    md += `|-------|-----|------------|--------|--------|\n`
    
    this.results.filter(r => r.renderer === 'konva').forEach(r => {
      const status = r.passed ? '✅ Pass' : '❌ Fail'
      md += `| ${r.nodeCount} | ${r.metrics.fps} | ${r.metrics.frameTime}ms | ${r.metrics.memoryUsage}MB | ${status} |\n`
    })
    
    // PixiJS results
    md += `\n### PixiJS Renderer\n\n`
    md += `| Nodes | FPS | Frame Time | Memory | Status |\n`
    md += `|-------|-----|------------|--------|--------|\n`
    
    this.results.filter(r => r.renderer === 'pixi').forEach(r => {
      const status = r.passed ? '✅ Pass' : '❌ Fail'
      md += `| ${r.nodeCount} | ${r.metrics.fps} | ${r.metrics.frameTime}ms | ${r.metrics.memoryUsage}MB | ${status} |\n`
    })
    
    // Improvements
    md += `\n## Performance Improvements (PixiJS vs Konva)\n\n`
    md += `| Nodes | FPS Improvement | Frame Time Improvement | Memory Improvement |\n`
    md += `|-------|----------------|----------------------|-------------------|\n`
    
    reportData.summary.improvements.forEach((imp: any) => {
      md += `| ${imp.nodeCount} | ${imp.fpsImprovement}% | ${imp.frameTimeImprovement}% | ${imp.memoryImprovement}% |\n`
    })
    
    // Issues
    const failedTests = this.results.filter(r => !r.passed)
    if (failedTests.length > 0) {
      md += `\n## Issues Found\n\n`
      
      failedTests.forEach(test => {
        md += `### ${test.renderer.toUpperCase()} - ${test.nodeCount} nodes\n`
        test.issues.forEach(issue => {
          md += `- ${issue}\n`
        })
        md += '\n'
      })
    }
    
    return md
  }
}

// Run validation
if (require.main === module) {
  new PerformanceValidator().run()
}

export { PerformanceValidator }