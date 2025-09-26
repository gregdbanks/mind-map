import { RendererAPI } from './types'
import { createRendererByName } from './rendererFactory'

interface RollbackConfig {
  errorThreshold: number
  performanceThreshold: {
    minFPS: number
    maxFrameTime: number
    maxMemory: number
  }
  rollbackDelay: number
  maxRetries: number
}

interface HealthMetrics {
  errorCount: number
  avgFPS: number
  avgFrameTime: number
  memoryUsage: number
  lastError?: Error
  timestamp: number
}

export class RollbackManager {
  private config: RollbackConfig
  private currentRenderer: string
  private fallbackRenderer: string
  private healthMetrics: HealthMetrics
  private monitoringInterval?: number
  private retryCount: number = 0
  private onRollback?: (from: string, to: string, reason: string) => void
  
  constructor(config?: Partial<RollbackConfig>) {
    this.config = {
      errorThreshold: 5,
      performanceThreshold: {
        minFPS: 30,
        maxFrameTime: 33.33,
        maxMemory: 200
      },
      rollbackDelay: 2000,
      maxRetries: 3,
      ...config
    }
    
    this.currentRenderer = 'pixi'
    this.fallbackRenderer = 'konva'
    
    this.healthMetrics = {
      errorCount: 0,
      avgFPS: 60,
      avgFrameTime: 16.67,
      memoryUsage: 0,
      timestamp: Date.now()
    }
  }
  
  /**
   * Start monitoring renderer health
   */
  startMonitoring(renderer: RendererAPI, onRollback?: (from: string, to: string, reason: string) => void): void {
    this.onRollback = onRollback
    this.stopMonitoring()
    
    // Set up error tracking
    this.setupErrorTracking(renderer)
    
    // Monitor performance
    this.monitoringInterval = window.setInterval(() => {
      this.checkHealth(renderer)
    }, 1000)
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
  }
  
  /**
   * Set up error tracking
   */
  private setupErrorTracking(renderer: RendererAPI): void {
    // Track WebGL context loss
    if (typeof window !== 'undefined') {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          this.handleError(new Error('WebGL context lost'))
        })
        
        canvas.addEventListener('webglcontextrestored', () => {
          this.healthMetrics.errorCount = Math.max(0, this.healthMetrics.errorCount - 1)
        })
      }
    }
    
    // Track renderer errors
    renderer.on('error', (error: Error) => {
      this.handleError(error)
    })
  }
  
  /**
   * Handle renderer error
   */
  private handleError(error: Error): void {
    this.healthMetrics.errorCount++
    this.healthMetrics.lastError = error
    
    console.error('Renderer error:', error)
    
    // Check if rollback needed
    if (this.healthMetrics.errorCount >= this.config.errorThreshold) {
      this.triggerRollback('Too many errors')
    }
  }
  
  /**
   * Check renderer health
   */
  private checkHealth(renderer: RendererAPI): void {
    try {
      const metrics = renderer.getPerformanceMetrics()
      
      // Update health metrics
      const alpha = 0.3 // Exponential moving average factor
      this.healthMetrics.avgFPS = this.healthMetrics.avgFPS * (1 - alpha) + metrics.fps * alpha
      this.healthMetrics.avgFrameTime = this.healthMetrics.avgFrameTime * (1 - alpha) + metrics.frameTime * alpha
      this.healthMetrics.memoryUsage = metrics.memoryUsage
      this.healthMetrics.timestamp = Date.now()
      
      // Check performance thresholds
      const reasons: string[] = []
      
      if (this.healthMetrics.avgFPS < this.config.performanceThreshold.minFPS) {
        reasons.push(`Low FPS: ${this.healthMetrics.avgFPS.toFixed(1)}`)
      }
      
      if (this.healthMetrics.avgFrameTime > this.config.performanceThreshold.maxFrameTime) {
        reasons.push(`High frame time: ${this.healthMetrics.avgFrameTime.toFixed(1)}ms`)
      }
      
      if (this.healthMetrics.memoryUsage > this.config.performanceThreshold.maxMemory) {
        reasons.push(`High memory: ${this.healthMetrics.memoryUsage}MB`)
      }
      
      if (reasons.length > 0) {
        console.warn('Performance issues detected:', reasons.join(', '))
        
        // Give some time for performance to recover
        setTimeout(() => {
          // Re-check performance
          const currentMetrics = renderer.getPerformanceMetrics()
          if (currentMetrics.fps < this.config.performanceThreshold.minFPS) {
            this.triggerRollback(reasons.join(', '))
          }
        }, this.config.rollbackDelay)
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }
  
  /**
   * Trigger rollback to fallback renderer
   */
  private triggerRollback(reason: string): void {
    if (this.retryCount >= this.config.maxRetries) {
      console.error('Max rollback retries reached, staying with current renderer')
      return
    }
    
    this.retryCount++
    
    console.warn(`Triggering rollback from ${this.currentRenderer} to ${this.fallbackRenderer}. Reason: ${reason}`)
    
    // Notify callback
    if (this.onRollback) {
      this.onRollback(this.currentRenderer, this.fallbackRenderer, reason)
    }
    
    // Swap renderers
    const temp = this.currentRenderer
    this.currentRenderer = this.fallbackRenderer
    this.fallbackRenderer = temp
    
    // Reset health metrics
    this.healthMetrics = {
      errorCount: 0,
      avgFPS: 60,
      avgFrameTime: 16.67,
      memoryUsage: 0,
      timestamp: Date.now()
    }
  }
  
  /**
   * Get current health status
   */
  getHealthStatus(): {
    healthy: boolean
    metrics: HealthMetrics
    currentRenderer: string
  } {
    const healthy = 
      this.healthMetrics.errorCount < this.config.errorThreshold &&
      this.healthMetrics.avgFPS >= this.config.performanceThreshold.minFPS &&
      this.healthMetrics.avgFrameTime <= this.config.performanceThreshold.maxFrameTime &&
      this.healthMetrics.memoryUsage <= this.config.performanceThreshold.maxMemory
    
    return {
      healthy,
      metrics: { ...this.healthMetrics },
      currentRenderer: this.currentRenderer
    }
  }
  
  /**
   * Reset rollback counter
   */
  resetRetryCount(): void {
    this.retryCount = 0
  }
  
  /**
   * Force rollback (for testing)
   */
  forceRollback(reason: string = 'Manual rollback'): void {
    this.triggerRollback(reason)
  }
}