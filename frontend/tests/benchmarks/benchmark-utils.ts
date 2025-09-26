/**
 * Performance benchmark utilities for PixiJS renderer
 */

export interface BenchmarkResult {
  name: string
  fps: number
  frameTime: number
  duration: number
  samples: number[]
  drawCalls: number
  memoryUsage: number
}

export class PerformanceBenchmark {
  private startTime: number = 0
  private samples: number[] = []
  private lastFrameTime: number = 0
  private frameCount: number = 0

  start(): void {
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime
    this.samples = []
    this.frameCount = 0
  }

  recordFrame(): void {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    this.samples.push(frameTime)
    this.lastFrameTime = now
    this.frameCount++
  }

  getResult(name: string): BenchmarkResult {
    const duration = performance.now() - this.startTime
    const avgFrameTime = this.samples.reduce((a, b) => a + b, 0) / this.samples.length
    const fps = 1000 / avgFrameTime

    // Estimate memory usage (will be replaced with actual measurement)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0

    return {
      name,
      fps: Math.round(fps * 100) / 100,
      frameTime: Math.round(avgFrameTime * 100) / 100,
      duration: Math.round(duration),
      samples: this.samples,
      drawCalls: 0, // Will be populated by PixiJS metrics
      memoryUsage: Math.round(memoryUsage / 1024 / 1024) // Convert to MB
    }
  }

  static async runBenchmark(
    name: string,
    setup: () => Promise<void>,
    run: () => void,
    teardown: () => Promise<void>,
    duration: number = 5000
  ): Promise<BenchmarkResult> {
    const benchmark = new PerformanceBenchmark()
    
    await setup()
    
    benchmark.start()
    const endTime = performance.now() + duration
    
    while (performance.now() < endTime) {
      run()
      benchmark.recordFrame()
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    
    await teardown()
    
    return benchmark.getResult(name)
  }
}

export function assertPerformance(result: BenchmarkResult, minFPS: number): void {
  if (result.fps < minFPS) {
    throw new Error(`Performance requirement not met: ${result.fps} FPS < ${minFPS} FPS required`)
  }
}

export function assertMemoryUsage(result: BenchmarkResult, maxMemoryMB: number): void {
  if (result.memoryUsage > maxMemoryMB) {
    throw new Error(`Memory requirement not met: ${result.memoryUsage}MB > ${maxMemoryMB}MB allowed`)
  }
}