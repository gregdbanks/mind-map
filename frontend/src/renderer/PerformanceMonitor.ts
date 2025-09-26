import * as PIXI from 'pixi.js'
import { PerformanceMetrics } from './types'

export class PerformanceMonitor {
  private app: PIXI.Application
  private metrics: PerformanceMetrics
  private frameCount: number = 0
  private lastTime: number = 0
  private fpsHistory: number[] = []
  private frameTimeHistory: number[] = []
  private historySize: number = 60
  private drawCallCounter: number = 0
  private lastDrawCallReset: number = 0

  constructor(app: PIXI.Application) {
    this.app = app
    
    // Initialize metrics
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      nodeCount: 0,
      visibleNodeCount: 0,
      memoryUsage: 0
    }
    
    this.lastTime = performance.now()
    
    // Hook into renderer for draw call counting
    this.hookRenderer()
  }

  private hookRenderer(): void {
    // Override render method to count draw calls
    const originalRender = this.app.renderer.render.bind(this.app.renderer)
    
    this.app.renderer.render = (...args: any[]) => {
      this.drawCallCounter++
      originalRender(...args)
    }
  }

  update(delta: number): void {
    this.frameCount++
    
    const now = performance.now()
    const deltaTime = now - this.lastTime
    
    // Update every second
    if (deltaTime >= 1000) {
      // Calculate FPS
      this.metrics.fps = Math.round((this.frameCount / deltaTime) * 1000)
      
      // Calculate average frame time
      this.metrics.frameTime = deltaTime / this.frameCount
      
      // Update draw calls
      this.metrics.drawCalls = Math.round(this.drawCallCounter / this.frameCount)
      
      // Update history
      this.fpsHistory.push(this.metrics.fps)
      this.frameTimeHistory.push(this.metrics.frameTime)
      
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift()
      }
      if (this.frameTimeHistory.length > this.historySize) {
        this.frameTimeHistory.shift()
      }
      
      // Update memory usage
      if ((performance as any).memory) {
        this.metrics.memoryUsage = Math.round(
          (performance as any).memory.usedJSHeapSize / 1024 / 1024
        )
      }
      
      // Count visible nodes
      this.updateVisibleNodeCount()
      
      // Reset counters
      this.frameCount = 0
      this.drawCallCounter = 0
      this.lastTime = now
    }
  }

  private updateVisibleNodeCount(): void {
    let visibleCount = 0
    
    // Count visible children in the stage
    const countVisible = (container: PIXI.Container) => {
      if (container.visible && container.worldVisible) {
        if (container.name === 'node') {
          visibleCount++
        }
        container.children.forEach((child) => {
          if (child instanceof PIXI.Container) {
            countVisible(child)
          }
        })
      }
    }
    
    countVisible(this.app.stage)
    this.metrics.visibleNodeCount = visibleCount
  }

  setNodeCount(count: number): void {
    this.metrics.nodeCount = count
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.metrics.fps
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.fpsHistory.length)
  }

  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return this.metrics.frameTime
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0)
    return sum / this.frameTimeHistory.length
  }

  reset(): void {
    this.frameCount = 0
    this.drawCallCounter = 0
    this.fpsHistory = []
    this.frameTimeHistory = []
    this.lastTime = performance.now()
  }

  createOverlay(): PIXI.Container {
    const overlay = new PIXI.Container()
    overlay.name = 'performanceOverlay'
    
    // Background
    const bg = new PIXI.Graphics()
    bg.beginFill(0x000000, 0.7)
    bg.drawRoundedRect(0, 0, 200, 120, 5)
    bg.endFill()
    overlay.addChild(bg)
    
    // Text style
    const style = new PIXI.TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x00ff00,
      lineHeight: 16
    })
    
    // Create text elements
    const fpsText = new PIXI.Text('FPS: 0', style)
    fpsText.position.set(10, 10)
    overlay.addChild(fpsText)
    
    const frameTimeText = new PIXI.Text('Frame: 0.0ms', style)
    frameTimeText.position.set(10, 30)
    overlay.addChild(frameTimeText)
    
    const nodesText = new PIXI.Text('Nodes: 0/0', style)
    nodesText.position.set(10, 50)
    overlay.addChild(nodesText)
    
    const drawCallsText = new PIXI.Text('Draws: 0', style)
    drawCallsText.position.set(10, 70)
    overlay.addChild(drawCallsText)
    
    const memoryText = new PIXI.Text('Mem: 0MB', style)
    memoryText.position.set(10, 90)
    overlay.addChild(memoryText)
    
    // Update function
    const updateOverlay = () => {
      const metrics = this.getMetrics()
      fpsText.text = `FPS: ${metrics.fps}`
      frameTimeText.text = `Frame: ${metrics.frameTime.toFixed(1)}ms`
      nodesText.text = `Nodes: ${metrics.visibleNodeCount}/${metrics.nodeCount}`
      drawCallsText.text = `Draws: ${metrics.drawCalls}`
      memoryText.text = `Mem: ${metrics.memoryUsage}MB`
      
      // Color code FPS
      if (metrics.fps >= 60) {
        fpsText.style.fill = 0x00ff00 // Green
      } else if (metrics.fps >= 30) {
        fpsText.style.fill = 0xffff00 // Yellow
      } else {
        fpsText.style.fill = 0xff0000 // Red
      }
    }
    
    // Update every frame
    this.app.ticker.add(updateOverlay)
    
    // Store update function for cleanup
    (overlay as any).updateFunction = updateOverlay
    
    return overlay
  }

  destroyOverlay(overlay: PIXI.Container): void {
    const updateFunction = (overlay as any).updateFunction
    if (updateFunction) {
      this.app.ticker.remove(updateFunction)
    }
    overlay.destroy({ children: true })
  }

  destroy(): void {
    this.reset()
  }
}